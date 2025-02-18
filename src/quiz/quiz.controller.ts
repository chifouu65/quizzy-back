import { Controller, Get, Request } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Auth } from '../auth/auth.decorator';
import { RequestWithUser } from '../auth/model/request-with-user';

@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @Auth()
  async getUserQuizzes(@Request() req: RequestWithUser) {
    const userId = req.user.uid;
    const quizzes = await this.quizService.getUserQuizzes(userId);
    return { data: quizzes };
  }
} 