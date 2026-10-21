import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../context/ToastContext';
import NewImportModal from '../NewImportModal';
import config from '../../../config';
import type { IRunResponse } from '../../../models/run.model';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function okJson(data: unknown, status = 201) {
    return Promise.resolve({ ok: true, status, json: () => Promise.resolve(data) } as Response);
}

function renderModal(onCreated = vi.fn(), onOpenChange = vi.fn()) {
    const queryClient = new QueryClient();
    render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <NewImportModal open={true} onOpenChange={onOpenChange} onCreated={onCreated} />
            </ToastProvider>
        </QueryClientProvider>
    );
    return { onCreated, onOpenChange };
}

function csvFile(name: string) {
    return new File(['a,b\n1,2\n'], name, { type: 'text/csv' });
}

function baseRun(): IRunResponse {
    return {
        id: 'r1', name: 'Test run', status: 'PENDING_REVIEW', createdAt: '2026-01-01T00:00:00Z',
        confirmedAt: null, createdBy: 'u1',
        counts: {
            employees: 1, trainingCatalogEntries: 1, timeslots: 1, completedTrainings: 1,
            errorCount: 0, warningCount: 0, compliantCount: 0, expiringSoonCount: 0, overdueCount: 0,
        },
        findings: [],
    };
}

beforeEach(() => {
    mockFetch.mockReset();
});

describe('NewImportModal', () => {
    it('submits a multipart request with the exact 5 part names the backend requires', async () => {
        const run = baseRun();
        mockFetch.mockImplementation((url: string, init?: RequestInit) => {
            if (url === `${config.apiBaseUrl}/v1/runs` && init?.method === 'POST') {
                return okJson(run);
            }
            throw new Error(`Unexpected fetch to ${url}`);
        });

        const { onCreated, onOpenChange } = renderModal();

        fireEvent.change(screen.getByPlaceholderText('e.g., October 2026 import'), { target: { value: 'Test run' } });

        const inputs = document.querySelectorAll('input[type="file"]');
        fireEvent.change(inputs[0], { target: { files: [csvFile('completed.csv')] } });
        fireEvent.change(inputs[1], { target: { files: [csvFile('catalog.csv')] } });
        fireEvent.change(inputs[2], { target: { files: [csvFile('timeslots.csv')] } });
        fireEvent.change(inputs[3], { target: { files: [csvFile('employees.csv')] } });

        fireEvent.click(screen.getByText('Analyze'));

        await waitFor(() => {
            const postCall = mockFetch.mock.calls.find(([, init]) => init?.method === 'POST');
            expect(postCall).toBeDefined();
            const formData = postCall![1].body as FormData;
            expect(formData.get('name')).toBe('Test run');
            expect((formData.get('completedTrainings') as File).name).toBe('completed.csv');
            expect((formData.get('trainingCatalog') as File).name).toBe('catalog.csv');
            expect((formData.get('timeslots') as File).name).toBe('timeslots.csv');
            expect((formData.get('employees') as File).name).toBe('employees.csv');
        });

        await waitFor(() => {
            expect(onCreated).toHaveBeenCalledWith(run);
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('disables the Analyze button until all 4 files and a name are provided', () => {
        renderModal();
        expect(screen.getByText('Analyze').closest('button')).toBeDisabled();
    });
});
