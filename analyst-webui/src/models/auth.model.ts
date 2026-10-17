export interface LoginRequest {
    login: string;
    password: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface UserInfo {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    enabled: boolean;
    createdAt: string;
}

export interface TokenResponse {
    token: string;
    expiresIn: number;
    user: UserInfo;
}

export interface User {
    id: string;
    username: string;
    email: string;
    token: string;
    role: UserRole;
    imageUrl?: string;
}
