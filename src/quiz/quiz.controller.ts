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
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Auth } from '../auth/auth.decorator';
import { RequestWithUser } from '../auth/model/request-with-user';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /** 🔹 GET /api/quiz/ - Récupère les quiz de l'utilisateur connecté */
  @Get()
  async getUserQuizzes(@Request() req: RequestWithUser) {
    console.log('📥 Requête reçue pour récupérer les quizs');

    try {
      if (!req.user || !req.user.uid) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const userId = req.user.uid;
      console.log('👤 Utilisateur ID:', userId);
      const quizzes = await this.quizService.getUserQuizzes(userId);
      console.log('📦 Quiz récupérés:', quizzes);

      // Add HATEOAS link
      const links = {
        create: '/api/quiz', // Link to the POST endpoint for creating a quiz
      };

      return { data: quizzes, _links: links };
    } catch (error) {
      console.error('🚨 Erreur lors de la récupération des quizs:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** 🔹 POST /api/quiz - Crée un nouveau quiz */
  @Post()
  async createQuiz(
    @Body() createQuizDto: CreateQuizDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      if (!req.user || !req.user.uid) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const userId = req.user.uid;
      const quiz = await this.quizService.createQuiz(createQuizDto, userId);
      return { data: quiz };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getQuizById(@Param('id') id: string, @Request() req: RequestWithUser) {
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
      if (error instanceof NotFoundException) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async updateQuiz(
    @Param('id') id: string,
    @Body() updateQuizDto: any,
    @Request() req: RequestWithUser,
  ) {
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
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
