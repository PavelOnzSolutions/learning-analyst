import type { UserRole } from './auth.model';

export interface IUserAccount {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    enabled: boolean;
    createdAt: string;
}
