import { scaleBand, scaleLinear, max } from 'd3';
import { Flex, Text } from '@radix-ui/themes';
import type { IEmployeeSummary } from '../../models/run-detail.model';

interface OrgHeadcountChartProps {
    employees: IEmployeeSummary[];
}

const WIDTH = 280;
const HEIGHT = 260;
const MARGIN = { top: 20, right: 10, bottom: 50, left: 30 };

function countBy(employees: IEmployeeSummary[], key: 'utvar' | 'pozice'): { label: string; count: number }[] {
    const counts = new Map<string, number>();
    employees.forEach((e) => {
        const label = e[key] || 'Unknown';
        counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function BarGroup({ title, data }: { title: string; data: { label: string; count: number }[] }) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const labels = data.map((d) => d.label);
    const xScale = scaleBand<string>().domain(labels).range([0, innerWidth]).padding(0.2);
    const yMax = max(data, (d) => d.count) || 1;
    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    return (
        <Flex direction="column" gap="2">
            <Text size="2" weight="bold">{title}</Text>
            <svg width={WIDTH} height={HEIGHT} role="img" aria-label={title}>
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
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
                                    fill="var(--accent-9)"
                                />
                                <text
                                    x={bandX + xScale.bandwidth() / 2}
                                    y={innerHeight + 15}
                                    textAnchor="middle"
                                    fontSize={10}
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
        <Flex gap="4" wrap="wrap">
            <BarGroup title="Headcount by Department" data={byDepartment} />
            <BarGroup title="Headcount by Position" data={byPosition} />
        </Flex>
    );
}
