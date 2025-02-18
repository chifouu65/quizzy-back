import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (configService: ConfigService) => {
        const saKeyPath = configService.get<string>('SA_KEY');
        if (!saKeyPath) {
          throw new Error('Variable d\'environnement SA_KEY manquante');
        }

        try {
          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(
                JSON.parse(readFileSync(saKeyPath, 'utf8'))
              ),
            });
          }
          return admin;
        } catch (error) {
          throw new Error(`Erreur d'initialisation Firebase: ${error.message}`);
        }
      },
      inject: [ConfigService],
    }
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {} 