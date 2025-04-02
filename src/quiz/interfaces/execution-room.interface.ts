import { Socket } from 'socket.io';

export interface ExecutionRoom {
  hostSocket?: Socket;
  quizTitle?: string;
  participants: Set<Socket>;
} 
export const executionRooms = new Map<string, ExecutionRoom>();