import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { FirestoreModule } from '../firestore/firestore.module';
import { QuizExecutionGateway } from './quiz-execution.gateway';

@Module({
  imports: [FirestoreModule], 
  controllers: [QuizController],
  providers: [QuizService, QuizExecutionGateway], 
  exports: [QuizService], 
})
export class QuizModule {}
