/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  /**
   * @param req 
   * @returns 
   */
  me(req: any) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  /**
   * Permet de créer un utilisateur
   * @param req 
   * @returns 
   */
  async create(req: { email: string; password: string }) {
    try {
      const userRecord = await admin.auth().createUser({
        email: req.email,
        password: req.password,
        emailVerified: false,
        disabled: false,
        displayName: req.email,
      });

      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
}
