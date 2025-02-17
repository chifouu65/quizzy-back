import { Request } from 'express';
import { UserDetails } from './user-details';

export interface RequestWithUser extends Request {
  user: UserDetails;
}
