import type { Profile } from '../model/types';

export interface ProfileProvider {
  profile(userId: string): Promise<Profile>;
}
