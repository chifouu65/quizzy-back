import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Quiz } from './models/quiz.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class QuizService {
  private readonly QUIZ_COLLECTION = 'quizzes';

  /** 🔹 Récupère tous les quiz de l'utilisateur */
  async getUserQuizzes(
    userId: string,
  ): Promise<{ id: string; title: string }[]> {
    console.log(`Fetching quizzes for user ID: ${userId}`);
    const quizzesRef = admin.firestore().collection(this.QUIZ_COLLECTION);
    const snapshot = await quizzesRef.where('ownerId', '==', userId).get();

    if (snapshot.empty) {
      console.error(`No quizzes found for user ID: ${userId}`);
      return [];
    }

    console.log(`Found ${snapshot.size} quizzes for user ID: ${userId}`);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title,
    }));
  }

  /** 🔹 Crée un nouveau quiz */
  async createQuiz(
    createQuizDto: CreateQuizDto,
    userId: string,
  ): Promise<Quiz> {
    try {
      const quizRef = admin.firestore().collection(this.QUIZ_COLLECTION).doc();

      await quizRef.set({
        title: createQuizDto.title.trim(),
        description: createQuizDto.description?.trim(),
        ownerId: userId,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });

      return {
        id: quizRef.id,
        title: createQuizDto.title.trim(),
        description: createQuizDto.description?.trim(),
        ownerId: userId,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      } as Quiz;
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new Error(`Failed to create quiz: ${error.message}`);
    }
  }

  /** 🔹 Utilitaire pour compter les quiz d'un utilisateur */
  private async getUserQuizCount(userId: string): Promise<number> {
    const quizzesRef = admin.firestore().collection(this.QUIZ_COLLECTION);
    const snapshot = await quizzesRef.where('ownerId', '==', userId).get();

    return snapshot.size;
  }
}
