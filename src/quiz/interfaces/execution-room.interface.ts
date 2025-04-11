import { Socket } from 'socket.io';

export interface ExecutionRoom {
  ownerId: string; 
  quizId: string;
  hostSocket?: Socket;
  quizTitle?: string;
  participants: Set<Socket>;
  currentQuestionIndex?: number;
}

export const executionRooms = new Map<string, ExecutionRoom>();