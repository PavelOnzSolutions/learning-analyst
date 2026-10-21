import { scaleBand, scaleLinear, max } from 'd3';
import { Flex, Text } from '@radix-ui/themes';
import type { IEmployeeSummary } from '../../models/run-detail.model';

interface OrgHeadcountChartProps {
    employees: IEmployeeSummary[];
}

const WIDTH = 300;
const HEIGHT = 300;
const MARGIN = { top: 20, right: 10, bottom: 50, left: 30 };

function countBy(employees: IEmployeeSummary[], key: 'utvar' | 'pozice'): { label: string; count: number }[] {
    const counts = new Map<string, number>();
    employees.forEach((e) => {
        const label = e[key] || 'Unknown';
        counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function BarGroup({ title, data, color }: { title: string; data: { label: string; count: number }[]; color: string }) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const labels = data.map((d) => d.label);
    const xScale = scaleBand<string>().domain(labels).range([0, innerWidth]).padding(0.25);
    const yMax = max(data, (d) => d.count) || 1;
    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]).nice();
    const ticks = yScale.ticks(4);

    return (
        <Flex direction="column" gap="2">
            <Text size="2" weight="bold" color="gray">{title}</Text>
            <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                    {ticks.map((tick) => (
                        <line key={tick} x1={0} x2={innerWidth} y1={yScale(tick)} y2={yScale(tick)} stroke="var(--gray-a4)" strokeWidth={1}/>
                    ))}
                    {data.map(({ label, count }) => {
                        const barHeight = innerHeight - yScale(count);
                        const bandX = xScale(label) || 0;
                        return (
                            <g key={label}>
                                <rect
                                    data-group={label}
                                    x={bandX}
                                    y={innerHeight - barHeight}
                                    width={xScale.bandwidth()}
                                    height={barHeight}
                                    rx={4}
                                    fill={color}
                                >
                                    <title>{label}: {count}</title>
                                </rect>
                                <text
                                    x={bandX + xScale.bandwidth() / 2}
                                    y={innerHeight - barHeight - 6}
                                    textAnchor="middle"
                                    fontSize={11}
                                    fill="var(--gray-12)"
                                >
                                    {count}
                                </text>
                                <text
                                    x={bandX + xScale.bandwidth() / 2}
                                    y={innerHeight + 15}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="var(--gray-11)"
                                    transform={`rotate(-30, ${bandX + xScale.bandwidth() / 2}, ${innerHeight + 15})`}
                                >
                                    {label}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </Flex>
    );
}

export default function OrgHeadcountChart({ employees }: OrgHeadcountChartProps) {
    if (employees.length === 0) {
        return <Text size="2" color="gray">No employee data to chart.</Text>;
    }

    const byDepartment = countBy(employees, 'utvar');
    const byPosition = countBy(employees, 'pozice');

    return (
        <Flex gap="4" justify="center">
            <BarGroup title="Headcount by Department" data={byDepartment} color="var(--accent-9)"/>
            <BarGroup title="Headcount by Position" data={byPosition} color="var(--cyan-9)"/>
        </Flex>
    );
}
