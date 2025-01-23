import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  me(req: Request) {
    console.log(req);
    return 'me';
  }
}
