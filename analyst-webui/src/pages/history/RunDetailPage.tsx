import { useState } from 'react';
import { Badge, Card, Flex, Select, Table, Text, Progress } from '@radix-ui/themes';
import { History } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader';
import { usePageTitle } from '../../context/PageTitleContext';
import { fetchWithAuth } from '../../utils/api';
import type { IRunResponse } from '../../models/run.model';
import type { ComplianceStatus } from '../../models/run.model';
import type { IRunDetailResponse } from '../../models/run-detail.model';

const fetchRun = async (id: string): Promise<IRunResponse> => {
    const response = await fetchWithAuth(`/v1/runs/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch run: ' + response.status);
    }
    return response.json();
};

const fetchRunDetail = async (id: string): Promise<IRunDetailResponse> => {
    const response = await fetchWithAuth(`/v1/runs/${id}/detail`);
    if (!response.ok) {
        throw new Error('Failed to fetch run detail: ' + response.status);
    }
    return response.json();
};

const STATUS_FILTER_OPTIONS: { value: 'ALL' | ComplianceStatus; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
    { value: 'COMPLIANT', label: 'Compliant' },
];

const STATUS_BADGE_COLOR: Record<ComplianceStatus, 'red' | 'amber' | 'green'> = {
    OVERDUE: 'red',
    EXPIRING_SOON: 'amber',
    COMPLIANT: 'green',
};

const STATUS_LABEL: Record<ComplianceStatus, string> = {
    OVERDUE: 'Overdue',
    EXPIRING_SOON: 'Expiring Soon',
    COMPLIANT: 'Compliant',
};

export default function RunDetailPage() {
    usePageTitle('Run Detail');
    const { id } = useParams<{ id: string }>();
    const [statusFilter, setStatusFilter] = useState<'ALL' | ComplianceStatus>('ALL');

    const { data: run } = useQuery({
        queryKey: ['run', id],
        queryFn: () => fetchRun(id as string),
        enabled: !!id,
    });

    const { data: detail } = useQuery({
        queryKey: ['run-detail', id],
        queryFn: () => fetchRunDetail(id as string),
        enabled: !!id,
    });

    if (!run || !detail) {
        return (
            <Card size="4" className="w-full shadow-lg">
                <PageHeader icon={History} title="Run Detail" />
                <div className="mb-4">
                    <Progress />
                </div>
            </Card>
        );
    }

    const filteredCompliance = detail.compliance.filter(
        (record) => statusFilter === 'ALL' || record.status === statusFilter
    );

    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader
                icon={History}
                title={run.name}
                description={`Confirmed ${run.confirmedAt ? new Date(run.confirmedAt).toLocaleString() : ''} — ${run.counts.employees} employees, ${run.counts.trainingCatalogEntries} training catalog entries, ${run.counts.timeslots} timeslots, ${run.counts.completedTrainings} completed trainings`}
            />

            <Flex direction="column" gap="2" mb="4">
                <Text size="4" weight="bold">Employees Requiring Mandatory Training</Text>
                <Select.Root value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | ComplianceStatus)}>
                    <Select.Trigger />
                    <Select.Content>
                        {STATUS_FILTER_OPTIONS.map((opt) => (
                            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            </Flex>

            <Table.Root variant="surface" mb="6">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>Employee</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Department</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Position</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Training</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Expiry</Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {filteredCompliance.map((record, index) => (
                        <Table.Row key={index}>
                            <Table.Cell>{record.employeeName}</Table.Cell>
                            <Table.Cell>{record.utvar}</Table.Cell>
                            <Table.Cell>{record.pozice}</Table.Cell>
                            <Table.Cell>{record.kodSkoleni}</Table.Cell>
                            <Table.Cell><Badge color={STATUS_BADGE_COLOR[record.status]}>{STATUS_LABEL[record.status]}</Badge></Table.Cell>
                            <Table.Cell>{record.expiryDate ? new Date(record.expiryDate).toLocaleDateString() : '—'}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            <Text size="4" weight="bold" mb="2">Scheduling Opportunities</Text>
            <Table.Root variant="surface">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>Employee</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Training</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Upcoming Timeslot</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Capacity</Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {detail.schedulingOpportunities.map((opportunity, index) => (
                        <Table.Row key={index}>
                            <Table.Cell>{opportunity.employeeName}</Table.Cell>
                            <Table.Cell>{opportunity.kodSkoleni}</Table.Cell>
                            <Table.Cell><Badge color={STATUS_BADGE_COLOR[opportunity.status]}>{STATUS_LABEL[opportunity.status]}</Badge></Table.Cell>
                            <Table.Cell>{opportunity.datum ? new Date(opportunity.datum).toLocaleDateString() : '—'}</Table.Cell>
                            <Table.Cell>{opportunity.obsazeno} / {opportunity.kapacita}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Card>
    );
}
