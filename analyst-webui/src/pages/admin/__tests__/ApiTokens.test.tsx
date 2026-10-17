import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../context/ToastContext';
import { PageTitleProvider } from '../../../context/PageTitleContext';
import { ToolbarProvider, useToolbarState } from '../../../context/ToolbarContext';
import { ThemeProvider } from '../../../context/ThemeContext';
import ApiTokens from '../ApiTokens';
import config from '../../../config';
import { Button } from '@radix-ui/themes';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function okJson(data: unknown) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
}

function TestToolbarRenderer() {
    const { actions } = useToolbarState();
    return (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            {actions.map((action) => (
                <Button key={action.id} onClick={action.onClick}>
                    {action.label}
                </Button>
            ))}
        </div>
    );
}

function renderPage() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <ToastProvider>
                    <PageTitleProvider>
                        <ToolbarProvider>
                            <TestToolbarRenderer />
                            <ApiTokens />
                        </ToolbarProvider>
                    </PageTitleProvider>
                </ToastProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
});

describe('ApiTokens page', () => {
    it('creates a token with no permissions field in the request body', async () => {
        mockFetch.mockImplementation((url: string, init?: RequestInit) => {
            if (url === `${config.apiBaseUrl}/v1/tokens` && (!init || init.method === undefined)) {
                return okJson([]);
            }
            if (url === `${config.apiBaseUrl}/v1/tokens` && init?.method === 'POST') {
                return okJson({ id: 't1', token: 'signed.jwt.value', name: 'CI token', expiresAt: '2026-11-15T00:00:00Z' });
            }
            return okJson({});
        });

        renderPage();

        fireEvent.click(await screen.findByText('New'));
        fireEvent.change(screen.getByPlaceholderText('e.g., CI/CD Pipeline Token'), { target: { value: 'CI token' } });
        fireEvent.click(screen.getByText('Create Token'));

        await waitFor(() => {
            const postCall = mockFetch.mock.calls.find(([, init]) => init?.method === 'POST');
            expect(postCall).toBeDefined();
            const body = JSON.parse((postCall![1] as RequestInit).body as string);
            expect(body).toEqual({ name: 'CI token', expirationDays: 30 });
        });
    });
});
