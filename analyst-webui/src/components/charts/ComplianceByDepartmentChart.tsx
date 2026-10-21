import { scaleBand, scaleLinear, max } from 'd3';
import { Flex, Text } from '@radix-ui/themes';
import type { ComplianceStatus } from '../../models/run.model';
import type { IComplianceRecord } from '../../models/run-detail.model';

interface ComplianceByDepartmentChartProps {
    records: IComplianceRecord[];
}

const STATUS_ORDER: ComplianceStatus[] = ['COMPLIANT', 'EXPIRING_SOON', 'OVERDUE'];
const STATUS_COLOR: Record<ComplianceStatus, string> = {
    COMPLIANT: 'var(--green-9)',
    EXPIRING_SOON: 'var(--amber-9)',
    OVERDUE: 'var(--red-9)',
};
const STATUS_LABEL: Record<ComplianceStatus, string> = {
    COMPLIANT: 'Compliant',
    EXPIRING_SOON: 'Expiring Soon',
    OVERDUE: 'Overdue',
};

const WIDTH = 560;
const ROW_HEIGHT = 34;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 28;
const MARGIN_RIGHT = 24;

export default function ComplianceByDepartmentChart({ records }: ComplianceByDepartmentChartProps) {
    if (records.length === 0) {
        return <Text size="2" color="gray">No compliance data to chart.</Text>;
    }

    // Horizontal bars: department labels sit to the left of each row, so they
    // never need rotation or truncation no matter how many departments exist.
    const departments = Array.from(new Set(records.map((r) => r.utvar || 'Unknown')));

    const counts = departments.map((department) => {
        const departmentRecords = records.filter((r) => (r.utvar || 'Unknown') === department);
        const byStatus: Record<ComplianceStatus, number> = { COMPLIANT: 0, EXPIRING_SOON: 0, OVERDUE: 0 };
        departmentRecords.forEach((r) => { byStatus[r.status]++; });
        return { department, byStatus, total: departmentRecords.length };
    });

    const longestLabel = Math.max(...departments.map((d) => d.length));
    const marginLeft = Math.min(170, Math.max(70, longestLabel * 7 + 16));

    const innerWidth = WIDTH - marginLeft - MARGIN_RIGHT;
    const innerHeight = departments.length * ROW_HEIGHT;
    const height = innerHeight + MARGIN_TOP + MARGIN_BOTTOM;

    const yScale = scaleBand<string>().domain(departments).range([0, innerHeight]).padding(0.3);
    const xMax = max(counts, (c) => c.total) || 1;
    const xScale = scaleLinear().domain([0, xMax]).range([0, innerWidth]).nice();
    const ticks = xScale.ticks(Math.min(5, xMax));

    return (
        <Flex direction="column" gap="3">
            <svg width="100%" viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="Compliance by department">
                <g transform={`translate(${marginLeft},${MARGIN_TOP})`}>
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line
                                x1={xScale(tick)} x2={xScale(tick)}
                                y1={0} y2={innerHeight}
                                stroke="var(--gray-a4)" strokeWidth={1}
                            />
                            <text
                                x={xScale(tick)} y={innerHeight + 18}
                                textAnchor="middle" fontSize={10}
                                fill="var(--gray-10)"
                            >
                                {tick}
                            </text>
                        </g>
                    ))}

                    {counts.map(({ department, byStatus, total }) => {
                        let xOffset = 0;
                        const bandY = yScale(department) || 0;
                        return (
                            <g key={department}>
                                <text
                                    x={-10} y={bandY + yScale.bandwidth() / 2}
                                    textAnchor="end" dominantBaseline="middle"
                                    fontSize={12} fill="var(--gray-12)"
                                >
                                    {department}
                                </text>
                                {STATUS_ORDER.map((status) => {
                                    const value = byStatus[status];
                                    if (value === 0) return null;
                                    const barWidth = xScale(value) - xScale(0);
                                    const x = xOffset;
                                    xOffset += barWidth;
                                    return (
                                        <rect
                                            key={status}
                                            data-status={status}
                                            x={x}
                                            y={bandY}
                                            width={barWidth}
                                            height={yScale.bandwidth()}
                                            rx={3}
                                            fill={STATUS_COLOR[status]}
                                        >
                                            <title>{STATUS_LABEL[status]}: {value}</title>
                                        </rect>
                                    );
                                })}
                                <text
                                    x={xScale(total) + 8} y={bandY + yScale.bandwidth() / 2}
                                    dominantBaseline="middle" fontSize={11} fill="var(--gray-11)"
                                >
                                    {total}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            <Flex gap="4" wrap="wrap">
                {STATUS_ORDER.map((status) => (
                    <Flex key={status} align="center" gap="2">
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[status], display: 'inline-block' }}/>
                        <Text size="1" color="gray">{STATUS_LABEL[status]}</Text>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
}
