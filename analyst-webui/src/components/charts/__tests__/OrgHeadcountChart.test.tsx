import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrgHeadcountChart from '../OrgHeadcountChart';
import type { IEmployeeSummary } from '../../../models/run-detail.model';

function employee(overrides: Partial<IEmployeeSummary>): IEmployeeSummary {
    return {
        idZamestnance: 'E1', jmeno: 'Test', prijmeni: 'Employee',
        utvar: 'Lab', pozice: 'Tech', stav: 'aktivní',
        ...overrides,
    };
}

describe('OrgHeadcountChart', () => {
    it('renders a bar per distinct department and per distinct position', () => {
        const employees = [
            employee({ utvar: 'Lab', pozice: 'Tech' }),
            employee({ utvar: 'Lab', pozice: 'Manager' }),
            employee({ utvar: 'Finance', pozice: 'Accountant' }),
        ];

        render(<OrgHeadcountChart employees={employees} />);

        expect(screen.getByText('Lab')).toBeInTheDocument();
        expect(screen.getByText('Finance')).toBeInTheDocument();
        expect(screen.getByText('Tech')).toBeInTheDocument();
        expect(screen.getByText('Manager')).toBeInTheDocument();
        expect(screen.getByText('Accountant')).toBeInTheDocument();
    });

    it('shows an empty-state message when there are no employees', () => {
        render(<OrgHeadcountChart employees={[]} />);

        expect(screen.getByText(/No employee data/i)).toBeInTheDocument();
    });
});
