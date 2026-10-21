import { scaleBand, scaleLinear, max } from 'd3';
import { Text } from '@radix-ui/themes';
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

const WIDTH = 600;
const HEIGHT = 300;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 40 };

export default function ComplianceByDepartmentChart({ records }: ComplianceByDepartmentChartProps) {
    if (records.length === 0) {
        return <Text size="2" color="gray">No compliance data to chart.</Text>;
    }

    const departments = Array.from(new Set(records.map((r) => r.utvar || 'Unknown')));

    const counts = departments.map((department) => {
        const departmentRecords = records.filter((r) => (r.utvar || 'Unknown') === department);
        const byStatus: Record<ComplianceStatus, number> = { COMPLIANT: 0, EXPIRING_SOON: 0, OVERDUE: 0 };
        departmentRecords.forEach((r) => { byStatus[r.status]++; });
        return { department, byStatus, total: departmentRecords.length };
    });

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const xScale = scaleBand<string>().domain(departments).range([0, innerWidth]).padding(0.2);
    const yMax = max(counts, (c) => c.total) || 1;
    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    return (
        <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Compliance by department">
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {counts.map(({ department, byStatus }) => {
                    let yOffset = innerHeight;
                    return (
                        <g key={department}>
                            {STATUS_ORDER.map((status) => {
                                const value = byStatus[status];
                                if (value === 0) return null;
                                const barHeight = innerHeight - yScale(value);
                                yOffset -= barHeight;
                                return (
                                    <rect
                                        key={status}
                                        data-status={status}
                                        x={xScale(department)}
                                        y={yOffset}
                                        width={xScale.bandwidth()}
                                        height={barHeight}
                                        fill={STATUS_COLOR[status]}
                                    />
                                );
                            })}
                            <text
                                x={(xScale(department) || 0) + xScale.bandwidth() / 2}
                                y={innerHeight + 20}
                                textAnchor="middle"
                                fontSize={12}
                            >
                                {department}
                            </text>
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}
