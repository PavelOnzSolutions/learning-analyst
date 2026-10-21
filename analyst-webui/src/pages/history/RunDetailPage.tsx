import {useState} from 'react';
import {Badge, Card, Flex, Select, Table, Text, Progress} from '@radix-ui/themes';
import {ArrowLeft, CircleCheck, GraduationCap, History, Timer, User2} from 'lucide-react';
import {useNavigate, useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader';
import {usePageTitle} from '../../context/PageTitleContext';
import {fetchWithAuth} from '../../utils/api';
import type {IRunResponse} from '../../models/run.model';
import type {ComplianceStatus} from '../../models/run.model';
import type {IRunDetailResponse} from '../../models/run-detail.model';
import {useToolbar} from "../../context/ToolbarContext.tsx";
import PaginationControls from '../../components/system/PaginationControls';
import ComplianceByDepartmentChart from '../../components/charts/ComplianceByDepartmentChart';
import UpcomingExpirationsChart from '../../components/charts/UpcomingExpirationsChart';
import TimeslotCapacityChart from '../../components/charts/TimeslotCapacityChart';
import OrgHeadcountChart from '../../components/charts/OrgHeadcountChart';

const DEFAULT_PAGE_SIZE = 10;

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
    {value: 'ALL', label: 'All Statuses'},
    {value: 'OVERDUE', label: 'Overdue'},
    {value: 'EXPIRING_SOON', label: 'Expiring Soon'},
    {value: 'COMPLIANT', label: 'Compliant'},
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
    const navigate = useNavigate();
    const {id} = useParams<{ id: string }>();
    const [statusFilter, setStatusFilter] = useState<'ALL' | ComplianceStatus>('ALL');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [opportunitiesPage, setOpportunitiesPage] = useState(0);
    const [opportunitiesPageSize, setOpportunitiesPageSize] = useState(DEFAULT_PAGE_SIZE);

    useToolbar([
        {id: 'back', label: 'Back', icon: ArrowLeft, onClick: () => navigate('/history')}
    ])

    const handleStatusFilterChange = (value: 'ALL' | ComplianceStatus) => {
        setStatusFilter(value);
        setPage(0);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setPage(0);
    };

    const handleOpportunitiesPageSizeChange = (size: number) => {
        setOpportunitiesPageSize(size);
        setOpportunitiesPage(0);
    };

    const {data: run} = useQuery({
        queryKey: ['run', id],
        queryFn: () => fetchRun(id as string),
        enabled: !!id,
    });

    const {data: detail} = useQuery({
        queryKey: ['run-detail', id],
        queryFn: () => fetchRunDetail(id as string),
        enabled: !!id,
    });


    if (!run || !detail) {
        return (
            <Card size="4" className="w-full shadow-lg">
                <PageHeader icon={History} title="Run Detail"/>
                <div className="mb-4">
                    <Progress/>
                </div>
            </Card>
        );
    }

    const filteredCompliance = detail.compliance.filter(
        (record) => statusFilter === 'ALL' || record.status === statusFilter
    );
    const complianceTotalPages = Math.max(1, Math.ceil(filteredCompliance.length / pageSize));
    const pagedCompliance = filteredCompliance.slice(page * pageSize, page * pageSize + pageSize);

    const opportunitiesTotalPages = Math.max(1, Math.ceil(detail.schedulingOpportunities.length / opportunitiesPageSize));
    const pagedOpportunities = detail.schedulingOpportunities.slice(
        opportunitiesPage * opportunitiesPageSize, opportunitiesPage * opportunitiesPageSize + opportunitiesPageSize
    );

    return (
        <Card size="4" className="w-full shadow-lg">

            <PageHeader
                icon={History}
                title={run.name}
                description={`Confirmed ${run.confirmedAt ? new Date(run.confirmedAt).toLocaleString() : ''}`}
            />

            <Flex direction="row" gap="2" mb="4">
                <Badge color="tomato">
                    <Flex direction="row" gap="2">
                        <User2 size={14}/>
                        {run.counts.employees} employees
                    </Flex>
                </Badge>
                <Badge color="iris">
                    <Flex direction="row" gap="2">
                        <GraduationCap size={14}/>
                        {run.counts.trainingCatalogEntries} training catalog entries
                    </Flex>
                </Badge>
                <Badge color="teal">
                    <Flex direction="row" gap="2">
                        <Timer size={14}/>
                        {run.counts.timeslots} timeslots
                    </Flex>
                </Badge>
                <Badge color="grass">
                    <Flex direction="row" gap="2">
                        <CircleCheck size={14}/>
                        {run.counts.completedTrainings} completed trainings
                    </Flex>
                </Badge>
            </Flex>

            <Flex direction="column" gap="6" mb="6">
                <Flex direction="column" gap="2">
                    <Text size="4" weight="bold">Compliance by Department</Text>
                    <ComplianceByDepartmentChart records={detail.compliance}/>
                </Flex>
                <Flex direction="column" gap="2">
                    <Text size="4" weight="bold">Upcoming Expirations</Text>
                    <UpcomingExpirationsChart records={detail.compliance}/>
                </Flex>
                <Flex direction="column" gap="2">
                    <Text size="4" weight="bold">Timeslot Capacity Utilization</Text>
                    <TimeslotCapacityChart timeslots={detail.timeslots}/>
                </Flex>
                <Flex direction="column" gap="2">
                    <Text size="4" weight="bold">Org Structure & Headcount</Text>
                    <OrgHeadcountChart employees={detail.employees}/>
                </Flex>
            </Flex>

            <Flex direction="column" gap="2" mb="4">
                <Text size="4" weight="bold">Employees Requiring Mandatory Training</Text>
                <Select.Root value={statusFilter}
                             onValueChange={(value) => handleStatusFilterChange(value as 'ALL' | ComplianceStatus)}>
                    <Select.Trigger/>
                    <Select.Content>
                        {STATUS_FILTER_OPTIONS.map((opt) => (
                            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            </Flex>

            <Table.Root variant="surface">
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
                    {pagedCompliance.map((record, index) => (
                        <Table.Row key={index}>
                            <Table.Cell>{record.employeeName}</Table.Cell>
                            <Table.Cell>{record.utvar}</Table.Cell>
                            <Table.Cell>{record.pozice}</Table.Cell>
                            <Table.Cell>{record.kodSkoleni}</Table.Cell>
                            <Table.Cell><Badge
                                color={STATUS_BADGE_COLOR[record.status]}>{STATUS_LABEL[record.status]}</Badge></Table.Cell>
                            <Table.Cell>{record.expiryDate ? new Date(record.expiryDate).toLocaleDateString() : '—'}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            <PaginationControls
                page={page}
                totalPages={complianceTotalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
            />

            <Text size="4" weight="bold" mb="2" mt="6">Scheduling Opportunities</Text>
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
                    {pagedOpportunities.map((opportunity, index) => (
                        <Table.Row key={index}>
                            <Table.Cell>{opportunity.employeeName}</Table.Cell>
                            <Table.Cell>{opportunity.kodSkoleni}</Table.Cell>
                            <Table.Cell><Badge
                                color={STATUS_BADGE_COLOR[opportunity.status]}>{STATUS_LABEL[opportunity.status]}</Badge></Table.Cell>
                            <Table.Cell>{opportunity.datum ? new Date(opportunity.datum).toLocaleDateString() : '—'}</Table.Cell>
                            <Table.Cell>{opportunity.obsazeno} / {opportunity.kapacita}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            <PaginationControls
                page={opportunitiesPage}
                totalPages={opportunitiesTotalPages}
                pageSize={opportunitiesPageSize}
                onPageChange={setOpportunitiesPage}
                onPageSizeChange={handleOpportunitiesPageSizeChange}
            />
        </Card>
    );
}
