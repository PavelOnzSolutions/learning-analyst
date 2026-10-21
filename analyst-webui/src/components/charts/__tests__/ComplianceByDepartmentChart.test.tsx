import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComplianceByDepartmentChart from '../ComplianceByDepartmentChart';
import type { IComplianceRecord } from '../../../models/run-detail.model';

function record(overrides: Partial<IComplianceRecord>): IComplianceRecord {
    return {
        idZamestnance: 'E1', employeeName: 'Test', utvar: 'Lab', pozice: 'Tech',
        kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Training', status: 'OVERDUE', expiryDate: null,
        ...overrides,
    };
}

describe('ComplianceByDepartmentChart', () => {
    it('renders one labeled group per distinct department', () => {
        const records = [
            record({ utvar: 'Lab', status: 'OVERDUE' }),
            record({ utvar: 'Lab', status: 'COMPLIANT' }),
            record({ utvar: 'Finance', status: 'EXPIRING_SOON' }),
        ];

        render(<ComplianceByDepartmentChart records={records} />);

        expect(screen.getByText('Lab')).toBeInTheDocument();
        expect(screen.getByText('Finance')).toBeInTheDocument();
    });

    it('renders a bar segment for every status present in a department', () => {
        const records = [
            record({ utvar: 'Lab', status: 'OVERDUE' }),
            record({ utvar: 'Lab', status: 'COMPLIANT' }),
        ];

        const { container } = render(<ComplianceByDepartmentChart records={records} />);

        const rects = container.querySelectorAll('rect[data-status]');
        expect(rects.length).toBe(2);
        const statuses = Array.from(rects).map((r) => r.getAttribute('data-status'));
        expect(statuses).toContain('OVERDUE');
        expect(statuses).toContain('COMPLIANT');
    });

    it('renders nothing but an empty-state message when there are no records', () => {
        render(<ComplianceByDepartmentChart records={[]} />);

        expect(screen.getByText(/No compliance data/i)).toBeInTheDocument();
    });
});
