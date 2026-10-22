import { scaleLinear, scalePoint, line as d3Line, max } from 'd3';
import { Flex, Text } from '@radix-ui/themes';
import type { IRunTrendPoint } from '../../models/insights.model';

interface RunTrendChartsProps {
    runTrends: IRunTrendPoint[];
}

const WIDTH = 320;
const HEIGHT = 200;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 36 };

function compliancePercent(point: IRunTrendPoint): number {
    const total = point.compliantCount + point.expiringSoonCount + point.overdueCount;
    return total === 0 ? 0 : (point.compliantCount / total) * 100;
}

interface LineChartProps {
    title: string;
    runTrends: IRunTrendPoint[];
    series: { label: string; color: string; key: string; value: (p: IRunTrendPoint) => number }[];
}

function LineChart({ title, runTrends, series }: LineChartProps) {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const xScale = scalePoint<string>().domain(runTrends.map((r) => r.runId)).range([0, innerWidth]);
    const yMax = max(series.flatMap((s) => runTrends.map((r) => s.value(r)))) || 1;
    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]).nice();

    return (
        <Flex direction="column" gap="2">
            <Text size="2" weight="bold" color="gray">{title}</Text>
            <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title}>
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                    {series.map((s) => {
                        const path = d3Line<IRunTrendPoint>()
                            .x((p) => xScale(p.runId) ?? 0)
                            .y((p) => yScale(s.value(p)))(runTrends);
                        return (
                            <g key={s.key}>
                                <path d={path ?? ''} fill="none" stroke={s.color} strokeWidth={2}/>
                                {runTrends.map((p) => (
                                    <circle
                                        key={p.runId}
                                        data-series={s.key}
                                        cx={xScale(p.runId) ?? 0}
                                        cy={yScale(s.value(p))}
                                        r={3}
                                        fill={s.color}
                                    >
                                        <title>{p.runName}: {s.label} {s.value(p)}</title>
                                    </circle>
                                ))}
                            </g>
                        );
                    })}
                </g>
            </svg>
            <Flex gap="3" wrap="wrap">
                {series.map((s) => (
                    <Flex key={s.key} align="center" gap="2">
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }}/>
                        <Text size="1" color="gray">{s.label}</Text>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
}

export default function RunTrendCharts({ runTrends }: RunTrendChartsProps) {
    if (runTrends.length === 0) {
        return <Text size="2" color="gray">No completed runs yet. Trends will appear here once at least one import has been confirmed.</Text>;
    }

    return (
        <Flex gap="4" wrap="wrap">
            <LineChart
                title="Compliance %"
                runTrends={runTrends}
                series={[{ label: 'Compliant %', color: 'var(--green-9)', key: 'compliance', value: compliancePercent }]}
            />
            <LineChart
                title="Headcount"
                runTrends={runTrends}
                series={[{ label: 'Employees', color: 'var(--accent-9)', key: 'headcount', value: (p) => p.employees }]}
            />
            <LineChart
                title="Findings"
                runTrends={runTrends}
                series={[
                    { label: 'Errors', color: 'var(--red-9)', key: 'findings', value: (p) => p.errorCount },
                    { label: 'Warnings', color: 'var(--amber-9)', key: 'findings', value: (p) => p.warningCount },
                ]}
            />
        </Flex>
    );
}
