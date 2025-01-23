import { Test, TestingModule } from '@nestjs/testing';
import { FirestoreController } from './firestore.controller';
import { FirestoreService } from './firestore.service';

describe('FirestoreController', () => {
  let controller: FirestoreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirestoreController],
      providers: [FirestoreService],
    }).compile();

    controller = module.get<FirestoreController>(FirestoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
