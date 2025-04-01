import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { ExecutionRoom } from './interfaces/execution-room.interface';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class QuizExecutionGateway {
  @WebSocketServer()
  server: Server;

  private executionRooms: Map<string, ExecutionRoom> = new Map();

  constructor(private readonly quizService: QuizService) {}

  @SubscribeMessage('host')
  async handleHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string } | { name: string; data: { executionId: string } },
  ): Promise<void> {
    // Gérer les deux formats d'entrée
    const executionId = 'data' in data ? data.data.executionId : data.executionId;

    try {
      let executionRoom = this.executionRooms.get(executionId);
      if (!executionRoom) {
        executionRoom = {
          participants: new Set(),
        };
        this.executionRooms.set(executionId, executionRoom);
      }

      executionRoom.hostSocket = client;
      await client.join(executionId);
      executionRoom.participants.add(client);

      const quiz = await this.quizService.getQuizById(executionId, 'TODO');

      // Répondre dans le format approprié selon le protocole
      if ('data' in data) {
        // Format WebSocket pur
        client.emit('message', {
          name: 'hostDetails',
          data: {
            quiz: {
              title: quiz.title,
            },
          },
        });

        this.server.to(executionId).emit('message', {
          name: 'status',
          data: {
            status: 'waiting',
            participants: executionRoom.participants.size,
          },
        });
      } else {
        // Format Socket.IO
        client.emit('hostDetails', {
          quiz: {
            title: quiz.title,
          },
        });

        this.server.to(executionId).emit('status', {
          status: 'waiting',
          participants: executionRoom.participants.size,
        });
      }
    } catch (error) {
      client.emit('error', { message: 'Failed to get quiz details' });
    }
  }

  handleDisconnect(client: Socket) {
    this.executionRooms.forEach((room, executionId) => {
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
          this.executionRooms.delete(executionId);
        }
      }
    });
  }
}
