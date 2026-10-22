import type { Credentials, Result, User } from '../model/types';

export interface AuthProvider {
  login(creds: Credentials): Promise<Result<User>>;
  logout(): Promise<void>;
}

export type Delay = (ms: number) => Promise<void>;
export const realDelay: Delay = (ms) => new Promise((r) => setTimeout(r, ms));
