import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { QuizService } from '../src/quiz/quiz.service';
import { QuizController } from '../src/quiz/quiz.controller';

// Mock pour QuizService
class MockQuizService {
  async getUserQuizzes(userId: string) {
    // Simuler un quiz qui peut être démarré et un qui ne peut pas
    return [
      { 
        id: 'quiz-1', 
        title: 'Premier Quiz',
        _links: {
          start: 'http://localhost:3000/api/quiz/quiz-1/start'
        }
      },
      { id: 'quiz-2', title: 'Deuxième Quiz' },
    ];
  }

  async createQuiz(createQuizDto: any, userId: string) {
    return {
      id: 'new-quiz-id',
      title: createQuizDto.title,
      description: createQuizDto.description,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getQuizById(quizId: string, userId: string) {
    if (quizId === 'not-found') {
      throw new Error('Quiz not found');
    }
    return {
      id: quizId,
      title: 'Quiz de Test',
      description: 'Description du quiz de test',
      ownerId: userId,
      questions: [
        {
          id: 'question-1',
          title: 'Question 1',
          answers: [
            { title: 'Réponse 1', isCorrect: true },
            { title: 'Réponse 2', isCorrect: false }
          ]
        },
        {
          id: 'question-2',
          title: 'Question 2',
          answers: [
            { title: 'Réponse A', isCorrect: false },
            { title: 'Réponse B', isCorrect: true }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteQuiz(quizId: string, userId: string) {
    return true;
  }

  async addQuestion(quizId: string, userId: string, question: any) {
    return 'new-question-id';
  }

  async updateQuestion(quizId: string, questionId: string, updateQuestionDto: any, userId: string) {
    return true;
  }

  async updateQuiz(quizId: string, updateData: any, userId: string) {
    return {
      id: quizId,
      title: updateData[0].value,
      description: 'Description du quiz',
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async startQuiz(quizId: string, userId: string) {
    return 'ABCDEF'; // Identifiant d'exécution
  }
}

// Mock pour request.user
const mockRequest = () => {
  return {
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
    },
  };
};

describe('Quiz Tests (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Création du module de test
    const moduleRef = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        {
          provide: QuizService,
          useClass: MockQuizService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    
    // Intercepter les requêtes pour ajouter l'utilisateur mocké
    app.use((req, res, next) => {
      req.user = mockRequest().user;
      next();
    });
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Tests pour les quiz
  describe('Quiz Service', () => {
    // issue 5: Get all quizz for user
    it('devrait récupérer tous les quiz de l\'utilisateur', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/quiz')
        .expect(200);
  
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].id).toBe('quiz-1');
      expect(response.body.data[1].id).toBe('quiz-2');
    });
  
    // issue 6: Create quiz, Simple form
    it('devrait créer un nouveau quiz', async () => {
      const createQuizDto = {
        title: 'Nouveau Quiz',
        description: 'Description du nouveau quiz',
      };
  
      const response = await request(app.getHttpServer())
        .post('/api/quiz')
        .send(createQuizDto)
        .expect(201);
  
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('new-quiz-id');
      expect(response.body.data.title).toBe(createQuizDto.title);
      expect(response.body.data.description).toBe(createQuizDto.description);
    });
  
    // issue 7: Get quiz by id
    it('devrait récupérer un quiz par son ID', async () => {
      const quizId = 'quiz-test';
  
      const response = await request(app.getHttpServer())
        .get(`/api/quiz/${quizId}`)
        .expect(200);
  
      expect(response.body).toBeDefined();
      expect(response.body.title).toBe('Quiz de Test');
      expect(response.body.description).toBe('Description du quiz de test');
    });
  
    // issue 8: Update Quiz title
    it('devrait mettre à jour le titre d\'un quiz', async () => {
      const quizId = 'quiz-test';
      const updateData = [
        { op: 'replace', path: '/title', value: 'Titre Mis à Jour' }
      ];
  
      const response = await request(app.getHttpServer())
        .patch(`/api/quiz/${quizId}`)
        .send(updateData)
        .expect(200);
  
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('Titre Mis à Jour');
    });
  
    // issue 9: Add new question
    it('devrait ajouter une question à un quiz', async () => {
      const quizId = 'quiz-test';
      const questionDto = {
        title: 'Nouvelle Question',
        answers: [
          { title: 'Réponse 1', isCorrect: true },
          { title: 'Réponse 2', isCorrect: false },
        ],
      };
  
      const response = await request(app.getHttpServer())
        .post(`/api/quiz/${quizId}/questions`)
        .send(questionDto)
        .expect(201);
  
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe('new-question-id');
      expect(response.body.location).toBeDefined();
    });
  
    // issue 10: Quiz details : return list of questions
    it('devrait retourner la liste des questions d\'un quiz', async () => {
      const quizId = 'quiz-test';
  
      const response = await request(app.getHttpServer())
        .get(`/api/quiz/${quizId}`)
        .expect(200);
  
      expect(response.body).toBeDefined();
      expect(response.body.questions).toBeDefined();
      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions.length).toBe(2);
      expect(response.body.questions[0].id).toBe('question-1');
      expect(response.body.questions[1].id).toBe('question-2');
    });
  
    // issue 11: Update question
    it('devrait mettre à jour une question', async () => {
      const quizId = 'quiz-test';
      const questionId = 'question-test';
      const updateQuestionDto = {
        title: 'Question Mise à Jour',
        answers: [
          { title: 'Réponse Mise à Jour', isCorrect: true },
          { title: 'Autre Réponse', isCorrect: false },
        ],
      };
  
      await request(app.getHttpServer())
        .put(`/api/quiz/${quizId}/questions/${questionId}`)
        .send(updateQuestionDto)
        .expect(200);
    });
  
    // issue 12: GetAllQuiz: add url to create
    it('devrait inclure l\'URL de création dans la liste des quiz', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/quiz')
        .expect(200);
  
      expect(response.body._links).toBeDefined();
      expect(response.body._links.create).toBeDefined();
    });
  
    // issue 13: GetAllQuiz : add start url when quiz is startable
    it('devrait inclure l\'URL de démarrage pour les quiz démarrables', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/quiz')
        .expect(200);
  
      expect(response.body.data[0]._links).toBeDefined();
      expect(response.body.data[0]._links.start).toBe('http://localhost:3000/api/quiz/quiz-1/start');
      expect(response.body.data[1]._links).toBeUndefined();
    });
  
    // issue 14: Start a quiz
    it('devrait démarrer un quiz', async () => {
      const quizId = 'quiz-test';
  
      const response = await request(app.getHttpServer())
        .post(`/api/quiz/${quizId}/start`)
        .expect(201);
  
      expect(response.header.location).toBeDefined();
      expect(response.header.location).toContain('/api/execution/');
    });
  });
}); 