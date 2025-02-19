import { Timestamp } from '@google-cloud/firestore';

export interface Quiz {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Timestamp;
  description?: string;
}

export interface CreateQuizDto {
  title: string;
}
