import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageTitleProvider } from '../../../context/PageTitleContext';
import HistoryPage from '../HistoryPage';
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
            <PageTitleProvider>
                <MemoryRouter initialEntries={['/history']}>
                    <Routes>
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/history/:id" element={<div>Run Detail Placeholder</div>} />
                    </Routes>
                </MemoryRouter>
            </PageTitleProvider>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    mockFetch.mockReset();
});

describe('HistoryPage', () => {
    it('lists completed runs with their counts and navigates to the detail page on row click', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/runs?status=COMPLETED`) {
                return okJson({
                    content: [{
                        id: 'r1', name: 'October import', status: 'COMPLETED',
                        createdAt: '2026-10-01T00:00:00Z', confirmedAt: '2026-10-01T01:00:00Z', createdBy: 'u1',
                        counts: {
                            employees: 170, trainingCatalogEntries: 11, timeslots: 34, completedTrainings: 2877,
                            errorCount: 0, warningCount: 15, compliantCount: 100, expiringSoonCount: 8, overdueCount: 12,
                        },
                        findings: [],
                    }],
                    totalElements: 1,
                });
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        renderPage();

        await waitFor(() => expect(screen.getByText('October import')).toBeInTheDocument());
        expect(screen.getByText('170')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();

        fireEvent.click(screen.getByText('October import'));

        await waitFor(() => expect(screen.getByText('Run Detail Placeholder')).toBeInTheDocument());
    });

    it('shows an empty-state message when there are no completed runs', async () => {
        mockFetch.mockImplementation(() => okJson({ content: [], totalElements: 0 }));

        renderPage();

        await waitFor(() => expect(screen.getByText(/No completed import runs yet/i)).toBeInTheDocument());
    });
});
