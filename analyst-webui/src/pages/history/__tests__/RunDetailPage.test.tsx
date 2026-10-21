import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { PageTitleProvider } from '../../../context/PageTitleContext';
import RunDetailPage from '../RunDetailPage';
import config from '../../../config';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// jsdom does not implement scrollIntoView, which Radix UI's Select calls when
// highlighting the selected item on open/select.
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
}

function okJson(data: unknown) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);
}

function renderPage() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <Theme>
                <PageTitleProvider>
                    <MemoryRouter initialEntries={['/history/r1']}>
                        <Routes>
                            <Route path="/history/:id" element={<RunDetailPage />} />
                        </Routes>
                    </MemoryRouter>
                </PageTitleProvider>
            </Theme>
        </QueryClientProvider>
    );
}

const run = {
    id: 'r1', name: 'October import', status: 'COMPLETED', createdAt: '2026-10-01T00:00:00Z',
    confirmedAt: '2026-10-01T01:00:00Z', createdBy: 'u1',
    counts: {
        employees: 2, trainingCatalogEntries: 1, timeslots: 1, completedTrainings: 1,
        errorCount: 0, warningCount: 0, compliantCount: 1, expiringSoonCount: 0, overdueCount: 1,
    },
    findings: [],
};

const detail = {
    employees: [],
    timeslots: [],
    compliance: [
        { idZamestnance: 'E1', employeeName: 'Tereza Urbanová', utvar: 'Lab', pozice: 'Tech', kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Základní školení', status: 'OVERDUE', expiryDate: null },
        { idZamestnance: 'E2', employeeName: 'Jan Novák', utvar: 'Lab', pozice: 'Tech', kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Základní školení', status: 'COMPLIANT', expiryDate: '2099-01-01' },
    ],
    schedulingOpportunities: [
        { idZamestnance: 'E1', employeeName: 'Tereza Urbanová', kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Základní školení', status: 'OVERDUE', idTerminu: 'T1', datum: '2026-11-01', kapacita: 10, obsazeno: 5 },
    ],
};

beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation((url: string) => {
        if (url === `${config.apiBaseUrl}/v1/runs/r1`) {
            return okJson(run);
        }
        if (url === `${config.apiBaseUrl}/v1/runs/r1/detail`) {
            return okJson(detail);
        }
        throw new Error(`Unexpected fetch to ${url}`);
    });
});

describe('RunDetailPage', () => {
    it('shows the run header and both compliance/scheduling tables', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('October import')).toBeInTheDocument());
        // "Tereza Urbanová" legitimately appears in both the compliance table
        // and the scheduling-opportunities table (same person, two sections).
        expect(screen.getAllByText('Tereza Urbanová').length).toBeGreaterThan(0);
        expect(screen.getByText('Jan Novák')).toBeInTheDocument();
        expect(screen.getAllByText('BOZP-Z').length).toBeGreaterThan(0);
    });

    it('filters the mandatory-training table by status', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Jan Novák')).toBeInTheDocument());

        fireEvent.click(screen.getByText('All Statuses'));
        // Target the dropdown option specifically — "Overdue" also appears as
        // a status badge in both tables once Tereza's OVERDUE rows render.
        fireEvent.click(screen.getByRole('option', { name: 'Overdue' }));

        // Still appears: once in the filtered compliance table, once in the
        // (unfiltered) scheduling-opportunities table.
        expect(screen.getAllByText('Tereza Urbanová').length).toBeGreaterThan(0);
        expect(screen.queryByText('Jan Novák')).not.toBeInTheDocument();
    });
});
