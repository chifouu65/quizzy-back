import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Quiz } from './models/quiz.model';
import { CreateQuizDto } from './dto/create-quiz.dto';
import * as admin from 'firebase-admin';
import { CreateQuestionDto } from './dto/create-question.dto';
import { executionRooms, ExecutionRoom } from './interfaces/execution-room.interface';

@Injectable()
export class QuizService {
  private readonly QUIZ_COLLECTION = 'quizzes';

  async getUserQuizzes(userId: string): Promise<{ id: string; title: string; _links?: { start?: string } }[]> {
    try {
      const quizzesRef = admin.firestore().collection(this.QUIZ_COLLECTION);
      const snapshot = await quizzesRef.where('ownerId', '==', userId).get();

      return snapshot.docs.map((doc) => {
        const quiz = { id: doc.id, ...doc.data() } as Quiz;
        const result: any = { id: quiz.id, title: quiz.title };
        if (this.isQuizStartable(quiz)) {
          result._links = { start: `http://localhost:3000/api/quiz/${quiz.id}/start` };
        }
        return result;
      });
    } catch (error) {
      throw new Error(`Failed to get user quizzes: ${error.message}`);
    }
  }

  async createQuiz(createQuizDto: CreateQuizDto, userId: string): Promise<Quiz> {
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
      throw error instanceof BadRequestException ? error : new Error(`Failed to create quiz: ${error.message}`);
    }
  }

  async getQuizById(quizId: string, userId: string): Promise<Quiz> {
    try {
      const quizDoc = await admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId).get();
      if (!quizDoc.exists) throw new NotFoundException('Quiz not found');

      const quizData = quizDoc.data();
      if (quizData.ownerId !== userId) throw new NotFoundException('Quiz not found');

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
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to get quiz: ${error.message}`);
    }
  }

  async updateQuiz(quizId: string, updateQuizDto: any, userId: string) {
    try {
      const quizRef = admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId);
      const quizDoc = await quizRef.get();

      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) {
        throw new NotFoundException('Quiz not found');
      }

      await quizRef.update({ title: updateQuizDto[0].value });
      return quizRef.get();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to update quiz: ${error.message}`);
    }
  }

  async addQuestion(quizId: string, userId: string, question: CreateQuestionDto): Promise<string> {
    try {
      const quizRef = admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId);
      const quizDoc = await quizRef.get();

      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) throw new NotFoundException('Quiz not found');

      const quizData = quizDoc.data();
      const questions = quizData.questions || [];

      const newQuestion = {
        id: admin.firestore().collection('temp').doc().id,
        title: question.title,
        answers: question.answers,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      questions.push(newQuestion);
      await quizRef.update({ questions, updatedAt: admin.firestore.Timestamp.now() });
      return newQuestion.id;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to add question: ${error.message}`);
    }
  }

  async updateQuestion(quizId: string, questionId: string, updateQuestionDto: any, userId: string): Promise<void> {
    try {
      const quizRef = admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId);
      const quizDoc = await quizRef.get();

      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) throw new NotFoundException('Quiz not found');

      const questions = quizDoc.data().questions || [];
      const index = questions.findIndex((q) => q.id === questionId);
      if (index === -1) throw new NotFoundException('Question not found');

      questions[index] = {
        ...questions[index],
        ...updateQuestionDto,
        updatedAt: admin.firestore.Timestamp.now(),
      };

      await quizRef.update({ questions, updatedAt: admin.firestore.Timestamp.now() });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to update question: ${error.message}`);
    }
  }

  async startQuiz(quizId: string, userId: string): Promise<string> {
    try {
      const quizDoc = await admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId).get();
      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) throw new NotFoundException('Quiz not found');

      const quiz = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
      if (!this.isQuizStartable(quiz)) throw new BadRequestException('Quiz is not ready to be started');

      const executionId = this.generateExecutionId();
      executionRooms.set(executionId, {
        quizId,
        ownerId: userId,
        participants: new Set(),
      });

      await admin.firestore().collection('executions').doc(executionId).set({
        quizId,
        quiz,
        status: 'waiting',
        createdAt: admin.firestore.Timestamp.now(),
        ownerId: userId,
        participants: 0,
        currentQuestion: null,
      });

      return executionId;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new Error(`Failed to start quiz: ${error.message}`);
    }
  }

  private isQuizStartable(quiz: Quiz): boolean {
    if (!quiz.title?.trim()) return false;
    if (!quiz.questions?.length) return false;
    return quiz.questions.every((q) => q.title?.trim() && q.answers?.length >= 2 && q.answers.filter((a) => a.isCorrect).length === 1);
  }

  private generateExecutionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async deleteQuiz(quizId: string, userId: string): Promise<void> {
    try {
      const quizDoc = await admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId).get();
      if (!quizDoc.exists) throw new NotFoundException('Quiz not found');

      const quizData = quizDoc.data();
      if (quizData.ownerId !== userId) throw new UnauthorizedException('Not authorized');

      await admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId).delete();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) throw error;
      throw new Error(`Failed to delete quiz: ${error.message}`);
    }
  }

  async deleteQuestion(quizId: string, questionId: string, userId: string): Promise<void> {
    try {
      const quizDoc = await admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId).get();
      if (!quizDoc.exists) throw new NotFoundException('Quiz not found');

      const quizData = quizDoc.data();
      if (quizData.ownerId !== userId) throw new UnauthorizedException('Not authorized');

      const questions = quizData.questions || [];
      const index = questions.findIndex((q) => q.id === questionId);
      if (index === -1) throw new NotFoundException('Question not found');

      questions.splice(index, 1);
      await admin.firestore().collection(this.QUIZ_COLLECTION).doc(quizId).update({ questions });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) throw error;
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }
}
