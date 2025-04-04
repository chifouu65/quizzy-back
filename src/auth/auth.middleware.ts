import {
  Inject,
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from './ports/auth.repository';
import { IncomingHttpHeaders } from 'http'; // Import correct type for headers

export interface TokenDetails {
  email: string;
  uid: string;
}

export interface RequestModel extends Request {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any; // Ajoutez uniquement la propriété `user`
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    @Inject(AuthRepository) private readonly repository: AuthRepository,
  ) {}

  public async use(
    req: RequestModel,
    _: Response,
    next: (error?: Error | unknown) => void,
  ) {
    const headers = req.headers; // Utilisation directe des en-têtes typés
    if (headers['authorization'] === 'Bearer mock-token') {
      console.log('Mock authorization detected');
      return next();
    }
    try {
      const authorization = headers['authorization'];
      if (!authorization) {
        console.log('no authorization');
        req.user = null; // Allow unauthenticated access for certain routes
        return next();
      }
      req.user = await this.authenticate(authorization);
      next();
    } catch (err) {
      console.log('error', err);
      req.user = null;
      next();
    }
  }

  async authenticate(authToken: string): Promise<TokenDetails> {
    const tokenString = this.getToken(authToken);
    try {
      return this.repository.getUserFromToken(tokenString);
    } catch (err) {
      this.logger.error(`error while authenticate request ${err.message}`);
      throw new UnauthorizedException(err.message);
    }
  }

  private getToken(authToken: string): string {
    const match = authToken.match(/^Bearer (.*)$/);
    if (!match || match.length < 2) {
      throw new UnauthorizedException('Invalid token');
    }
    return match[1];
  }
}
