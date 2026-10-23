import type { CSSProperties } from 'react';
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

const FLAG_ICON: Record<Flag, string> = {
    overbooked: '✕',
    cancelled: '–',
    'zero-capacity': '!',
    normal: '✓',
};

const FLAG_LABEL: Record<Flag, string> = {
    overbooked: 'Overbooked',
    cancelled: 'Cancelled',
    'zero-capacity': 'Zero Capacity',
    normal: 'Normal',
};

const CANCELLED_STATUS = 'zrušeno';
const CHART_WIDTH = 480;
const ROW_HEIGHT = 44;
const BAR_HEIGHT = 16;
const MARGIN = { top: 24, right: 56, bottom: 4 };
const LABEL_COLUMN_WIDTH = 180;

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

function trainingLabel(timeslot: ITimeslotSummary): string {
    return timeslot.nazevSkoleni || timeslot.kodSkoleni || 'Unknown training';
}

function statusBadgeStyle(flag: Flag): CSSProperties {
    return {
        width: 18,
        height: 18,
        borderRadius: 5,
        background: FLAG_COLOR[flag],
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
    };
}

export default function TimeslotCapacityChart({ timeslots, asOf }: TimeslotCapacityChartProps) {
    const referenceDate = asOf ?? new Date();
    const referenceMs = referenceDate.getTime();

    const upcoming = timeslots
        .filter((t) => t.datum && new Date(t.datum).getTime() >= referenceMs)
        .sort((a, b) => new Date(a.datum as string).getTime() - new Date(b.datum as string).getTime());

    if (upcoming.length === 0) {
        return <Text size="2" color="gray">No upcoming timeslots.</Text>;
    }

    const innerWidth = CHART_WIDTH - MARGIN.right;
    const innerHeight = upcoming.length * ROW_HEIGHT;
    const svgHeight = innerHeight + MARGIN.top + MARGIN.bottom;

    const ids = upcoming.map((t) => t.idTerminu);
    const yScale = scaleBand<string>().domain(ids).range([0, innerHeight]).padding(0.25);
    const yMax = max(upcoming, (t) => Math.max(t.kapacita ?? 0, t.obsazeno ?? 0)) || 1;
    const xScale = scaleLinear().domain([0, yMax]).range([0, innerWidth]).nice();
    const ticks = xScale.ticks(4);

    return (
        <Flex direction="column" gap="3">
            <Flex gap="3">
                <Flex direction="column" style={{ width: LABEL_COLUMN_WIDTH, flexShrink: 0, paddingTop: MARGIN.top }}>
                    {upcoming.map((timeslot) => {
                        const flag = flagFor(timeslot);
                        return (
                            <Flex key={timeslot.idTerminu} align="center" gap="2" style={{ height: ROW_HEIGHT, minWidth: 0 }}>
                                <span aria-hidden style={statusBadgeStyle(flag)}>{FLAG_ICON[flag]}</span>
                                <Flex direction="column" style={{ minWidth: 0, flex: 1 }}>
                                    <Text
                                        size="2"
                                        weight="medium"
                                        style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                        {trainingLabel(timeslot)}
                                    </Text>
                                    <Text size="1" color="gray" style={{ display: 'block' }}>
                                        {formatDate(timeslot.datum)}
                                    </Text>
                                </Flex>
                            </Flex>
                        );
                    })}
                </Flex>

                <svg
                    width="100%"
                    height={svgHeight}
                    viewBox={`0 0 ${CHART_WIDTH} ${svgHeight}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Timeslot capacity utilization by training"
                    style={{ flex: 1, minWidth: 0 }}
                >
                    <g transform={`translate(0,${MARGIN.top})`}>
                        {ticks.map((tick) => (
                            <g key={tick}>
                                <line x1={xScale(tick)} x2={xScale(tick)} y1={0} y2={innerHeight} stroke="var(--gray-a4)" strokeWidth={1}/>
                                <text x={xScale(tick)} y={-9} textAnchor="middle" fontSize={10} fill="var(--gray-10)">{tick}</text>
                            </g>
                        ))}
                        {upcoming.map((timeslot) => {
                            const flag = flagFor(timeslot);
                            const bandY = yScale(timeslot.idTerminu) || 0;
                            const rowCenter = bandY + yScale.bandwidth() / 2;
                            const barY = rowCenter - BAR_HEIGHT / 2;
                            const barWidth = xScale(timeslot.obsazeno ?? 0);
                            const capacityX = xScale(timeslot.kapacita ?? 0);
                            return (
                                <g key={timeslot.idTerminu}>
                                    <rect x={0} y={barY} width={innerWidth} height={BAR_HEIGHT} rx={4} fill="var(--gray-a3)"/>
                                    <rect
                                        data-timeslot={timeslot.idTerminu}
                                        data-flag={flag}
                                        data-training={trainingLabel(timeslot)}
                                        x={0}
                                        y={barY}
                                        width={barWidth}
                                        height={BAR_HEIGHT}
                                        rx={4}
                                        fill={FLAG_COLOR[flag]}
                                    >
                                        <title>{trainingLabel(timeslot)} — {formatDate(timeslot.datum)} — {timeslot.obsazeno}/{timeslot.kapacita} ({FLAG_LABEL[flag]})</title>
                                    </rect>
                                    <line
                                        x1={capacityX}
                                        x2={capacityX}
                                        y1={barY - 4}
                                        y2={barY + BAR_HEIGHT + 4}
                                        stroke="var(--gray-12)"
                                        strokeWidth={2}
                                        strokeDasharray="3 2"
                                    />
                                    <text
                                        x={barWidth + 6}
                                        y={rowCenter}
                                        dominantBaseline="middle"
                                        fontSize={11}
                                        fill="var(--gray-11)"
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        {timeslot.obsazeno}/{timeslot.kapacita}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </Flex>

            <Flex gap="4" wrap="wrap">
                {(Object.keys(FLAG_LABEL) as Flag[]).map((flag) => (
                    <Flex key={flag} align="center" gap="2">
                        <span aria-hidden style={statusBadgeStyle(flag)}>{FLAG_ICON[flag]}</span>
                        <Text size="1" color="gray">{FLAG_LABEL[flag]}</Text>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
}
