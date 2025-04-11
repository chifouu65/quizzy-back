import {
  Controller,
  Get,
  Post,
  Request,
  HttpException,
  HttpStatus,
  Body,
  Param,
  UnauthorizedException,
  NotFoundException,
  Patch,
  HttpCode,
  Req,
  Put,
  BadRequestException,
  Res,
  Delete,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { RequestWithUser } from '../auth/model/request-with-user';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { Response } from 'express';

@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * Récupère les quiz de l'utilisateur connecté.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<Object>} Les quiz de l'utilisateur.
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   */
  @Get()
  async getUserQuizzes(@Request() req: RequestWithUser) {
    console.log('getUserQuizzes');
    try {
      if (!req.user || !req.user.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      const quizzes = await this.quizService.getUserQuizzes(req.user.uid);
      return {
        data: quizzes,
        _links: {
          create: 'http://localhost:3000/api/quiz',
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('🚨 Erreur lors de la récupération des quizs:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Crée un nouveau quiz.
   * @param {CreateQuizDto} createQuizDto - Les données du quiz à créer.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<Object>} Le quiz créé.
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   */
  @Post()
  async createQuiz(
    @Body() createQuizDto: CreateQuizDto,
    @Request() req: RequestWithUser,
  ) {
    console.log('createQuiz');
    try {
      if (!req.user || !req.user.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      const userId = req.user.uid;
      const quiz = await this.quizService.createQuiz(createQuizDto, userId);
      return { data: quiz };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Récupère un quiz par son identifiant.
   * @param {string} id - L'identifiant du quiz.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<Object>} Le quiz correspondant.
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   * @throws {NotFoundException} Si le quiz n'est pas trouvé.
   */
  @Get(':id')
  async getQuizById(@Param('id') id: string, @Request() req: RequestWithUser) {
    console.log('getQuizById');
    try {
      if (!req.user || !req.user.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      const quiz = await this.quizService.getQuizById(id, req.user.uid);
      return {
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Met à jour un quiz existant.
   * @param {string} id - L'identifiant du quiz.
   * @param {UpdateQuizDto} updateQuizDto - Les nouvelles données du quiz.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<Object>} Le quiz mis à jour.
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   */
  @Patch(':id')
  async updateQuiz(
    @Param('id') id: string,
    @Body() updateQuizDto: any,
    @Request() req: RequestWithUser,
  ) {
    console.log('updateQuiz');
    try {
      if (!req.user || !req.user.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      const quiz = await this.quizService.updateQuiz(
        id,
        updateQuizDto,
        req.user.uid,
      );
      return { data: quiz };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Ajoute une question à un quiz.
   * @param {string} id - L'identifiant du quiz.
   * @param {CreateQuestionDto} question - Les données de la question à ajouter.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<Object>} L'identifiant de la question ajoutée et son emplacement.
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   * @throws {NotFoundException} Si le quiz n'est pas trouvé.
   */
  @Post(':id/questions')
  async addQuestion(
    @Param('id') id: string,
    @Body() question: CreateQuestionDto,
    @Request() req: RequestWithUser,
  ) {
    console.log('addQuestion');
    try {
      if (!req.user || !req.user.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      const questionId = await this.quizService.addQuestion(
        id,
        req.user.uid,
        question,
      );

      // Définir le header Location avec l'ID de la question
      const location = `http://localhost:3000/api/quiz/${id}/questions/${questionId}`;
      return {
        id: questionId,
        location: location,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `Failed to add question: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Met à jour une question existante dans un quiz.
   * @param {string} quizId - L'identifiant du quiz.
   * @param {string} questionId - L'identifiant de la question.
   * @param {any} updateQuestionDto - Les nouvelles données de la question.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   */
  @Put(':quizId/questions/:questionId')
  async updateQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: any,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    console.log('updateQuestion');
    if (!req.user || !req.user.uid) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.uid;
    await this.quizService.updateQuestion(
      quizId,
      questionId,
      updateQuestionDto,
      userId,
    );
  }

  /**
   * Démarre un quiz.
   * @param {string} id - L'identifiant du quiz.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @param {Response} response - La réponse HTTP.
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   * @throws {NotFoundException} Si le quiz n'est pas trouvé.
   * @throws {BadRequestException} Si le quiz n'est pas prêt à être démarré.
   */
  @Post(':id/start')
  @HttpCode(201)
  async startQuiz(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Res() response: Response,
  ) {
    try {
      if (!req.user?.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      const executionId = await this.quizService.startQuiz(id, req.user.uid);

      // Le front s'attend à un header Location avec l'URL complète
      response
        .setHeader(
          'Location',
          `http://localhost:3000/api/execution/${executionId}`,
        )
        .send();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      if (error instanceof BadRequestException) {
        throw new HttpException(
          'Quiz is not ready to be started',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Supprime un quiz.
   * @param {string} id - L'identifiant du quiz.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   * @throws {NotFoundException} Si le quiz n'est pas trouvé.
   */
  @Delete(':id')
  async deleteQuiz(@Param('id') id: string, @Request() req: RequestWithUser) {
    try {
      if (!req.user || !req.user.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      await this.quizService.deleteQuiz(id, req.user.uid);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Supprime une question d'un quiz.
   * @param {string} quizId - L'identifiant du quiz.
   * @param {string} questionId - L'identifiant de la question.
   * @param {RequestWithUser} req - La requête contenant l'utilisateur authentifié.
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} Si l'utilisateur n'est pas authentifié.
   * @throws {NotFoundException} Si la question n'est pas trouvée.
   */
  @Delete(':quizId/questions/:questionId')
  async deleteQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Request() req: RequestWithUser,
  ) {
    try {
      if (!req.user || !req.user.uid) {
        throw new UnauthorizedException('User not authenticated');
      }

      await this.quizService.deleteQuestion(quizId, questionId, req.user.uid);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
