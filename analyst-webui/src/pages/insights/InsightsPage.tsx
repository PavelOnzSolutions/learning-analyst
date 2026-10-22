import { useState } from 'react';
import { Badge, Card, Select, Table, Text } from '@radix-ui/themes';
import { LineChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader';
import { usePageTitle } from '../../context/PageTitleContext';
import { fetchWithAuth } from '../../utils/api';
import RunTrendCharts from '../../components/charts/RunTrendCharts';
import type { ComplianceStatus } from '../../models/run.model';
import type { IInsightsOverviewResponse, IEmployeeOption, IEmployeeHistoryResponse } from '../../models/insights.model';

const fetchOverview = async (): Promise<IInsightsOverviewResponse> => {
    const response = await fetchWithAuth('/v1/insights/overview');
    if (!response.ok) throw new Error('Failed to fetch insights overview: ' + response.status);
    return response.json();
};

const fetchEmployees = async (): Promise<IEmployeeOption[]> => {
    const response = await fetchWithAuth('/v1/insights/employees');
    if (!response.ok) throw new Error('Failed to fetch employees: ' + response.status);
    return response.json();
};

const fetchEmployeeHistory = async (idZamestnance: string): Promise<IEmployeeHistoryResponse> => {
    const response = await fetchWithAuth(`/v1/insights/employees/${idZamestnance}/history`);
    if (!response.ok) throw new Error('Failed to fetch employee history: ' + response.status);
    return response.json();
};

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

const InsightsPage = () => {
    usePageTitle('Insights');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);

    const { data: overview } = useQuery({ queryKey: ['insights', 'overview'], queryFn: fetchOverview });
    const { data: employees } = useQuery({ queryKey: ['insights', 'employees'], queryFn: fetchEmployees });
    const { data: history } = useQuery({
        queryKey: ['insights', 'employee-history', selectedEmployeeId],
        queryFn: () => fetchEmployeeHistory(selectedEmployeeId as string),
        enabled: !!selectedEmployeeId,
    });

    const runTrends = overview?.runTrends ?? [];
    const employeeOptions = employees ?? [];

    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader icon={LineChart} title="Insights" description="Compliance and capacity trends across all completed import runs" />

            {runTrends.length === 0 ? (
                <Text size="2" color="gray">No completed import runs yet. Trends will appear here once at least one import has been confirmed.</Text>
            ) : (
                <RunTrendCharts runTrends={runTrends} />
            )}

            <Text size="4" weight="bold" mb="2" mt="6">Employee Compliance History</Text>
            {employeeOptions.length === 0 ? (
                <Text size="2" color="gray">No employees to show yet.</Text>
            ) : (
                <>
                    <Select.Root value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <Select.Trigger placeholder="Select an employee"/>
                        <Select.Content>
                            {employeeOptions.map((e) => (
                                <Select.Item key={e.idZamestnance} value={e.idZamestnance}>{e.displayName}</Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>

                    {history && (
                        history.history.length === 0 ? (
                            <Text size="2" color="gray" mt="3">No compliance records found for {history.employeeName}.</Text>
                        ) : (
                            <Table.Root variant="surface" mt="3">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>Run</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Training</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Expiry</Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {history.history.map((point, index) => (
                                        <Table.Row key={index}>
                                            <Table.Cell>{point.runName}</Table.Cell>
                                            <Table.Cell>{point.confirmedAt ? new Date(point.confirmedAt).toLocaleDateString() : '—'}</Table.Cell>
                                            <Table.Cell>{point.kodSkoleni}</Table.Cell>
                                            <Table.Cell><Badge color={STATUS_BADGE_COLOR[point.status]}>{STATUS_LABEL[point.status]}</Badge></Table.Cell>
                                            <Table.Cell>{point.expiryDate ? new Date(point.expiryDate).toLocaleDateString() : '—'}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        )
                    )}
                </>
            )}
        </Card>
    );
};

export default InsightsPage;
