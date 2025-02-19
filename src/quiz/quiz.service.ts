import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { Quiz } from './models/quiz.model';
import { FirestoreDatabaseProvider } from '../firestore/firestore.providers';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);
  private readonly QUIZ_COLLECTION = 'quizzes';

  constructor(@Inject(FirestoreDatabaseProvider) private readonly firestore: Firestore) {}

  /** 🔹 Récupère tous les quiz de l'utilisateur */
  async getUserQuizzes(userId: string): Promise<{ id: string; title: string }[]> {
    try {
      this.logger.log(`Fetching quizzes for user: ${userId}`);

      const quizzesRef = this.firestore
        .collection('quizzes')
        .where('ownerId', '==', userId)
        .orderBy('createdAt', 'desc');

      const snapshot = await quizzesRef.get();

      if (snapshot.empty) {
        this.logger.warn(`No quizzes found for user: ${userId}`);
        return [];
      }

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title, // 🔥 On ne récupère que l'ID et le titre
      }));
    } catch (error) {
      this.logger.error(`Failed to get quizzes for user ${userId}: ${error.message}`);
      throw new Error(`Failed to get user quizzes: ${error.message}`);
    }
  }

  /** 🔹 Crée un nouveau quiz */
  async createQuiz(createQuizDto: CreateQuizDto, userId: string): Promise<Quiz> {
    try {
      this.logger.log(`Creating quiz for user: ${userId}`);

      // Validation supplémentaire
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      // Construction de l'objet quiz avec tous les champs nécessaires
      const quiz = {
        title: createQuizDto.title.trim(),
        description: createQuizDto.description?.trim(),
        ownerId: userId,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        status: 'draft', // Ajout d'un statut par défaut
        questions: [], // Initialisation du tableau de questions
      };

      // Transaction Firestore pour garantir l'atomicité
      const quizRef = this.firestore.collection(this.QUIZ_COLLECTION).doc();
      await this.firestore.runTransaction(async (transaction) => {
        // Vérification du nombre de quiz existants pour l'utilisateur
        const userQuizCount = await this.getUserQuizCount(userId);
        if (userQuizCount >= 50) { // Limite arbitraire
          throw new BadRequestException('Quiz limit reached for this user');
        }

        transaction.set(quizRef, quiz);
      });

      // Retourne l'objet quiz complet avec son ID
      return {
        id: quizRef.id,
        ...quiz,
      } as Quiz;

    } catch (error) {
      this.logger.error(`Failed to create quiz for user ${userId}: ${error.message}`);
      throw error instanceof BadRequestException 
        ? error 
        : new Error(`Failed to create quiz: ${error.message}`);
    }
  }

  /** 🔹 Utilitaire pour compter les quiz d'un utilisateur */
  private async getUserQuizCount(userId: string): Promise<number> {
    const snapshot = await this.firestore
      .collection(this.QUIZ_COLLECTION)
      .where('ownerId', '==', userId)
      .count()
      .get();
    
    return snapshot.data().count;
  }
}
