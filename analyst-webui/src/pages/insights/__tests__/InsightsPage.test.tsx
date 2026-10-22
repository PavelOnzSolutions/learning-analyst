import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageTitleProvider } from '../../../context/PageTitleContext';
import InsightsPage from '../InsightsPage';
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
                    <InsightsPage />
                </PageTitleProvider>
            </Theme>
        </QueryClientProvider>
    );
}

const overview = {
    runTrends: [
        { runId: 'r1', runName: 'October import', confirmedAt: '2026-10-01T00:00:00Z', employees: 10, compliantCount: 7, expiringSoonCount: 1, overdueCount: 2, errorCount: 0, warningCount: 1 },
    ],
};

const employees = [{ idZamestnance: 'E1', displayName: 'Tereza Urbanová' }];

const history = {
    idZamestnance: 'E1',
    employeeName: 'Tereza Urbanová',
    history: [
        { runId: 'r1', runName: 'October import', confirmedAt: '2026-10-01T00:00:00Z', kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Základní školení', status: 'OVERDUE', expiryDate: null },
    ],
};

beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation((url: string) => {
        if (url === `${config.apiBaseUrl}/v1/insights/overview`) return okJson(overview);
        if (url === `${config.apiBaseUrl}/v1/insights/employees`) return okJson(employees);
        if (url === `${config.apiBaseUrl}/v1/insights/employees/E1/history`) return okJson(history);
        throw new Error(`Unexpected fetch to ${url}`);
    });
});

describe('InsightsPage', () => {
    it('renders run trend charts once the overview loads', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByLabelText('Compliance %')).toBeInTheDocument());
        expect(screen.getByLabelText('Headcount')).toBeInTheDocument();
        expect(screen.getByLabelText('Findings')).toBeInTheDocument();
    });

    it('loads and displays an employee compliance history after picking an employee', async () => {
        renderPage();

        // The Select.Content option list is only mounted once the trigger is opened —
        // "Tereza Urbanová" is not in the DOM until then (same pattern as the status
        // filter in RunDetailPage.test.tsx).
        await waitFor(() => expect(screen.getByText('Select an employee')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Select an employee'));
        fireEvent.click(await screen.findByRole('option', { name: 'Tereza Urbanová' }));

        await waitFor(() => expect(screen.getByText('BOZP-Z')).toBeInTheDocument());
        expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
});
