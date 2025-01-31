import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PingModule } from './ping/ping.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { FirestoreModule } from './firestore/firestore.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    /**
     * Authentification ici a implémenter dans un module
     */
    const serviceAccount = JSON.parse(
      readFileSync(this.configService.get<string>('SA_KEY'), 'utf8'),
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
