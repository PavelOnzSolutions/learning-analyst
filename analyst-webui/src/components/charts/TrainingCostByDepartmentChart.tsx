import { scaleBand, scaleLinear, max } from 'd3';
import { Flex, Text } from '@radix-ui/themes';
import type { IComplianceRecord } from '../../models/run-detail.model';

interface TrainingCostByDepartmentChartProps {
    records: IComplianceRecord[];
}

const WIDTH = 560;
const ROW_HEIGHT = 34;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 28;
const MARGIN_RIGHT = 24;

export default function TrainingCostByDepartmentChart({ records }: TrainingCostByDepartmentChartProps) {
    const withCost = records.filter((r) => r.costKc !== null);
    if (withCost.length === 0) {
        return <Text size="2" color="gray">No cost data to chart.</Text>;
    }

    const departments = Array.from(new Set(withCost.map((r) => r.utvar || 'Unknown')));
    const totals = departments.map((department) => {
        const total = withCost
            .filter((r) => (r.utvar || 'Unknown') === department)
            .reduce((sum, r) => sum + (r.costKc ?? 0), 0);
        return { department, total };
    });

    const longestLabel = Math.max(...departments.map((d) => d.length));
    const marginLeft = Math.min(170, Math.max(70, longestLabel * 7 + 16));

    const innerWidth = WIDTH - marginLeft - MARGIN_RIGHT;
    const innerHeight = departments.length * ROW_HEIGHT;
    const height = innerHeight + MARGIN_TOP + MARGIN_BOTTOM;

    const yScale = scaleBand<string>().domain(departments).range([0, innerHeight]).padding(0.3);
    const xMax = max(totals, (t) => t.total) || 1;
    const xScale = scaleLinear().domain([0, xMax]).range([0, innerWidth]).nice();
    const ticks = xScale.ticks(Math.min(5, xMax));

    return (
        <Flex direction="column" gap="3">
            <svg width="100%" viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="Training cost by department">
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
                                {tick.toLocaleString()}
                            </text>
                        </g>
                    ))}

                    {totals.map(({ department, total }) => {
                        const bandY = yScale(department) || 0;
                        const barWidth = xScale(total) - xScale(0);
                        return (
                            <g key={department}>
                                <text
                                    x={-10} y={bandY + yScale.bandwidth() / 2}
                                    textAnchor="end" dominantBaseline="middle"
                                    fontSize={12} fill="var(--gray-12)"
                                >
                                    {department}
                                </text>
                                <rect
                                    data-department={department}
                                    x={0}
                                    y={bandY}
                                    width={barWidth}
                                    height={yScale.bandwidth()}
                                    rx={3}
                                    fill="var(--purple-9)"
                                >
                                    <title>{department}: {total.toLocaleString()} Kč</title>
                                </rect>
                                <text
                                    x={barWidth + 8} y={bandY + yScale.bandwidth() / 2}
                                    dominantBaseline="middle" fontSize={11} fill="var(--gray-11)"
                                >
                                    {total.toLocaleString()} Kč
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </Flex>
    );
}
