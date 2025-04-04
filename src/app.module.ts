import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PingModule } from './ping/ping.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { FirestoreModule } from './firestore/firestore.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { QuizModule } from './quiz/quiz.module';
import { UsersController } from './users/users.controller';
import { PingController } from './ping/ping.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirestoreModule.forRoot({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        key: configService.get<string>('SA_KEY'),
      }),
      inject: [ConfigService],
    }),
    PingModule,
    UsersModule,
    AuthModule,
    QuizModule
  ],
  controllers: [AppController, UsersController, PingController],
  providers: [AppService, AuthMiddleware],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    /**
     * Authentification ici a implémenter dans un module
     */
    if (!admin.apps.length) { // Prevent multiple Firebase initializations
      const serviceAccountPath = this.configService.get<string>('SA_KEY') || './test/mocks/mock-service-account.json';
      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, 'utf8'),
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
  

  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'api/users/*', method: RequestMethod.ALL },
        { path: 'api/ping', method: RequestMethod.ALL },
      );
  }

}
