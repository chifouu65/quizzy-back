import { UserDetails } from '../model/user-details';

export const AuthRepository = Symbol('AuthRepository');
export interface AuthRepository {
  getUserFromToken(token: string): Promise<UserDetails>;

  getUserByUid(uid: string): Promise<UserDetails>;
}
