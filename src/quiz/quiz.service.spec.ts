import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { Quiz } from './models/quiz.model';
import { NotFoundException } from '@nestjs/common';

describe('QuizService', () => {
  let service: QuizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuizService],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a quiz', async () => {
    const quizData = {
      title: 'Sample Quiz',
      questions: [],
    } as Quiz;
    jest.spyOn(service, 'createQuiz').mockResolvedValue(quizData);

    const result = await service.createQuiz(quizData, '123');
    expect(result).toEqual(quizData);
  });

  it('should return all quizzes', async () => {
    const quizzes = [
      { title: 'Quiz 1', questions: [] },
      { title: 'Quiz 2', questions: [] },
    ] as Quiz[];
    jest.spyOn(service, 'getUserQuizzes').mockResolvedValue(quizzes);

    const result = await service.getUserQuizzes('123');
    expect(result).toEqual(quizzes);
  });

  it('should add a question to a quiz', async () => {
    const question = {
      title: 'Question 1',
      options: ['Option 1', 'Option 2', 'Option 3'],
    } as any;
    jest.spyOn(service, 'addQuestion').mockResolvedValue('123');

    const result = await service.addQuestion('123', '123', question);
    expect(result).toEqual('123');
  });

  it('should get a quiz by ID', async () => {
    const quizId = '123';
    const userId = 'user123';
    const quizData = {
      id: quizId,
      title: 'Sample Quiz',
      questions: [],
    } as Quiz;

    jest.spyOn(service, 'getQuizById').mockResolvedValue(quizData);

    const result = await service.getQuizById(quizId, userId);
    expect(result).toEqual(quizData);
  });

  it('should throw NotFoundException when quiz not found by ID', async () => {
    const quizId = 'nonexistent';
    const userId = 'user123';

    jest
      .spyOn(service, 'getQuizById')
      .mockRejectedValue(new NotFoundException('Quiz not found'));

    await expect(service.getQuizById(quizId, userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update a quiz', async () => {
    const quizId = '123';
    const userId = 'user123';
    const updateData = { title: 'Updated Quiz Title' };

    jest.spyOn(service, 'updateQuiz').mockResolvedValue(undefined);

    await service.updateQuiz(quizId, updateData, userId);
    expect(service.updateQuiz).toHaveBeenCalledWith(quizId, updateData, userId);
  });

  it('should update a question in a quiz', async () => {
    const quizId = '123';
    const questionId = '456';
    const userId = 'user123';
    const updateQuestionData = { title: 'Updated Question Title' };

    jest.spyOn(service, 'updateQuestion').mockResolvedValue(undefined);

    await service.updateQuestion(
      quizId,
      questionId,
      updateQuestionData,
      userId,
    );
    expect(service.updateQuestion).toHaveBeenCalledWith(
      quizId,
      questionId,
      updateQuestionData,
      userId,
    );
  });
});
