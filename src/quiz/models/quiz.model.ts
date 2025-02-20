import { Timestamp } from '@google-cloud/firestore';

export interface Quiz {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  description?: string;
  questions?: any[];
}

export interface CreateQuizDto {
  title: string;
}
