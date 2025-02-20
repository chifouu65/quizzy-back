import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Quiz } from './models/quiz.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import * as admin from 'firebase-admin';
import { CreateQuestionDto } from './dto/create-question.dto';

//import { updateQuizDto } from './dto/update-quiz.dto';

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

  async getQuizById(quizId: string, userId: string): Promise<Quiz> {
    try {
      const quizDoc = await admin
        .firestore()
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId)
        .get();

      if (!quizDoc.exists) {
        throw new NotFoundException('Quiz not found');
      }

      const quizData = quizDoc.data();

      if (quizData.ownerId !== userId) {
        throw new NotFoundException('Quiz not found');
      }

      return {
        id: quizDoc.id,
        title: quizData.title,
        description: quizData.description,
        ownerId: quizData.ownerId,
        createdAt: quizData.createdAt,
        updatedAt: quizData.updatedAt,
        questions: quizData.questions || [],
      } as Quiz;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get quiz: ${error.message}`);
    }
  }

  async updateQuiz(quizId: string, updateQuizDto: any, userId: string) {
    try {
      const quizRef = admin
        .firestore()
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId);

      const quizDoc = await quizRef.get();

      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) {
        throw new NotFoundException('Quiz not found');
      }

      await quizRef.update({
        title: updateQuizDto[0].value,
      });

      return quizRef.get();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update quiz: ${error.message}`);
    }
  }

  async addQuestion(quizId: string, userId: string, question: CreateQuestionDto): Promise<string> {
    try {
      const quizRef = admin
        .firestore()
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId);

      const quizDoc = await quizRef.get();

      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) {
        throw new NotFoundException('Quiz not found');
      }

      // Récupérer les questions existantes
      const quizData = quizDoc.data();
      const questions = quizData.questions || [];

      // Créer la nouvelle question avec un ID unique
      const newQuestion = {
        id: admin.firestore().collection('temp').doc().id, // Génère un ID unique
        title: question.title,
        answers: question.answers,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      };

      // Ajouter la nouvelle question à la liste
      questions.push(newQuestion);

      // Mettre à jour le document avec la nouvelle liste de questions
      await quizRef.update({
        questions: questions,
        updatedAt: admin.firestore.Timestamp.now()
      });

      console.log(`✅ Question ajoutée avec succès, ID: ${newQuestion.id}`);
      return newQuestion.id; // Retourne l'ID de la nouvelle question
    } catch (error) {
      console.error(`🚨 Erreur lors de l'ajout de la question:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to add question: ${error.message}`);
    }
  }

  async updateQuestion(quizId: string, questionId: string, updateQuestionDto: any, userId: string): Promise<void> {
    try {
      const quizRef = admin
        .firestore()
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId);

      const quizDoc = await quizRef.get();

      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) {
        throw new NotFoundException('Quiz not found');
      }

      const quizData = quizDoc.data();
      const questions = quizData.questions || [];

      const questionIndex = questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {
        throw new NotFoundException('Question not found');
      }

      questions[questionIndex] = {
        ...questions[questionIndex],
        ...updateQuestionDto,
        updatedAt: admin.firestore.Timestamp.now()
      };

      await quizRef.update({
        questions: questions,
        updatedAt: admin.firestore.Timestamp.now()
      });

      console.log(`✅ Question mise à jour avec succès, ID: ${questionId}`);
    } catch (error) {
      console.error(`🚨 Erreur lors de la mise à jour de la question:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update question: ${error.message}`);
    }
  }
}
