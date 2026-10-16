import { jwtDecode } from 'jwt-decode';
import config from '../config';
import { TokenStore } from './TokenStore';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

// The backend rejects a refresh call made with an already-expired token, so the
// token must be renewed before it dies, not after. Renew on the next API call
// once 60s or less remain.
const REFRESH_THRESHOLD_SECONDS = 60;

const isTokenNearExpiry = (token: string): boolean => {
    try {
        const { exp } = jwtDecode<{ exp: number }>(token);
        const now = Math.floor(Date.now() / 1000);
        return exp - now <= REFRESH_THRESHOLD_SECONDS;
    } catch {
        return false;
    }
};

const requestRefresh = async (token: string): Promise<string | null> => {
    try {
        const response = await fetch(`${config.apiBaseUrl}/v1/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        const tokenResponse = await response.json();
        TokenStore.setToken(tokenResponse.token);
        return tokenResponse.token;
    } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
    }
};

export const fetchWithAuth = async (endpoint: string, options: FetchOptions = {}) => {
    let token = TokenStore.getToken();

    if (token && isTokenNearExpiry(token)) {
        token = await requestRefresh(token) || token;
    }

    const headers: Record<string, string> = {
        ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${config.apiBaseUrl}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Fallback for a token rejected despite looking valid (clock skew, revocation).
        const newToken = token ? await requestRefresh(token) : null;
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(url, { ...options, headers });
        }

        // If refresh failed, clear session
        TokenStore.clearSession();
        throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (response.status === 403) {
        throw new ApiError('Access forbidden', 403);
    }

    return response;
};

