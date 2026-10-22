import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RunTrendCharts from '../RunTrendCharts';
import type { IRunTrendPoint } from '../../../models/insights.model';

function point(overrides: Partial<IRunTrendPoint>): IRunTrendPoint {
    return {
        runId: 'r1', runName: 'Run 1', confirmedAt: '2026-10-01T00:00:00Z',
        employees: 10, compliantCount: 7, expiringSoonCount: 1, overdueCount: 2,
        errorCount: 0, warningCount: 1, totalCostKc: 450,
        ...overrides,
    };
}

describe('RunTrendCharts', () => {
    it('renders one point per run on each of the three trend lines', () => {
        const runTrends = [
            point({ runId: 'r1', compliantCount: 7, overdueCount: 2, expiringSoonCount: 1 }),
            point({ runId: 'r2', compliantCount: 8, overdueCount: 1, expiringSoonCount: 1 }),
        ];

        const { container } = render(<RunTrendCharts runTrends={runTrends} />);

        expect(container.querySelectorAll('circle[data-series="compliance"]')).toHaveLength(2);
        expect(container.querySelectorAll('circle[data-series="headcount"]')).toHaveLength(2);
        expect(container.querySelectorAll('circle[data-series="findings"]')).toHaveLength(4); // 2 runs x (error+warning)
        expect(container.querySelectorAll('circle[data-series="cost"]')).toHaveLength(2);
    });

    it('shows an empty-state message when there are no completed runs yet', () => {
        render(<RunTrendCharts runTrends={[]} />);

        expect(screen.getByText(/No completed runs yet/i)).toBeInTheDocument();
    });

    it('does not divide by zero when a run has zero employees', () => {
        const runTrends = [point({ employees: 0, compliantCount: 0, expiringSoonCount: 0, overdueCount: 0 })];

        expect(() => render(<RunTrendCharts runTrends={runTrends} />)).not.toThrow();
    });
});
