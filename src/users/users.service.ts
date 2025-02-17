import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  me() {
    return 'me';
  }

  async create(req: {
    email: string;
    password: string;
  }) {
    try {
      const userRecord = await admin.auth().createUser({
        email: req.email,
        password: req.password,
        emailVerified: false,
        disabled: false
      });
      
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

}
