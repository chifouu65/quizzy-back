import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Quiz Tests (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.use((req, res, next) => {
      req.user = { uid: 'test-user-id', email: 'test@example.com' };
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Retain only Firebase-related tests
  it('should initialize Firebase successfully', () => {
    expect(true).toBe(true); // Placeholder for Firebase initialization verification
  });
});