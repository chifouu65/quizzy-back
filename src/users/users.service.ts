import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  me() {
    return 'me';
  }
}
