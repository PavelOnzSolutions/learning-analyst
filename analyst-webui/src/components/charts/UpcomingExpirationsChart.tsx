import { scaleBand, scaleLinear, max } from 'd3';
import { Text } from '@radix-ui/themes';
import type { IComplianceRecord } from '../../models/run-detail.model';

interface UpcomingExpirationsChartProps {
    records: IComplianceRecord[];
    asOf?: Date;
}

const BUCKETS = ['0-30 days', '31-60 days', '61-90 days', '90+ days'] as const;
type Bucket = typeof BUCKETS[number];

const WIDTH = 500;
const HEIGHT = 260;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 40 };

function bucketFor(daysOut: number): Bucket {
    if (daysOut <= 30) return '0-30 days';
    if (daysOut <= 60) return '31-60 days';
    if (daysOut <= 90) return '61-90 days';
    return '90+ days';
}

export default function UpcomingExpirationsChart({ records, asOf }: UpcomingExpirationsChartProps) {
    const referenceDate = asOf ?? new Date();
    const referenceMs = referenceDate.getTime();

    const upcoming = records.filter((r) => {
        if (!r.expiryDate) return false;
        const expiryMs = new Date(r.expiryDate).getTime();
        return expiryMs >= referenceMs;
    });

    if (upcoming.length === 0) {
        return <Text size="2" color="gray">No upcoming expirations.</Text>;
    }

    const counts: Record<Bucket, number> = { '0-30 days': 0, '31-60 days': 0, '61-90 days': 0, '90+ days': 0 };
    upcoming.forEach((r) => {
        const daysOut = Math.floor((new Date(r.expiryDate as string).getTime() - referenceMs) / (1000 * 60 * 60 * 24));
        counts[bucketFor(daysOut)]++;
    });

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const xScale = scaleBand<Bucket>().domain(BUCKETS).range([0, innerWidth]).padding(0.2);
    const yMax = max(BUCKETS.map((b) => counts[b])) || 1;
    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    return (
        <>
            <Text size="2" color="gray">{upcoming.length} upcoming expiration{upcoming.length !== 1 ? 's' : ''}</Text>
            <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Upcoming expirations">
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                    {BUCKETS.map((bucket) => {
                        const value = counts[bucket];
                        const barHeight = innerHeight - yScale(value);
                        return (
                            <g key={bucket}>
                                <rect
                                    data-bucket={bucket}
                                    x={xScale(bucket)}
                                    y={innerHeight - barHeight}
                                    width={xScale.bandwidth()}
                                    height={barHeight}
                                    fill="var(--amber-9)"
                                />
                                <text
                                    x={(xScale(bucket) || 0) + xScale.bandwidth() / 2}
                                    y={innerHeight + 20}
                                    textAnchor="middle"
                                    fontSize={11}
                                >
                                    {bucket}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </>
    );
}
