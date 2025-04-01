import { Socket } from 'socket.io';

export interface ExecutionRoom {
  hostSocket?: Socket;
  participants: Set<Socket>;
} 