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

  @SubscribeMessage('host')
  async handleHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string } | { name: string; data: { executionId: string } },
  ): Promise<void> {
    // Gérer les deux formats d'entrée
    const executionId = 'data' in data ? data.data.executionId : data.executionId;

    try {
      let executionRoom = executionRooms.get(executionId);
      if (!executionRoom) {
        executionRoom = {
          participants: new Set(),
        };
        executionRooms.set(executionId, executionRoom);
      }

      executionRoom.hostSocket = client;
      await client.join(executionId);
      executionRoom.participants.add(client);

      const quiz = await this.quizService.getQuizById(executionId, 'TODO');

      executionRoom.quizTitle = quiz.title;

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

  @SubscribeMessage('nextQuestion')
  handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string } | { name: string; data: { executionId: string } },
  ): void {
    // Gérer les deux formats d'entrée
    const executionId = 'data' in data ? data.data.executionId : data.executionId;
    
    // Simple console.log pour tester
    this.logger.log(`Événement nextQuestion reçu pour l'exécution: ${executionId}`);
    console.log(`Événement nextQuestion reçu pour l'exécution: ${executionId}`);
    
    // Vérifier si l'exécution existe
    const executionRoom = executionRooms.get(executionId);
    if (!executionRoom) {
      this.logger.warn(`Session d'exécution non trouvée: ${executionId}`);
      client.emit('error', { message: 'Session not found' });
      return;
    }
    
    // Vérifier si le client est bien l'hôte
    if (executionRoom.hostSocket?.id !== client.id) {
      this.logger.warn(`Client ${client.id} n'est pas l'hôte de la session ${executionId}`);
      client.emit('error', { message: 'Only host can control questions' });
      return;
    }
    
    // Envoyer un événement status à tous les participants de la room
    this.server.to(executionId).emit('status', {
      name: 'status',
      data: { 
        status: 'started', 
        participants: executionRoom.participants.size 
      }
    });
    
    this.logger.log(`État 'started' envoyé à tous les participants (${executionRoom.participants.size}) de la session ${executionId}`);
    
    // Envoyer une question hardcodée à tous les participants de la room
    const question = {
      question: 'Quel est le pays de la tour Eiffel ?',
      answers: ['Italie', 'France', 'Espagne']
    };
    
    this.server.to(executionId).emit('newQuestion', {
      name: 'newQuestion',
      data: question
    });
    
    this.logger.log(`Question envoyée à tous les participants: "${question.question}"`);
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
