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

//import { updateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizService {
  private readonly QUIZ_COLLECTION = 'quizzes';

  /** 🔹 Récupère tous les quiz de l'utilisateur */
  async getUserQuizzes(
    userId: string,
  ): Promise<{ id: string; title: string; _links?: { start?: string } }[]> {
    try {
      const quizzesRef = admin.firestore().collection(this.QUIZ_COLLECTION);
      const snapshot = await quizzesRef.where('ownerId', '==', userId).get();

      return snapshot.docs.map(doc => {
        const quiz = { id: doc.id, ...doc.data() } as Quiz;
        const result: any = {
          id: quiz.id,
          title: quiz.title
        };

        if (this.isQuizStartable(quiz)) {
          result._links = {
            start: `http://localhost:3000/api/quiz/${quiz.id}/start`
          };
        }

        return result;
      });
    } catch (error) {
      throw new Error(`Failed to get user quizzes: ${error.message}`);
    }
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

  private isQuizStartable(quiz: Quiz): boolean {
    // 1. Vérifier que le titre n'est pas vide
    if (!quiz.title?.trim()) {
      return false;
    }

    // 2. Vérifier qu'il y a au moins une question
    if (!quiz.questions?.length) {
      return false;
    }

    // 3. Vérifier que chaque question est valide
    return quiz.questions.every(question => {
      // Vérifier le titre de la question
      if (!question.title?.trim()) {
        return false;
      }

      // Vérifier qu'il y a au moins 2 réponses
      if (!question.answers?.length || question.answers.length < 2) {
        return false;
      }

      // Compter les réponses correctes
      const correctAnswers = question.answers.filter(answer => answer.isCorrect).length;

      // Il doit y avoir exactement une réponse correcte
      return correctAnswers === 1;
    });
  }

  private generateExecutionId(): string {
    // Génère une chaîne de 6 caractères aléatoires
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async startQuiz(quizId: string, userId: string): Promise<string> {
    try {
      const quizDoc = await admin
        .firestore()
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId)
        .get();

      if (!quizDoc.exists || quizDoc.data().ownerId !== userId) {
        throw new NotFoundException('Quiz not found');
      }

      const quiz = { id: quizDoc.id, ...quizDoc.data() } as Quiz;

      if (!this.isQuizStartable(quiz)) {
        throw new BadRequestException('Quiz is not ready to be started');
      }

      const executionId = this.generateExecutionId();

      // Créer l'exécution dans Firestore avec la structure exacte attendue par le front
      await admin.firestore().collection('executions').doc(executionId).set({
        quizId,
        quiz: quiz,  // Le front attend l'objet quiz complet
        status: 'waiting',
        createdAt: admin.firestore.Timestamp.now(),
        ownerId: userId,
        participants: 0,
        currentQuestion: null
      });

      return executionId;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to start quiz: ${error.message}`);
    }
  }

  async deleteQuiz(quizId: string, userId: string): Promise<void> {
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
        throw new UnauthorizedException('Not authorized to delete this quiz');
      }

      await admin
        .firestore()
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId)
        .delete();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(`Failed to delete quiz: ${error.message}`);
    }
  }

  async deleteQuestion(quizId: string, questionId: string, userId: string): Promise<void> {
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
        throw new UnauthorizedException('Not authorized to delete this question');
      }

      const questions = quizData.questions || [];
      const questionIndex = questions.findIndex(q => q.id === questionId);
      
      if (questionIndex === -1) {
        throw new NotFoundException('Question not found');
      }

      questions.splice(questionIndex, 1);

      await admin
        .firestore()
        .collection(this.QUIZ_COLLECTION)
        .doc(quizId)
        .update({ questions });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }
}
