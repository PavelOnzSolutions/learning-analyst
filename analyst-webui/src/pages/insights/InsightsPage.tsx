import {useState} from 'react';
import {Badge, Card, Flex, Progress, Select, Skeleton, Table, Text} from '@radix-ui/themes';
import {ChartNetwork, ClockCheck, LineChart, RefreshCcw, UserCheck, UserCheck2, Users2} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader';
import {usePageTitle} from '../../context/PageTitleContext';
import {fetchWithAuth} from '../../utils/api';
import RunTrendCharts from '../../components/charts/RunTrendCharts';
import PaginationControls from '../../components/system/PaginationControls';
import type {ComplianceStatus} from '../../models/run.model';
import type {
    IInsightsOverviewResponse,
    IEmployeeOption,
    IEmployeeHistoryResponse,
    IInsightsSchedulingSuggestionsResponse
} from '../../models/insights.model';
import {useToolbar} from "../../context/ToolbarContext.tsx";

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

const fetchSchedulingSuggestions = async (): Promise<IInsightsSchedulingSuggestionsResponse> => {
    const response = await fetchWithAuth('/v1/insights/scheduling-suggestions');
    if (!response.ok) throw new Error('Failed to fetch scheduling suggestions: ' + response.status);
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

const formatCost = (amount: number | null | undefined): string => amount == null ? '—' : `${amount.toLocaleString()} Kč`;


const InsightsPage = () => {
    usePageTitle('Insights');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
    const [suggestionsPage, setSuggestionsPage] = useState(0);
    const [suggestionsPageSize, setSuggestionsPageSize] = useState(10);

    const {
        data: overview,
        refetch: refetchOverview,
        isLoading: overviewLoading
    } = useQuery({queryKey: ['insights', 'overview'], queryFn: fetchOverview});
    const {
        data: employees,
        refetch: refetchEmployees,
        isLoading: employeesLoading
    } = useQuery({queryKey: ['insights', 'employees'], queryFn: fetchEmployees});
    const {data: history, refetch: refetchEmployeeHistory, isLoading: historyLoading} = useQuery({
        queryKey: ['insights', 'employee-history', selectedEmployeeId],
        queryFn: () => fetchEmployeeHistory(selectedEmployeeId as string),
        enabled: !!selectedEmployeeId,
    });
    const {
        data: schedulingSuggestions,
        refetch: refetchSchedulingSuggestions,
        isLoading: schedulingSuggestionsLoading
    } = useQuery({
        queryKey: ['insights', 'scheduling-suggestions'],
        queryFn: fetchSchedulingSuggestions,
    });

    const runTrends = overview?.runTrends ?? [];
    const employeeOptions = employees ?? [];
    const suggestions = schedulingSuggestions?.suggestions ?? [];
    const suggestionsTotalPages = Math.max(1, Math.ceil(suggestions.length / suggestionsPageSize));
    const pagedSuggestions = suggestions.slice(suggestionsPage * suggestionsPageSize, suggestionsPage * suggestionsPageSize + suggestionsPageSize);

    const refetchAll = () => {
        refetchOverview();
        refetchEmployees();
        refetchEmployeeHistory();
        refetchSchedulingSuggestions();
    };

    useToolbar([
        {id: 'refresh', label: 'Refresh', icon: RefreshCcw, onClick: () => refetchAll()}
    ]);

    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader icon={LineChart} title="Insights"
                        description="Compliance and capacity trends across all completed import runs"/>
            <Flex direction="column" gap="4">

                {overviewLoading && (
                    <div className="mb-4">
                        <Progress variant="classic" size="3"/>
                    </div>
                )}

                <Card size="3">
                    <Flex direction="column" gap="3" height="100%">
                        <Flex align="center" gap="2">
                            <ChartNetwork size={14} className="text-(--accent-9)"/>
                            <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                Overall Charts
                            </Text>
                        </Flex>
                        <Flex align="center" gap="2" justify="center">
                            {runTrends.length === 0 ? (
                                <Text size="2" color="gray">No completed import runs yet. Trends will appear here once
                                    at least
                                    one
                                    import has been confirmed.</Text>
                            ) : (
                                <RunTrendCharts runTrends={runTrends}/>
                            )}
                        </Flex>
                    </Flex>

                </Card>

                <Card size="3">
                    <Flex direction="column" gap="3" height="100%">
                        <Flex align="center" gap="2">
                            <UserCheck size={14} className="text-(--accent-9)"/>
                            <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                Employee Compliance History
                            </Text>
                        </Flex>
                        <Flex direction="column" justify="center">
                            {employeesLoading ? (
                                <div className="mb-4">
                                    <Progress variant="classic" size="1"/>
                                </div>
                            ) : (
                                <>
                                    <Select.Root value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                        <Select.Trigger placeholder="Select an employee"/>
                                        <Select.Content>
                                            {employeeOptions.map((e) => (
                                                <Select.Item key={e.idZamestnance}
                                                             value={e.idZamestnance}>{e.displayName}</Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Root>

                                    {history && (
                                        history.history.length === 0 ? (
                                            <Text size="2" color="gray" mt="3">No compliance records found
                                                for {history.employeeName}.</Text>
                                        ) : (
                                            <Table.Root variant="surface" mt="3">
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.ColumnHeaderCell>Run</Table.ColumnHeaderCell>
                                                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                                                        <Table.ColumnHeaderCell>Training</Table.ColumnHeaderCell>
                                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                                        <Table.ColumnHeaderCell>Expiry</Table.ColumnHeaderCell>
                                                        <Table.ColumnHeaderCell>Cost</Table.ColumnHeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {history.history.map((point, index) => (
                                                        <Table.Row key={index}>
                                                            <Table.Cell>{point.runName}</Table.Cell>
                                                            <Table.Cell>{point.confirmedAt ? new Date(point.confirmedAt).toLocaleDateString() : '—'}</Table.Cell>
                                                            <Table.Cell>{point.kodSkoleni}</Table.Cell>
                                                            <Table.Cell><Badge
                                                                color={STATUS_BADGE_COLOR[point.status]}>{STATUS_LABEL[point.status]}</Badge></Table.Cell>
                                                            <Table.Cell>{point.expiryDate ? new Date(point.expiryDate).toLocaleDateString() : '—'}</Table.Cell>
                                                            <Table.Cell>{formatCost(point.costKc)}</Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table.Root>
                                        )
                                    )}
                                </>
                            )}
                        </Flex>
                    </Flex>
                </Card>


                <Card size="3">
                    <Flex direction="column" gap="3" height="100%">
                        <Flex align="center" gap="2">
                            <ClockCheck size={14} className="text-(--accent-9)"/>
                            <Text size="1" weight="medium" color="gray" className="uppercase tracking-wide">
                                Scheduling Suggestions
                            </Text>
                        </Flex>
                        <Flex direction="column" justify="center">
                {schedulingSuggestions?.basedOnRunName && (
                    <Text size="2" color="gray" mb="2">Based on: {schedulingSuggestions.basedOnRunName}</Text>
                )}
                {suggestions.length === 0 ? (
                    <Text size="2" color="gray">No scheduling suggestions right now.</Text>
                ) : (
                    <>
                        <Table.Root variant="surface">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Employee</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Training</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Upcoming Timeslot</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Capacity</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Cost / Person</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {pagedSuggestions.map((s, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell>{s.employeeName}</Table.Cell>
                                        <Table.Cell>{s.kodSkoleni}</Table.Cell>
                                        <Table.Cell><Badge
                                            color={STATUS_BADGE_COLOR[s.status]}>{STATUS_LABEL[s.status]}</Badge></Table.Cell>
                                        <Table.Cell>{s.datum ? new Date(s.datum).toLocaleDateString() : '—'}</Table.Cell>
                                        <Table.Cell>{s.obsazeno} / {s.kapacita}</Table.Cell>
                                        <Table.Cell>{formatCost(s.costPerPerson)}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                        <PaginationControls
                            page={suggestionsPage}
                            totalPages={suggestionsTotalPages}
                            pageSize={suggestionsPageSize}
                            onPageChange={setSuggestionsPage}
                            onPageSizeChange={(size) => {
                                setSuggestionsPageSize(size);
                                setSuggestionsPage(0);
                            }}
                        />
                    </>
                )}
                        </Flex>
                    </Flex>
                </Card>
            </Flex>
        </Card>
    );
};

export default InsightsPage;
``