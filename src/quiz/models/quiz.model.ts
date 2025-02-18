import { Timestamp } from '@google-cloud/firestore';

export interface Quiz {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface CreateQuizDto {
  title: string;
} 