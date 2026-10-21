import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UpcomingExpirationsChart from '../UpcomingExpirationsChart';
import type { IComplianceRecord } from '../../../models/run-detail.model';

function record(expiryDate: string | null): IComplianceRecord {
    return {
        idZamestnance: 'E1', employeeName: 'Test', utvar: 'Lab', pozice: 'Tech',
        kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Training', status: 'EXPIRING_SOON', expiryDate,
    };
}

const ASOF = new Date('2026-01-01T00:00:00Z');

describe('UpcomingExpirationsChart', () => {
    it('buckets records into 30/60/90/90+ day windows from the reference date', () => {
        const records = [
            record('2026-01-15'),  // 14 days out -> 0-30 bucket
            record('2026-02-10'),  // 40 days out -> 31-60 bucket
            record('2026-03-20'),  // 78 days out -> 61-90 bucket
            record('2026-06-01'),  // far out -> 90+ bucket
        ];

        const { container } = render(<UpcomingExpirationsChart records={records} asOf={ASOF} />);

        const bars = container.querySelectorAll('rect[data-bucket]');
        expect(bars.length).toBe(4);
    });

    it('excludes records with no expiry date or an expiry date already in the past', () => {
        const records = [
            record(null),
            record('2025-01-01'), // before ASOF
            record('2026-01-10'), // valid, upcoming
        ];

        render(<UpcomingExpirationsChart records={records} asOf={ASOF} />);

        expect(screen.getByText(/1 upcoming expiration/i)).toBeInTheDocument();
    });

    it('shows an empty-state message when nothing is upcoming', () => {
        render(<UpcomingExpirationsChart records={[]} asOf={ASOF} />);

        expect(screen.getByText(/No upcoming expirations/i)).toBeInTheDocument();
    });
});
