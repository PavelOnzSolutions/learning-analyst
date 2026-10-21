import { scaleBand, scaleLinear, max } from 'd3';
import { Flex, Text } from '@radix-ui/themes';
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

const FLAG_LABEL: Record<Flag, string> = {
    overbooked: 'Overbooked',
    cancelled: 'Cancelled',
    'zero-capacity': 'Zero Capacity',
    normal: 'Normal',
};

const CANCELLED_STATUS = 'zrušeno';
const WIDTH = 600;
const HEIGHT = 280;
const MARGIN = { top: 20, right: 20, bottom: 56, left: 40 };

function flagFor(timeslot: ITimeslotSummary): Flag {
    const isCancelled = (timeslot.stav || '').trim().toLowerCase() === CANCELLED_STATUS;
    if (isCancelled) return 'cancelled';
    if ((timeslot.kapacita ?? 0) === 0) return 'zero-capacity';
    if ((timeslot.obsazeno ?? 0) > (timeslot.kapacita ?? 0)) return 'overbooked';
    return 'normal';
}

function formatDate(datum: string | null): string {
    if (!datum) return '';
    return new Date(datum).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
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
    const xScale = scaleBand<string>().domain(ids).range([0, innerWidth]).padding(0.25);
    const yMax = max(upcoming, (t) => Math.max(t.kapacita ?? 0, t.obsazeno ?? 0)) || 1;
    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]).nice();
    const ticks = yScale.ticks(4);

    return (
        <Flex direction="column" gap="3">
            <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Timeslot capacity utilization">
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line x1={0} x2={innerWidth} y1={yScale(tick)} y2={yScale(tick)} stroke="var(--gray-a4)" strokeWidth={1}/>
                            <text x={-8} y={yScale(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--gray-10)">{tick}</text>
                        </g>
                    ))}
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
                                    rx={4}
                                    fill={FLAG_COLOR[flag]}
                                >
                                    <title>{formatDate(timeslot.datum)} — {timeslot.obsazeno}/{timeslot.kapacita} ({FLAG_LABEL[flag]})</title>
                                </rect>
                                <line
                                    x1={bandX}
                                    x2={bandX + xScale.bandwidth()}
                                    y1={capacityY}
                                    y2={capacityY}
                                    stroke="var(--gray-12)"
                                    strokeWidth={2}
                                    strokeDasharray="4 2"
                                />
                                <text
                                    x={bandX + xScale.bandwidth() / 2}
                                    y={innerHeight + 20}
                                    textAnchor="end"
                                    fontSize={10}
                                    fill="var(--gray-11)"
                                    transform={`rotate(-40, ${bandX + xScale.bandwidth() / 2}, ${innerHeight + 20})`}
                                >
                                    {formatDate(timeslot.datum)}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            <Flex gap="4" wrap="wrap">
                {(Object.keys(FLAG_LABEL) as Flag[]).map((flag) => (
                    <Flex key={flag} align="center" gap="2">
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: FLAG_COLOR[flag], display: 'inline-block' }}/>
                        <Text size="1" color="gray">{FLAG_LABEL[flag]}</Text>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
}
