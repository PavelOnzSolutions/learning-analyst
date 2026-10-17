import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import config from '../../config';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function b64url(obj: unknown) {
    return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeToken(sub: string, exp: number, iat: number) {
    const header = b64url({ alg: 'none', typ: 'JWT' });
    const payload = b64url({ sub, exp, iat });
    return `${header}.${payload}.sig`;
}

function okJson(data: unknown) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
}

beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
});

describe('AuthContext', () => {
    it('login with an ADMIN-role response sets isAdmin true', async () => {
        const now = Math.floor(Date.now() / 1000);
        const token = makeToken('u1', now + 3600, now);

        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/auth/login`) {
                return okJson({
                    token,
                    expiresIn: 3600,
                    user: { id: 'u1', username: 'admin', email: 'admin@local.test', role: 'ADMIN' },
                });
            }
            return okJson({});
        });

        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        await act(async () => {
            await result.current.login({ login: 'admin', password: 'ChangeMe123!' });
        });

        await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.user?.username).toBe('admin');
    });

    it('login with a USER-role response sets isAdmin false', async () => {
        const now = Math.floor(Date.now() / 1000);
        const token = makeToken('u2', now + 3600, now);

        mockFetch.mockImplementation(() => okJson({
            token,
            expiresIn: 3600,
            user: { id: 'u2', username: 'jane', email: 'jane@local.test', role: 'USER' },
        }));

        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        await act(async () => {
            await result.current.login({ login: 'jane', password: 'password123' });
        });

        await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
        expect(result.current.isAdmin).toBe(false);
    });

    it('refreshToken persists updated role to localStorage when role changes', async () => {
        const now = Math.floor(Date.now() / 1000);
        const initialToken = makeToken('u3', now + 3600, now);
        const refreshedToken = makeToken('u3', now + 7200, now);

        // Seed localStorage with initial token and user (ADMIN role)
        localStorage.setItem('token', initialToken);
        localStorage.setItem('user', JSON.stringify({
            id: 'u3', username: 'bob', email: 'bob@local.test',
            role: 'ADMIN', imageUrl: undefined,
        }));

        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/auth/refresh`) {
                // Simulate role change: ADMIN → USER
                return okJson({
                    token: refreshedToken,
                    expiresIn: 3600,
                    user: { id: 'u3', username: 'bob', email: 'bob@local.test', role: 'USER' },
                });
            }
            return okJson({});
        });

        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        // Wait for initial load from localStorage
        await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
        expect(result.current.isAdmin).toBe(true); // Initially ADMIN
        expect(result.current.user?.role).toBe('ADMIN');

        // Call refreshToken
        await act(async () => {
            await result.current.refreshToken();
        });

        // Verify in-memory state updated
        await waitFor(() => expect(result.current.isAdmin).toBe(false));
        expect(result.current.user?.role).toBe('USER');

        // Verify localStorage was persisted with new role
        const storedUserJson = localStorage.getItem('user');
        expect(storedUserJson).toBeTruthy();
        const storedUser = JSON.parse(storedUserJson!);
        expect(storedUser.role).toBe('USER');
    });
});
