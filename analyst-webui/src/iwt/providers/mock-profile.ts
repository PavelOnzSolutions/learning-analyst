import type { ProfileProvider } from './profile';
import { type Delay, realDelay } from './auth';
import type { Profile } from '../model/types';

const PROFILES: Record<string, Profile> = {
  u1: { userId: 'u1', role: 'member', displayName: 'Pavel' },
  u2: { userId: 'u2', role: 'admin', displayName: 'Admin' },
};

export class MockProfileProvider implements ProfileProvider {
  constructor(private delay: Delay = realDelay) {}

  async profile(userId: string): Promise<Profile> {
    await this.delay(200);
    const p = PROFILES[userId];
    if (!p) throw new Error(`No profile for ${userId}`);
    return p;
  }
}
