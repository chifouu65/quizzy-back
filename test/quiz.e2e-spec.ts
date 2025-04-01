import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { QuizModule } from '../src/quiz/quiz.module';
import { AuthModule } from '../src/auth/auth.module';
import { CreateQuizDto } from '../src/quiz/dto/create-quiz.dto';
import { CreateQuestionDto } from '../src/quiz/dto/create-question.dto';
import * as admin from 'firebase-admin';

describe('QuizController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let quizId: string;

  beforeAll(async () => {
    // Réinitialiser l'application Firebase
    try {
      admin.apps.forEach(app => app?.delete());
    } catch (error) {
      console.log('No Firebase apps to delete');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, QuizModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Créer un token Firebase valide pour les tests
    const customToken = await admin.auth().createCustomToken('test-user-id', {
      email: 'test@example.com',
    });

    // Authentification pour obtenir un token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        idToken: customToken,
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/quiz', () => {
    it('should create a new quiz', () => {
      const createQuizDto: CreateQuizDto = {
        title: 'Test Quiz',
        description: 'Test Description',
      };

      return request(app.getHttpServer())
        .post('/api/quiz')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createQuizDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.title).toBe(createQuizDto.title);
          expect(res.body.data.description).toBe(createQuizDto.description);
          quizId = res.body.data.id;
        });
    });

    it('should return 401 when not authenticated', () => {
      const createQuizDto: CreateQuizDto = {
        title: 'Test Quiz',
        description: 'Test Description',
      };

      return request(app.getHttpServer())
        .post('/api/quiz')
        .send(createQuizDto)
        .expect(401);
    });
  });

  describe('GET /api/quiz', () => {
    it('should return user quizzes', () => {
      return request(app.getHttpServer())
        .get('/api/quiz')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body._links).toBeDefined();
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/api/quiz')
        .expect(401);
    });
  });

  describe('GET /api/quiz/:id', () => {
    it('should return quiz by id', () => {
      return request(app.getHttpServer())
        .get(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBeDefined();
          expect(res.body.description).toBeDefined();
          expect(res.body.questions).toBeDefined();
        });
    });

    it('should return 404 for non-existent quiz', () => {
      return request(app.getHttpServer())
        .get('/api/quiz/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/quiz/:id', () => {
    it('should update quiz', () => {
      const updateQuizDto = {
        title: 'Updated Quiz Title',
        description: 'Updated Description',
      };

      return request(app.getHttpServer())
        .patch(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateQuizDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.title).toBe(updateQuizDto.title);
          expect(res.body.data.description).toBe(updateQuizDto.description);
        });
    });
  });

  describe('POST /api/quiz/:id/questions', () => {
    it('should add a question to quiz', () => {
      const questionDto: CreateQuestionDto = {
        title: 'Test Question',
        answers: [
          { title: 'Answer 1', isCorrect: true },
          { title: 'Answer 2', isCorrect: false },
        ],
      };

      return request(app.getHttpServer())
        .post(`/api/quiz/${quizId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.location).toBeDefined();
        });
    });

    it('should return 400 for invalid question data', () => {
      const invalidQuestionDto = {
        title: '',
        answers: [],
      };

      return request(app.getHttpServer())
        .post(`/api/quiz/${quizId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidQuestionDto)
        .expect(400);
    });
  });

  describe('PUT /api/quiz/:quizId/questions/:questionId', () => {
    it('should update question', async () => {
      // D'abord, créons une question pour pouvoir la mettre à jour
      const questionDto: CreateQuestionDto = {
        title: 'Question to Update',
        answers: [
          { title: 'Answer 1', isCorrect: true },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post(`/api/quiz/${quizId}/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionDto);

      const questionId = createResponse.body.id;

      const updateQuestionDto = {
        title: 'Updated Question',
        answers: [
          { title: 'Updated Answer', isCorrect: true },
        ],
      };

      return request(app.getHttpServer())
        .put(`/api/quiz/${quizId}/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateQuestionDto)
        .expect(200);
    });
  });
});