import { Injectable } from '@nestjs/common';

@Injectable()
export class PingService {
  pong() {
    return 'pong';
  }
}
