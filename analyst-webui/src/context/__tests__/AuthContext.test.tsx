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
});
