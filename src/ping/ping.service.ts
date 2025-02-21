import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PingService {
  pong() {
    return admin
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
      .catch(() => {
        return {
          status: 'Partial',
          details: {
            database: 'KO',
          },
        };
      });
  }
}
