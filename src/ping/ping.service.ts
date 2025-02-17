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
