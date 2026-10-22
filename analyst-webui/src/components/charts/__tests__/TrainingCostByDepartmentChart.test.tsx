import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrainingCostByDepartmentChart from '../TrainingCostByDepartmentChart';
import type { IComplianceRecord } from '../../../models/run-detail.model';

function record(overrides: Partial<IComplianceRecord>): IComplianceRecord {
    return {
        idZamestnance: 'E1', employeeName: 'Test', utvar: 'Lab', pozice: 'Tech',
        kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Training', status: 'OVERDUE', expiryDate: null, costKc: null,
        ...overrides,
    };
}

describe('TrainingCostByDepartmentChart', () => {
    it('sums cost per department and renders one bar per department', () => {
        const records = [
            record({ utvar: 'Lab', costKc: 450 }),
            record({ utvar: 'Lab', costKc: 200 }),
            record({ utvar: 'Finance', costKc: 100 }),
        ];

        const { container } = render(<TrainingCostByDepartmentChart records={records} />);

        const bars = container.querySelectorAll('rect[data-department]');
        expect(bars.length).toBe(2);
        const lab = container.querySelector('rect[data-department="Lab"]');
        expect(lab?.querySelector('title')?.textContent).toContain('650');
    });

    it('excludes records with no cost data from the totals', () => {
        const records = [
            record({ utvar: 'Lab', costKc: null }),
        ];

        render(<TrainingCostByDepartmentChart records={records} />);

        expect(screen.getByText(/No cost data/i)).toBeInTheDocument();
    });
});
