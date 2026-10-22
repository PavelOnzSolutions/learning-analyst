import type { AuthProvider, Delay } from './auth';
import { realDelay } from './auth';
import type { Credentials, Result, User } from '../model/types';

interface Account { email: string; password: string; user: User; }

export const ACCOUNTS: Account[] = [
  { email: 'pavel@onz.solutions', password: 'secret123',
    user: { id: 'u1', email: 'pavel@onz.solutions', displayName: 'Pavel' } },
  { email: 'admin@onz.solutions', password: 'admin123',
    user: { id: 'u2', email: 'admin@onz.solutions', displayName: 'Admin' } },
];

export class MockAuthProvider implements AuthProvider {
  constructor(private delay: Delay = realDelay) {}

  async login(creds: Credentials): Promise<Result<User>> {
    await this.delay(600); // room for the loggingIn animation to breathe
    const acct = ACCOUNTS.find((a) => a.email === creds.email && a.password === creds.password);
    return acct ? { ok: true, value: acct.user } : { ok: false, error: 'Invalid email or password' };
  }

  async logout(): Promise<void> {
    await this.delay(200);
  }
}
