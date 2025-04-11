import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MockAuthMiddleware, mockFirestore } from './mocks/firebase-auth.mock';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Firebase initialization is already handled in AppModule, no duplication here
    mockFirestore();
    MockAuthMiddleware.injectMockUser(app, { uid: '12345678', email: 'michel@gmail.com' }); // Ensure mock user is injected
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
          expect(res.body).toEqual({ uid: '12345678', email: 'michel@gmail.com' }); // Match mock user data
        });
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close(); // Ensure app is properly closed
    }
  });
});
