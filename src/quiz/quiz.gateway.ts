import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { executionRooms, ExecutionRoom } from './interfaces/execution-room.interface';
import * as admin from 'firebase-admin';

interface JoinMessage {
  name: string;
  data: {
    executionId: string;
  };
}

interface LeaveMessage {
  data: {
    executionId: string;
  };
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(QuizGateway.name);
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
    this.removeClientFromAllSessions(client);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { executionId: string } | { name: string; data: { executionId: string } },
  ) {
    const executionId = 'data' in data ? data.data.executionId : data.executionId;
    this.logger.log(`Client ${client.id} demande à rejoindre la session ${executionId}`);

    if (!this.validateSession(executionId, client)) return;

    const session = executionRooms.get(executionId);
    session.participants.add(client);
    await client.join(executionId);

    const isWebSocket = 'data' in data;
    this.sendSessionDetails(client, executionId, isWebSocket);
    this.updateSessionStatus(executionId, isWebSocket);

    await admin.firestore()
      .collection('executions')
      .doc(executionId)
      .update({ participants: session.participants.size });
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: LeaveMessage,
  ) {
    const { executionId } = message.data;
    this.logger.log(`Client ${client.id} quitte volontairement la session ${executionId}`);
    client.leave(executionId);
    this.removeClientFromSession(client, executionId);
  }

  private validateSession(executionId: string, client: Socket): boolean {
    if (!executionRooms.has(executionId)) {
      this.logger.warn(`Session ${executionId} non trouvée`);
      client.emit('error', {
        name: 'error',
        data: { message: 'Session non trouvée' },
      });
      return false;
    }
    return true;
  }

  private sendSessionDetails(client: Socket, executionId: string, isWebSocket = false) {
    const session = executionRooms.get(executionId);
    const payload = { quizTitle: session.quizTitle };

    if (isWebSocket) {
      client.emit('message', { name: 'joinDetails', data: payload });
    } else {
      client.emit('joinDetails', payload);
    }
  }

  private updateSessionStatus(executionId: string, isWebSocket = false) {
    const session = executionRooms.get(executionId);
    const statusPayload = {
      status: 'waiting',
      participants: session.participants.size,
    };

    if (isWebSocket) {
      this.server.to(executionId).emit('message', { name: 'status', data: statusPayload });
    } else {
      this.server.to(executionId).emit('status', statusPayload);
    }
  }

  private removeClientFromSession(client: Socket, executionId: string, isWebSocket = false) {
    const session = executionRooms.get(executionId);
    session.participants.delete(client);
    this.updateSessionStatus(executionId, isWebSocket);
  }

  private removeClientFromAllSessions(client: Socket) {
    executionRooms.forEach((room, executionId) => {
      if (room.participants.has(client)) {
        this.removeClientFromSession(client, executionId);
      }
    });
  }
}

