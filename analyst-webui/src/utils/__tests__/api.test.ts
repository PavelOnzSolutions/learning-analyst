import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithAuth } from '../api';
import config from '../../config';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function b64url(obj: unknown) {
    return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeToken(exp: number, iat: number) {
    const header = b64url({ alg: 'none', typ: 'JWT' });
    const payload = b64url({ sub: 'u1', exp, iat });
    return `${header}.${payload}.sig`;
}

function okJson(data: unknown) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
}

beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
});

describe('fetchWithAuth proactive refresh', () => {
    it('refreshes the token BEFORE sending the request when <=60s remain, and uses the new token', async () => {
        const now = Math.floor(Date.now() / 1000);
        const almostExpiredToken = makeToken(now + 30, now - 90); // 30s left
        const freshToken = makeToken(now + 3600, now);
        localStorage.setItem('token', almostExpiredToken);

        mockFetch.mockImplementation((url: string) => {
            if (url.includes('/v1/auth/refresh')) {
                return okJson({ token: freshToken, expiresIn: 3600, user: { id: 'u1' } });
            }
            return okJson({ data: 'ok' });
        });

        await fetchWithAuth('/v1/tasks');

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const [refreshUrl] = mockFetch.mock.calls[0];
        expect(refreshUrl).toBe(`${config.apiBaseUrl}/v1/auth/refresh`);

        const [dataUrl, dataInit] = mockFetch.mock.calls[1];
        expect(dataUrl).toBe(`${config.apiBaseUrl}/v1/tasks`);
        expect((dataInit.headers as Record<string, string>).Authorization).toBe(`Bearer ${freshToken}`);

        expect(localStorage.getItem('token')).toBe(freshToken);
    });

    it('does NOT proactively refresh when more than 60s remain', async () => {
        const now = Math.floor(Date.now() / 1000);
        const healthyToken = makeToken(now + 300, now);
        localStorage.setItem('token', healthyToken);

        mockFetch.mockImplementation(() => okJson({ data: 'ok' }));

        await fetchWithAuth('/v1/tasks');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toBe(`${config.apiBaseUrl}/v1/tasks`);
        expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${healthyToken}`);
    });
});
