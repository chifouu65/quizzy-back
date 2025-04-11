import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { initializeFirebaseForTests, mockFirestore } from './mocks/firebase-auth.mock';

describe('Users and Ping (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Initialisation de Firebase et Firestore
    await app.init();
    initializeFirebaseForTests();
    mockFirestore();
    console.log('Application initialisée et mocks configurés.');
  });

  it('/GET api/users', () => {
    return request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', 'Bearer mock-token') // Utilisation du token mocké
      .expect((res) => {
        console.log('Réponse reçue:', res.body);
        expect(res.body).toEqual({ uid: '12345678', email: 'michel@gmail.com' });
      });
  });

  it('/GET api/ping', () => {
    return request(app.getHttpServer())
      .get('/api/ping')
      .expect(200)
      .expect((res) => {
        console.log('Réponse reçue:', res.body);
        expect(res.body).toEqual({ status: 'OK', details: { database: 'OK' } });
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
