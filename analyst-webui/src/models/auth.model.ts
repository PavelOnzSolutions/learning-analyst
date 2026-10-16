export interface LoginRequest {
    login: string;
    password: string;
}

export interface UserInfo {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    origin: string;
    avatarUrl: string | null;
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
    imageUrl?: string;
}
