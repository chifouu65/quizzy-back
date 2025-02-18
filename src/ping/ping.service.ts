import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PingService {
  constructor(
    @Inject('FIREBASE_ADMIN') private readonly adminApp: admin.app.App
  ) {}

  pong() {
    return this.adminApp
      .firestore()
      .collection('test')
      .doc('ping')
      .get()
      .then(() => ({
        status: 'OK',
        details: {
          database: 'OK',
        },
      }))
      .catch((err) => {
        console.error(err);
        return {
          status: 'Partial',
          details: {
            database: 'KO',
          },
        };
      });
  }
}
