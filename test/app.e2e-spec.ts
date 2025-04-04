import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MockAuthMiddleware, initializeFirebaseForTests, mockFirestore } from './mocks/firebase-auth.mock';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    initializeFirebaseForTests();
    mockFirestore();
    MockAuthMiddleware.injectMockUser(app, { uid: 'test-user-id', email: 'test@example.com' }); // Inject correct mock user
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('users', () => {
    it('/GET api/users/me', () => {
      return request(app.getHttpServer())
        .get('/api/users/me') // Correct route
        .expect(200)
        .expect((res) => {
          console.log('Réponse reçue:', res.body);
          expect(res.body).toEqual({ uid: 'test-user-id', email: 'test@example.com' }); // Match mock user data
        });
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close(); // Ensure app is properly closed
    }
  });
});
