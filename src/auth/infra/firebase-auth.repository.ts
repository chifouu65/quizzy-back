import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UserDetails } from '../model/user-details';
import { AuthRepository } from '../ports/auth.repository';

@Injectable()
export class FirebaseAuthRepository implements AuthRepository {
  async getUserFromToken(token: string): Promise<UserDetails> {
    const decodedToken = await admin.auth().verifyIdToken(token);

    return {
      email: decodedToken.email,
      uid: decodedToken.uid,
    };
  }

  async getUserByUid(uid: string): Promise<UserDetails> {
    return await admin
      .auth()
      .getUser(uid)
      .then((user) => ({
        email: user.email,
        uid: user.uid,
      }));
  }
}
