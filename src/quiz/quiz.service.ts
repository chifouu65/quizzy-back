import { Inject, Injectable } from '@nestjs/common';
import { Firestore, Timestamp, FieldValue } from '@google-cloud/firestore';
import { Quiz, CreateQuizDto } from './models/quiz.model';
import { FirestoreDatabaseProvider } from '../firestore/firestore.providers';

@Injectable()
export class QuizService {
  constructor(
    @Inject(FirestoreDatabaseProvider) private readonly firestore: Firestore
  ) {}

  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    try {
      const quizzesRef = this.firestore
        .collection('quizzes')
        .where('ownerId', '==', userId)
        .orderBy('createdAt', 'desc');
      
      const snapshot = await quizzesRef.get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Quiz));
    } catch (error) {
      throw new Error(`Failed to get user quizzes: ${error.message}`);
    }
  }

  async createQuiz(userId: string, quizData: CreateQuizDto): Promise<Quiz> {
    try {
      const newQuiz = {
        ...quizData,
        ownerId: userId,
        createdAt: FieldValue.serverTimestamp(),
      };

      const docRef = await this.firestore.collection('quizzes').add(newQuiz);
      const doc = await docRef.get();

      return {
        id: doc.id,
        ...doc.data(),
      } as Quiz;
    } catch (error) {
      throw new Error(`Failed to create quiz: ${error.message}`);
    }
  }

  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      const doc = await this.firestore.collection('quizzes').doc(quizId).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as Quiz;
    } catch (error) {
      throw new Error(`Failed to get quiz: ${error.message}`);
    }
  }
} 