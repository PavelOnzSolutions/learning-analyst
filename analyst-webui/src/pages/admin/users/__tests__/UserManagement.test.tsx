import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../../context/ToastContext';
import { PageTitleProvider } from '../../../../context/PageTitleContext';
import { ToolbarProvider } from '../../../../context/ToolbarContext';
import UserManagement from '../UserManagement';
import config from '../../../../config';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('../../../../context/AuthContext', () => ({
    useAuth: () => ({ isAdmin: true }),
}));

function okJson(data: unknown) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
}

beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
});

describe('UserManagement page', () => {
    it('renders users without fetching /v1/authorities or any AD-import endpoint', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/users?size=200&sort=createdAt,desc`) {
                return okJson({
                    content: [{
                        id: 'u1', email: 'jane@local.test', username: 'jane', displayName: null,
                        avatarUrl: null, role: 'USER', enabled: true, createdAt: '2026-01-01T00:00:00Z',
                    }],
                    totalElements: 1,
                    totalPages: 1,
                });
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        const queryClient = new QueryClient();
        render(
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <PageTitleProvider>
                        <ToolbarProvider>
                            <UserManagement />
                        </ToolbarProvider>
                    </PageTitleProvider>
                </ToastProvider>
            </QueryClientProvider>
        );

        await waitFor(() => expect(screen.getByText('jane')).toBeInTheDocument());
        expect(mockFetch.mock.calls.some(([url]) => String(url).includes('/v1/authorities'))).toBe(false);
        expect(mockFetch.mock.calls.some(([url]) => String(url).includes('entra'))).toBe(false);
    });
});
