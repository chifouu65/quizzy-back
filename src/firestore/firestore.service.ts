import { Injectable } from '@nestjs/common';

@Injectable()
export class FirestoreService {
  create() {
    return 'This action adds a new firestore';
  }

  findAll() {
    return `This action returns all firestore`;
  }

}
