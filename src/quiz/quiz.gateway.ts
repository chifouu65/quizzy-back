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

// Types
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
  cors: {
    origin: '*',
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(QuizGateway.name);

  @WebSocketServer()
  server: Server;

  // Gestion de connexion
  handleConnection(client: Socket) {
    this.logger.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
    this.removeClientFromAllSessions(client);
  }

  // Rejoindre une session
  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: JoinMessage,
  ) {
    const { executionId } = message.data;
    this.logger.log(`Client ${client.id} demande à rejoindre la session ${executionId}`);

    if (!this.validateSession(executionId, client)) {
      return;
    }

    const session = executionRooms.get(executionId);
    session.participants.add(client);

    client.join(executionId);

    this.sendSessionDetails(client, executionId);
    this.updateSessionStatus(executionId);
  }

  // Quitter volontairement
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

  // Vérifie si une session existe
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

  // Envoie les infos de la session au client
  private sendSessionDetails(client: Socket, executionId: string) {
    const session = executionRooms.get(executionId);
    this.logger.log(`Envoi des détails de session à ${client.id}`);
    client.emit('joinDetails', {
      name: 'joinDetails',
      data: { quizTitle: session.quizTitle },
    });
  }

  // Mise à jour du statut de la session
  private updateSessionStatus(executionId: string) {
    const session = executionRooms.get(executionId);
    const participantCount = session.participants.size;
    this.logger.log(`Mise à jour du statut: ${participantCount} participants`);

    this.server.to(executionId).emit('status', {
      name: 'status',
      data: { status: 'waiting', participants: participantCount },
    });
  }

  // Supprimer un client d’une session spécifique
  private removeClientFromSession(client: Socket, executionId: string) {
    const session = executionRooms.get(executionId);
    const toRemove = Array.from(session.participants).find((s) => s.id === client.id);
    if (toRemove) {
      session.participants.delete(toRemove);
    }

    this.updateSessionStatus(executionId);
  }

  // Supprimer un client de toutes les sessions
  private removeClientFromAllSessions(client: Socket) {
    executionRooms.forEach((room, executionId) => {
      if (Array.from(room.participants).some((s) => s.id === client.id)) {
        this.removeClientFromSession(client, executionId);
      }
    });
  }
}
