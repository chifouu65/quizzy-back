import { Controller, Get, Post, Request, HttpException, HttpStatus, Body } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Auth } from '../auth/auth.decorator';
import { RequestWithUser } from '../auth/model/request-with-user';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /** 🔹 GET /api/quiz/ - Récupère les quiz de l'utilisateur connecté */
  @Get()
  @Auth() // 🔥 Assure que seul un utilisateur connecté peut récupérer ses quiz
  async getUserQuizzes(@Request() req: RequestWithUser) {
    try {
      if (!req.user || !req.user.uid) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const userId = req.user.uid;
      const quizzes = await this.quizService.getUserQuizzes(userId);
      return { data: quizzes };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** 🔹 POST /api/quiz - Crée un nouveau quiz */
  @Post()
  @Auth()
  async createQuiz(@Body() createQuizDto: CreateQuizDto, @Request() req: RequestWithUser) {
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
}
