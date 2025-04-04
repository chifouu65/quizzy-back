import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MockAuthMiddleware, initializeFirebaseForTests, mockFirestore } from './mocks/firebase-auth.mock';

describe('Users and Ping (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mockFirestore();
    MockAuthMiddleware.injectMockUser(app, { uid: 'test-user-id', email: 'test@example.com' }); // Inject correct mock user
    console.log('Mock user injected for tests.');
    console.log('Application initialisée et mocks configurés.');
  });

  it('/GET api/users', () => {
    return request(app.getHttpServer())
      .get('/api/users/me') // Correct route
      .expect(200)
      .expect((res) => {
        console.log('Réponse reçue:', res.body);
        expect(res.body).toEqual({ uid: 'test-user-id', email: 'test@example.com' }); // Match mock user data
      });
  });

  it('/GET api/ping', () => {
    return request(app.getHttpServer())
      .get('/api/ping') // Correct route
      .expect(200)
      .expect((res) => {
        console.log('Réponse reçue:', res.body);
        expect(res.body).toEqual({ status: 'OK', details: { database: 'OK' } });
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close(); // Ensure app is properly closed
    }
  });
});
