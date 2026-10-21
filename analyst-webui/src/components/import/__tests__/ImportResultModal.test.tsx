import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../context/ToastContext';
import ImportResultModal from '../ImportResultModal';
import config from '../../../config';
import type { IRunResponse } from '../../../models/run.model';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function okJson(data: unknown, status = 200) {
    return Promise.resolve({ ok: true, status, json: () => Promise.resolve(data) } as Response);
}

function noContent() {
    return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(undefined) } as Response);
}

function baseRun(overrides: Partial<IRunResponse> = {}): IRunResponse {
    return {
        id: 'r1', name: 'Test run', status: 'PENDING_REVIEW', createdAt: '2026-01-01T00:00:00Z',
        confirmedAt: null, createdBy: 'u1',
        counts: {
            employees: 1, trainingCatalogEntries: 1, timeslots: 1, completedTrainings: 1,
            errorCount: 0, warningCount: 0, compliantCount: 0, expiringSoonCount: 0, overdueCount: 0,
        },
        findings: [],
        ...overrides,
    };
}

function renderModal(run: IRunResponse, onConfirmed = vi.fn(), onOpenChange = vi.fn(), onRejected = vi.fn()) {
    const queryClient = new QueryClient();
    render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <ImportResultModal run={run} open={true} onOpenChange={onOpenChange} onConfirmed={onConfirmed} onRejected={onRejected} />
            </ToastProvider>
        </QueryClientProvider>
    );
}

beforeEach(() => {
    mockFetch.mockReset();
});

describe('ImportResultModal', () => {
    it('shows a warning dialog instead of confirming immediately when the run has unresolved errors', () => {
        const run = baseRun({ counts: { ...baseRun().counts, errorCount: 2 } });
        renderModal(run);

        fireEvent.click(screen.getByText('Confirm'));

        expect(screen.getByText('Confirm with unresolved errors?')).toBeInTheDocument();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('confirms a run with errors once the warning dialog is acknowledged', async () => {
        const run = baseRun({ counts: { ...baseRun().counts, errorCount: 2 } });
        const confirmed = baseRun({
            status: 'COMPLETED', confirmedAt: '2026-01-02T00:00:00Z',
            counts: { ...baseRun().counts, errorCount: 2 },
        });
        mockFetch.mockImplementation((url: string, init?: RequestInit) => {
            if (url === `${config.apiBaseUrl}/v1/runs/r1/confirm` && init?.method === 'POST') {
                return okJson(confirmed);
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        const onConfirmed = vi.fn();
        const onOpenChange = vi.fn();
        renderModal(run, onConfirmed, onOpenChange);

        fireEvent.click(screen.getByText('Confirm'));
        fireEvent.click(screen.getByText('Confirm Anyway'));

        await waitFor(() => {
            expect(onConfirmed).toHaveBeenCalledWith(confirmed);
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('confirms a clean run immediately with no warning dialog', async () => {
        const run = baseRun();
        const confirmed = baseRun({ status: 'COMPLETED', confirmedAt: '2026-01-02T00:00:00Z' });
        mockFetch.mockImplementation((url: string, init?: RequestInit) => {
            if (url === `${config.apiBaseUrl}/v1/runs/r1/confirm` && init?.method === 'POST') {
                return okJson(confirmed);
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        const onConfirmed = vi.fn();
        const onOpenChange = vi.fn();
        renderModal(run, onConfirmed, onOpenChange);

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(onConfirmed).toHaveBeenCalledWith(confirmed);
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('rejects a run and reports the id back to the caller', async () => {
        const run = baseRun({ counts: { ...baseRun().counts, errorCount: 1 } });
        mockFetch.mockImplementation((url: string, init?: RequestInit) => {
            if (url === `${config.apiBaseUrl}/v1/runs/r1` && init?.method === 'DELETE') {
                return noContent();
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        const onRejected = vi.fn();
        const onOpenChange = vi.fn();
        renderModal(run, vi.fn(), onOpenChange, onRejected);

        fireEvent.click(screen.getByText('Reject'));

        await waitFor(() => {
            expect(onRejected).toHaveBeenCalledWith('r1');
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });
});
