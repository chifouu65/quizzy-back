import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { RequestWithUser } from '../auth/model/request-with-user';
import { UserDetails } from '../auth/model/user-details';
import { Quiz } from './models/quiz.model';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Timestamp } from '@google-cloud/firestore';
import { DocumentSnapshot } from '@google-cloud/firestore';

const mockTimestamp = new Timestamp(1743416499, 904000000);

describe('QuizController', () => {
  let controller: QuizController;
  let service: QuizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        {
          provide: QuizService,
          useValue: {
            createQuiz: jest.fn(),
            getQuiz: jest.fn(),
            updateQuiz: jest.fn(),
            addQuestion: jest.fn(),
            updateQuestion: jest.fn(),
            getUserQuizzes: jest.fn(),
            getQuizById: jest.fn(),
            deleteQuiz: jest.fn(),
            deleteQuestion: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QuizController>(QuizController);
    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserQuizzes', () => {
    it('should return user quizzes with HATEOAS links', async () => {
      const mockQuizzes = [
        { id: 'quiz-1', title: 'Test Quiz' },
      ];
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'getUserQuizzes').mockResolvedValue(mockQuizzes);

      const result = await controller.getUserQuizzes(mockRequest);
      expect(result).toEqual({
        data: mockQuizzes,
        _links: {
          creates: 'http://localhost:3000/api/quiz',
        },
      });
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.getUserQuizzes(mockRequest)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createQuiz', () => {
    it('should create a new quiz', async () => {
      const createQuizDto: CreateQuizDto = { title: 'New Quiz' };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        title: 'New Quiz',
        ownerId: mockUser.uid,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        questions: [],
      };

      jest.spyOn(service, 'createQuiz').mockResolvedValue(mockQuiz);

      const result = await controller.createQuiz(createQuizDto, mockRequest);
      expect(result).toEqual({ data: mockQuiz });
      expect(service.createQuiz).toHaveBeenCalledWith(createQuizDto, mockUser.uid);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const createQuizDto: CreateQuizDto = { title: 'New Quiz' };
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.createQuiz(createQuizDto, mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when quiz data is invalid', async () => {
      const invalidQuizDto: CreateQuizDto = { title: '' };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'createQuiz').mockRejectedValue(new BadRequestException('Invalid quiz data'));

      await expect(controller.createQuiz(invalidQuizDto, mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('getQuizById', () => {
    it('should return quiz by id', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        title: 'Test Quiz',
        description: 'Test Description',
        ownerId: mockUser.uid,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        questions: [],
      };

      jest.spyOn(service, 'getQuizById').mockResolvedValue(mockQuiz);

      const result = await controller.getQuizById('quiz-1', mockRequest);
      expect(result).toEqual({
        title: mockQuiz.title,
        description: mockQuiz.description,
        questions: mockQuiz.questions,
      });
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.getQuizById('quiz-1', mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'getQuizById').mockRejectedValue(new NotFoundException('Quiz not found'));

      await expect(controller.getQuizById('non-existent-id', mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;
      const updateQuizDto = { title: 'Updated Quiz' };
      const mockQuizDoc = {
        exists: true,
        ref: null,
        id: 'quiz-1',
        readTime: mockTimestamp,
        data: () => ({
          id: 'quiz-1',
          title: 'Updated Quiz',
          ownerId: mockUser.uid,
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
          questions: [],
        }),
        get: jest.fn(),
        isEqual: jest.fn(),
      } as unknown as DocumentSnapshot;

      jest.spyOn(service, 'updateQuiz').mockResolvedValue(mockQuizDoc);

      const result = await controller.updateQuiz('quiz-1', updateQuizDto, mockRequest);
      expect(result).toEqual({ data: mockQuizDoc });
      expect(service.updateQuiz).toHaveBeenCalledWith('quiz-1', updateQuizDto, mockUser.uid);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.updateQuiz('quiz-1', {}, mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'updateQuiz').mockRejectedValue(new NotFoundException('Quiz not found'));

      await expect(controller.updateQuiz('non-existent-id', {}, mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('addQuestion', () => {
    it('should add a new question to quiz', async () => {
      const questionDto: CreateQuestionDto = {
        title: 'Test Question',
        answers: [
          { title: 'Answer 1', isCorrect: true },
          { title: 'Answer 2', isCorrect: false },
        ],
      };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'addQuestion').mockResolvedValue('question-1');

      const result = await controller.addQuestion('quiz-1', questionDto, mockRequest);
      expect(result).toBeDefined();
      expect(service.addQuestion).toHaveBeenCalledWith('quiz-1', mockUser.uid, questionDto);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const questionDto: CreateQuestionDto = {
        title: 'Test Question',
        answers: [{ title: 'Answer 1', isCorrect: true }],
      };
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.addQuestion('quiz-1', questionDto, mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when question data is invalid', async () => {
      const invalidQuestionDto: CreateQuestionDto = {
        title: '',
        answers: [],
      };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'addQuestion').mockRejectedValue(new BadRequestException('Invalid question data'));

      await expect(controller.addQuestion('quiz-1', invalidQuestionDto, mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('updateQuestion', () => {
    it('should update question', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;
      const updateQuestionDto = {
        title: 'Updated Question',
        answers: [{ title: 'Updated Answer', isCorrect: true }],
      };

      jest.spyOn(service, 'updateQuestion').mockResolvedValue(undefined);

      await controller.updateQuestion('quiz-1', 'question-1', updateQuestionDto, mockRequest);
      expect(service.updateQuestion).toHaveBeenCalledWith('quiz-1', 'question-1', mockUser.uid, updateQuestionDto);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.updateQuestion('quiz-1', 'question-1', {}, mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when question does not exist', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'updateQuestion').mockRejectedValue(new NotFoundException('Question not found'));

      await expect(controller.updateQuestion('quiz-1', 'non-existent-question-id', {}, mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'deleteQuiz').mockResolvedValue(undefined);

      await controller.deleteQuiz('quiz-1', mockRequest);
      expect(service.deleteQuiz).toHaveBeenCalledWith('quiz-1', mockUser.uid);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.deleteQuiz('quiz-1', mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'deleteQuiz').mockRejectedValue(new NotFoundException('Quiz not found'));

      await expect(controller.deleteQuiz('non-existent-id', mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'deleteQuestion').mockResolvedValue(undefined);

      await controller.deleteQuestion('quiz-1', 'question-1', mockRequest);
      expect(service.deleteQuestion).toHaveBeenCalledWith('quiz-1', 'question-1', mockUser.uid);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const mockRequest = { user: null } as RequestWithUser;
      await expect(controller.deleteQuestion('quiz-1', 'question-1', mockRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when question does not exist', async () => {
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'deleteQuestion').mockRejectedValue(new NotFoundException('Question not found'));

      await expect(controller.deleteQuestion('quiz-1', 'non-existent-id', mockRequest)).rejects.toThrow(HttpException);
    });
  });

  describe('addQuestion with advanced validation', () => {
    it('should validate question title length', async () => {
      const invalidQuestionDto: CreateQuestionDto = {
        title: 'a'.repeat(101), // titre trop long
        answers: [{ title: 'Answer 1', isCorrect: true }],
      };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'addQuestion').mockRejectedValue(
        new BadRequestException('Question title must be less than 100 characters')
      );

      await expect(controller.addQuestion('quiz-1', invalidQuestionDto, mockRequest)).rejects.toThrow(HttpException);
    });

    it('should validate answer count', async () => {
      const invalidQuestionDto: CreateQuestionDto = {
        title: 'Test Question',
        answers: [{ title: 'Answer 1', isCorrect: true }], // Une seule réponse
      };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'addQuestion').mockRejectedValue(
        new BadRequestException('Question must have at least 2 answers')
      );

      await expect(controller.addQuestion('quiz-1', invalidQuestionDto, mockRequest)).rejects.toThrow(HttpException);
    });

    it('should validate correct answer exists', async () => {
      const invalidQuestionDto: CreateQuestionDto = {
        title: 'Test Question',
        answers: [
          { title: 'Answer 1', isCorrect: false },
          { title: 'Answer 2', isCorrect: false },
        ],
      };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'addQuestion').mockRejectedValue(
        new BadRequestException('Question must have exactly one correct answer')
      );

      await expect(controller.addQuestion('quiz-1', invalidQuestionDto, mockRequest)).rejects.toThrow(HttpException);
    });

    it('should validate answer title length', async () => {
      const invalidQuestionDto: CreateQuestionDto = {
        title: 'Test Question',
        answers: [
          { title: 'a'.repeat(201), isCorrect: true }, // réponse trop longue
          { title: 'Answer 2', isCorrect: false },
        ],
      };
      const mockUser: UserDetails = { uid: 'test-user-id', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as RequestWithUser;

      jest.spyOn(service, 'addQuestion').mockRejectedValue(
        new BadRequestException('Answer title must be less than 200 characters')
      );

      await expect(controller.addQuestion('quiz-1', invalidQuestionDto, mockRequest)).rejects.toThrow(HttpException);
    });
  });
}); 