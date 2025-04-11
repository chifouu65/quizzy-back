import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { executionRooms, ExecutionRoom } from './interfaces/execution-room.interface';
import * as admin from 'firebase-admin';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class QuizExecutionGateway {
  private readonly logger = new Logger(QuizExecutionGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly quizService: QuizService) {}

  private generateExecutionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private isQuizStartable(quiz: any): boolean {
    if (!quiz.title?.trim()) return false;
    if (!quiz.questions?.length) return false;
    return quiz.questions.every((q) => q.title?.trim() && q.answers?.length >= 2 && q.answers.filter((a) => a.isCorrect).length === 1);
  }

  @SubscribeMessage('host')
  async handleHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string } | { name: string; data: { executionId: string } },
  ): Promise<void> {
    const executionId = 'data' in data ? data.data.executionId : data.executionId;

    try {
      const execution = await admin.firestore().collection('executions').doc(executionId).get();
      if (!execution.exists) throw new Error('Execution not found');

      const executionData = execution.data();
      const quizId = executionData.quizId;
      const ownerId = executionData.ownerId;

      const quiz = await this.quizService.getQuizById(quizId, executionData.ownerId);

      let executionRoom = executionRooms.get(executionId);
      if (!executionRoom) {
        executionRoom = {
          quizId,
          ownerId,
          participants: new Set(),
          currentQuestionIndex: 0,
        };
        executionRooms.set(executionId, executionRoom);
      }

      executionRoom.hostSocket = client;
      await client.join(executionId);
      executionRoom.participants.add(client);
      executionRoom.quizTitle = quiz.title;

      if ('data' in data) {
        client.emit('message', {
          name: 'hostDetails',
          data: { quiz: { title: quiz.title } },
        });

        this.server.to(executionId).emit('message', {
          name: 'status',
          data: {
            status: 'waiting',
            participants: executionRoom.participants.size,
          },
        });
      } else {
        client.emit('hostDetails', { quiz: { title: quiz.title } });

        this.server.to(executionId).emit('status', {
          status: 'waiting',
          participants: executionRoom.participants.size,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to get quiz details: ${error.message}`);
      client.emit('error', { message: 'Failed to get quiz details' });
    }
  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string } | { name: string; data: { executionId: string } },
  ): Promise<void> {
    const executionId = 'data' in data ? data.data.executionId : data.executionId;
    const room = executionRooms.get(executionId);
    if (!room) {
      client.emit('error', { message: 'Session not found' });
      return;
    }
  
    if (room.hostSocket?.id !== client.id) {
      client.emit('error', { message: 'Only host can control questions' });
      return;
    }
  
    const quiz = await this.quizService.getQuizById(room.quizId, room.ownerId);
    const questionIndex = room.currentQuestionIndex ?? 0;
  
    if (questionIndex >= quiz.questions.length) {
      client.emit('error', { message: 'No more questions' });
      return;
    }
  
    const currentQuestion = quiz.questions[questionIndex];
    room.currentQuestionIndex = questionIndex + 1;
  
    if (room.hostSocket?.handshake) {
      // Socket.IO
      this.server.to(executionId).emit('status', {
        status: 'started',
        participants: room.participants.size,
      });
    } else {
      // WebSocket pur
      this.server.to(executionId).emit('message', {
        name: 'status',
        data: {
          status: 'started',
          participants: room.participants.size,
        },
      });
    }
  
    if (room.hostSocket?.handshake) {
      this.server.to(executionId).emit('newQuestion', {
        question: currentQuestion.title,
        answers: currentQuestion.answers.map((a) => a.title),
      });
    } else {
      this.server.to(executionId).emit('message', {
        name: 'newQuestion',
        data: {
          question: currentQuestion.title,
          answers: currentQuestion.answers.map((a) => a.title),
        },
      });
    }
  }

  handleDisconnect(client: Socket) {
    executionRooms.forEach((room, executionId) => {
      if (room.participants.has(client)) {
        room.participants.delete(client);

        if (room.hostSocket === client) {
          room.hostSocket = undefined;
        }

        this.server.to(executionId).emit('status', {
          status: 'waiting',
          participants: room.participants.size,
        });

        if (room.participants.size === 0) {
          executionRooms.delete(executionId);
        }
      }
    });
  }
}
