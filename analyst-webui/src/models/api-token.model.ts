export interface IApiToken {
    id: string;
    userId: string;
    description: string;
    issuedAt: string;
    expiresAt: string;
    revoked: boolean;
}

export interface CreateTokenRequest {
    name: string;
    expirationDays?: number;
}

export interface CreateTokenResponse {
    id: string;
    token: string;
    name: string;
    expiresAt: string;
}
