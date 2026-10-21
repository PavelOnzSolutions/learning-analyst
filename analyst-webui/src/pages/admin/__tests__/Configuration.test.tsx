import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { ToastProvider } from '../../../context/ToastContext';
import { PageTitleProvider } from '../../../context/PageTitleContext';
import Configuration from '../Configuration';
import config from '../../../config';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function okJson(data: unknown) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
}

function renderPage() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <Theme>
                <ToastProvider>
                    <PageTitleProvider>
                        <Configuration />
                    </PageTitleProvider>
                </ToastProvider>
            </Theme>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
});

describe('Configuration page', () => {
    it('loads current import settings and saves them back unchanged on Save', async () => {
        const settings = {
            EMPLOYEES: 'AUTO',
            TRAINING_CATALOG: 'COMMA',
            TIMESLOTS: 'SEMICOLON',
            COMPLETED_TRAININGS: 'SEMICOLON',
        };
        mockFetch.mockImplementation((url: string, init?: RequestInit) => {
            if (url === `${config.apiBaseUrl}/v1/admin/import-settings` && (!init || init.method === undefined)) {
                return okJson(settings);
            }
            if (url === `${config.apiBaseUrl}/v1/admin/import-settings` && init?.method === 'PUT') {
                return okJson(settings);
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        renderPage();

        await waitFor(() => expect(screen.getByText('Comma (,)')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            const putCall = mockFetch.mock.calls.find(([, init]) => init?.method === 'PUT');
            expect(putCall).toBeDefined();
            const body = JSON.parse((putCall![1] as RequestInit).body as string);
            expect(body).toEqual(settings);
        });
    });
});
