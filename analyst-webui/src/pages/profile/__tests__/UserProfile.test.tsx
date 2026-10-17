import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../../context/ToastContext';
import UserProfile from '../UserProfile';
import config from '../../../config';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'u1', username: 'jane', email: 'jane@local.test', role: 'USER', token: 'tok' },
        tokenExpiration: Math.floor(Date.now() / 1000) + 1800,
        tokenIssuedAt: Math.floor(Date.now() / 1000),
    }),
}));

vi.mock('../../../context/PageTitleContext', () => ({
    usePageTitle: vi.fn(),
}));

function okJson(data: unknown) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
}

beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
});

describe('UserProfile page', () => {
    it('renders without fetching /audit-logs and without a Recent Activity section', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/users/me`) {
                return okJson({
                    id: 'u1', email: 'jane@local.test', username: 'jane', displayName: null,
                    avatarUrl: null, role: 'USER', enabled: true, createdAt: '2026-01-01T00:00:00Z',
                });
            }
            if (url === `${config.apiBaseUrl}/v1/tokens`) {
                return okJson([]);
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        const queryClient = new QueryClient();
        render(
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <ToastProvider>
                        <UserProfile />
                    </ToastProvider>
                </QueryClientProvider>
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('jane@local.test')).toBeInTheDocument());
        expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
        expect(mockFetch.mock.calls.some(([url]) => String(url).includes('audit-logs'))).toBe(false);
    });
});
