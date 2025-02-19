import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      // 🔥 Vérifie le token Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = decodedToken; // ✅ Ajoute l'UID de l'utilisateur à la requête

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
