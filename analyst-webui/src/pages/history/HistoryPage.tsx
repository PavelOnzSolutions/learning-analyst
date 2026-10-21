import { Card, Table, Text } from '@radix-ui/themes';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/layout/PageHeader';
import { usePageTitle } from '../../context/PageTitleContext';
import { fetchWithAuth } from '../../utils/api';
import type { IRunResponse } from '../../models/run.model';

interface RunPage {
    content: IRunResponse[];
    totalElements: number;
}

const fetchCompletedRuns = async (): Promise<RunPage> => {
    const response = await fetchWithAuth('/v1/runs?status=COMPLETED');
    if (!response.ok) {
        throw new Error('Failed to fetch completed runs: ' + response.status);
    }
    return response.json();
};

const HistoryPage = () => {
    usePageTitle('History');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ['runs', 'COMPLETED'],
        queryFn: fetchCompletedRuns,
    });

    const runs = data?.content ?? [];

    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader icon={History} title="History" description="All completed import runs and their analysis results" />

            {runs.length === 0 ? (
                <Text size="2" color="gray">No completed import runs yet. Use New Import from the sidebar to get started.</Text>
            ) : (
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Employees</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Training Catalog</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Timeslots</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Completed Trainings</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Warnings</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {runs.map((run) => (
                            <Table.Row
                                key={run.id}
                                className="cursor-pointer hover:bg-(--accent-2)"
                                onClick={() => navigate(`/history/${run.id}`)}
                            >
                                <Table.Cell>{run.name}</Table.Cell>
                                <Table.Cell>{new Date(run.createdAt).toLocaleDateString()}</Table.Cell>
                                <Table.Cell>{run.counts.employees}</Table.Cell>
                                <Table.Cell>{run.counts.trainingCatalogEntries}</Table.Cell>
                                <Table.Cell>{run.counts.timeslots}</Table.Cell>
                                <Table.Cell>{run.counts.completedTrainings}</Table.Cell>
                                <Table.Cell>{run.counts.warningCount}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}
        </Card>
    );
};

export default HistoryPage;
