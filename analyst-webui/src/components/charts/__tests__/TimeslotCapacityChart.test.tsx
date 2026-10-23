import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimeslotCapacityChart from '../TimeslotCapacityChart';
import type { ITimeslotSummary } from '../../../models/run-detail.model';

function timeslot(overrides: Partial<ITimeslotSummary>): ITimeslotSummary {
    return {
        idTerminu: 'T1', kodSkoleni: 'BOZP-Z', nazevSkoleni: 'Základní školení BOZP', datum: '2026-02-01', misto: 'Aula A',
        kapacita: 10, obsazeno: 5, stav: 'plánováno', costPerPerson: null,
        ...overrides,
    };
}

const ASOF = new Date('2026-01-01T00:00:00Z');

describe('TimeslotCapacityChart', () => {
    it('renders one bar per upcoming timeslot and excludes past ones', () => {
        const timeslots = [
            timeslot({ idTerminu: 'T1', datum: '2026-02-01' }),
            timeslot({ idTerminu: 'T2', datum: '2025-01-01' }),
        ];

        const { container } = render(<TimeslotCapacityChart timeslots={timeslots} asOf={ASOF} />);

        const bars = container.querySelectorAll('rect[data-timeslot]');
        expect(bars.length).toBe(1);
        expect(bars[0].getAttribute('data-timeslot')).toBe('T1');
    });

    it('flags an overbooked timeslot distinctly from a normal one', () => {
        const timeslots = [
            timeslot({ idTerminu: 'OVER', kapacita: 10, obsazeno: 12 }),
            timeslot({ idTerminu: 'NORMAL', kapacita: 10, obsazeno: 5 }),
        ];

        const { container } = render(<TimeslotCapacityChart timeslots={timeslots} asOf={ASOF} />);

        const overbooked = container.querySelector('rect[data-timeslot="OVER"]');
        const normal = container.querySelector('rect[data-timeslot="NORMAL"]');
        expect(overbooked?.getAttribute('data-flag')).toBe('overbooked');
        expect(normal?.getAttribute('data-flag')).toBe('normal');
    });

    it('flags a cancelled timeslot and a zero-capacity non-cancelled timeslot distinctly', () => {
        const timeslots = [
            timeslot({ idTerminu: 'CANCELLED', stav: 'zrušeno' }),
            timeslot({ idTerminu: 'ZEROCAP', kapacita: 0, obsazeno: 0, stav: 'plánováno' }),
        ];

        const { container } = render(<TimeslotCapacityChart timeslots={timeslots} asOf={ASOF} />);

        expect(container.querySelector('rect[data-timeslot="CANCELLED"]')?.getAttribute('data-flag')).toBe('cancelled');
        expect(container.querySelector('rect[data-timeslot="ZEROCAP"]')?.getAttribute('data-flag')).toBe('zero-capacity');
    });

    it('shows an empty-state message when there are no upcoming timeslots', () => {
        render(<TimeslotCapacityChart timeslots={[]} asOf={ASOF} />);

        expect(screen.getByText(/No upcoming timeslots/i)).toBeInTheDocument();
    });

    it('includes the training name alongside time and occupancy for each timeslot', () => {
        const timeslots = [
            timeslot({ idTerminu: 'T1', nazevSkoleni: 'Základní školení BOZP', kodSkoleni: 'BOZP-Z' }),
            timeslot({ idTerminu: 'T2', nazevSkoleni: null, kodSkoleni: 'FIRST-AID' }),
        ];

        const { container } = render(<TimeslotCapacityChart timeslots={timeslots} asOf={ASOF} />);

        const withName = container.querySelector('rect[data-timeslot="T1"]');
        expect(withName?.getAttribute('data-training')).toBe('Základní školení BOZP');
        expect(withName?.querySelector('title')?.textContent).toContain('Základní školení BOZP');

        const withoutName = container.querySelector('rect[data-timeslot="T2"]');
        expect(withoutName?.getAttribute('data-training')).toBe('FIRST-AID');
    });
});
