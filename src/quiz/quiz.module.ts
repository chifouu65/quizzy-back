import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { FirestoreModule } from '../firestore/firestore.module';

@Module({
  imports: [FirestoreModule], // 🔥 Assure l'accès à Firestore
  controllers: [QuizController], // ✅ Enregistre le contrôleur
  providers: [QuizService], // ✅ Enregistre le service
  exports: [QuizService], // 🔥 Permet d'utiliser QuizService ailleurs
})
export class QuizModule {}
