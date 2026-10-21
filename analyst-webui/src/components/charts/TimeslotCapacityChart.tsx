import { scaleBand, scaleLinear, max } from 'd3';
import { Text } from '@radix-ui/themes';
import type { ITimeslotSummary } from '../../models/run-detail.model';

interface TimeslotCapacityChartProps {
    timeslots: ITimeslotSummary[];
    asOf?: Date;
}

type Flag = 'overbooked' | 'cancelled' | 'zero-capacity' | 'normal';

const FLAG_COLOR: Record<Flag, string> = {
    overbooked: 'var(--red-9)',
    cancelled: 'var(--gray-7)',
    'zero-capacity': 'var(--amber-9)',
    normal: 'var(--grass-9)',
};

const CANCELLED_STATUS = 'zrušeno';
const WIDTH = 600;
const HEIGHT = 280;
const MARGIN = { top: 20, right: 20, bottom: 50, left: 40 };

function flagFor(timeslot: ITimeslotSummary): Flag {
    const isCancelled = (timeslot.stav || '').trim().toLowerCase() === CANCELLED_STATUS;
    if (isCancelled) return 'cancelled';
    if ((timeslot.kapacita ?? 0) === 0) return 'zero-capacity';
    if ((timeslot.obsazeno ?? 0) > (timeslot.kapacita ?? 0)) return 'overbooked';
    return 'normal';
}

export default function TimeslotCapacityChart({ timeslots, asOf }: TimeslotCapacityChartProps) {
    const referenceDate = asOf ?? new Date();
    const referenceMs = referenceDate.getTime();

    const upcoming = timeslots.filter((t) => t.datum && new Date(t.datum).getTime() >= referenceMs);

    if (upcoming.length === 0) {
        return <Text size="2" color="gray">No upcoming timeslots.</Text>;
    }

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const ids = upcoming.map((t) => t.idTerminu);
    const xScale = scaleBand<string>().domain(ids).range([0, innerWidth]).padding(0.2);
    const yMax = max(upcoming, (t) => Math.max(t.kapacita ?? 0, t.obsazeno ?? 0)) || 1;
    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    return (
        <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Timeslot capacity utilization">
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {upcoming.map((timeslot) => {
                    const flag = flagFor(timeslot);
                    const barHeight = innerHeight - yScale(timeslot.obsazeno ?? 0);
                    const capacityY = yScale(timeslot.kapacita ?? 0);
                    const bandX = xScale(timeslot.idTerminu) || 0;
                    return (
                        <g key={timeslot.idTerminu}>
                            <rect
                                data-timeslot={timeslot.idTerminu}
                                data-flag={flag}
                                x={bandX}
                                y={innerHeight - barHeight}
                                width={xScale.bandwidth()}
                                height={barHeight}
                                fill={FLAG_COLOR[flag]}
                            />
                            <line
                                x1={bandX}
                                x2={bandX + xScale.bandwidth()}
                                y1={capacityY}
                                y2={capacityY}
                                stroke="var(--gray-12)"
                                strokeWidth={2}
                            />
                            <text
                                x={bandX + xScale.bandwidth() / 2}
                                y={innerHeight + 20}
                                textAnchor="middle"
                                fontSize={10}
                                transform={`rotate(-30, ${bandX + xScale.bandwidth() / 2}, ${innerHeight + 20})`}
                            >
                                {timeslot.idTerminu}
                            </text>
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}
