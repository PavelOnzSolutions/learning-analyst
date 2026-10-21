import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { PageTitleProvider } from '../../../context/PageTitleContext';
import { ToolbarProvider } from '../../../context/ToolbarContext';
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
            <Theme>
                <PageTitleProvider>
                    <ToolbarProvider>
                        <MemoryRouter initialEntries={['/history']}>
                            <Routes>
                                <Route path="/history" element={<HistoryPage />} />
                                <Route path="/history/:id" element={<div>Run Detail Placeholder</div>} />
                            </Routes>
                        </MemoryRouter>
                    </ToolbarProvider>
                </PageTitleProvider>
            </Theme>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    mockFetch.mockReset();
});

describe('HistoryPage', () => {
    it('lists completed runs with their counts and navigates to the detail page on row click', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/runs?status=COMPLETED&page=0&size=10&sort=createdAt,desc`) {
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
                    totalPages: 1,
                    number: 0,
                });
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        renderPage();

        await waitFor(() => expect(screen.getByText('October import')).toBeInTheDocument());
        expect(screen.getByText('170')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('October import'));

        await waitFor(() => expect(screen.getByText('Run Detail Placeholder')).toBeInTheDocument());
    });

    it('shows an empty-state message when there are no completed runs', async () => {
        mockFetch.mockImplementation(() => okJson({ content: [], totalElements: 0, totalPages: 0, number: 0 }));

        renderPage();

        await waitFor(() => expect(screen.getByText(/No completed import runs yet/i)).toBeInTheDocument());
    });

    it('paginates through multiple pages of completed runs', async () => {
        function runFixture(id: string, name: string) {
            return {
                id, name, status: 'COMPLETED',
                createdAt: '2026-10-01T00:00:00Z', confirmedAt: '2026-10-01T01:00:00Z', createdBy: 'u1',
                counts: {
                    employees: 1, trainingCatalogEntries: 1, timeslots: 1, completedTrainings: 1,
                    errorCount: 0, warningCount: 0, compliantCount: 0, expiringSoonCount: 0, overdueCount: 0,
                },
                findings: [],
            };
        }

        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/runs?status=COMPLETED&page=0&size=10&sort=createdAt,desc`) {
                return okJson({ content: [runFixture('r1', 'Page one run')], totalElements: 2, totalPages: 2, number: 0 });
            }
            if (url === `${config.apiBaseUrl}/v1/runs?status=COMPLETED&page=1&size=10&sort=createdAt,desc`) {
                return okJson({ content: [runFixture('r2', 'Page two run')], totalElements: 2, totalPages: 2, number: 1 });
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        renderPage();

        await waitFor(() => expect(screen.getByText('Page one run')).toBeInTheDocument());
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
        expect(screen.getByText('Previous').closest('button')).toBeDisabled();

        fireEvent.click(screen.getByText('Next'));

        await waitFor(() => expect(screen.getByText('Page two run')).toBeInTheDocument());
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
        expect(screen.queryByText('Page one run')).not.toBeInTheDocument();
        expect(screen.getByText('Next').closest('button')).toBeDisabled();
    });

    it('refetches with the new page size, resetting to the first page, when the rows-per-page selector changes', async () => {
        function runFixture(id: string, name: string) {
            return {
                id, name, status: 'COMPLETED',
                createdAt: '2026-10-01T00:00:00Z', confirmedAt: '2026-10-01T01:00:00Z', createdBy: 'u1',
                counts: {
                    employees: 1, trainingCatalogEntries: 1, timeslots: 1, completedTrainings: 1,
                    errorCount: 0, warningCount: 0, compliantCount: 0, expiringSoonCount: 0, overdueCount: 0,
                },
                findings: [],
            };
        }

        mockFetch.mockImplementation((url: string) => {
            if (url === `${config.apiBaseUrl}/v1/runs?status=COMPLETED&page=0&size=10&sort=createdAt,desc`) {
                return okJson({ content: [runFixture('r1', 'Ten per page run')], totalElements: 1, totalPages: 1, number: 0 });
            }
            if (url === `${config.apiBaseUrl}/v1/runs?status=COMPLETED&page=0&size=20&sort=createdAt,desc`) {
                return okJson({ content: [runFixture('r2', 'Twenty per page run')], totalElements: 1, totalPages: 1, number: 0 });
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        renderPage();

        await waitFor(() => expect(screen.getByText('Ten per page run')).toBeInTheDocument());

        fireEvent.click(screen.getByText('10'));
        fireEvent.click(screen.getByText('20'));

        await waitFor(() => expect(screen.getByText('Twenty per page run')).toBeInTheDocument());
        expect(screen.queryByText('Ten per page run')).not.toBeInTheDocument();
    });
});
