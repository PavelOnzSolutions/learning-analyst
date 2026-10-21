import { useState } from 'react';
import { Badge, Button, Dialog, Flex, Table, Text } from '@radix-ui/themes';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { fetchWithAuth } from '../../utils/api';
import type { IRunResponse } from '../../models/run.model';
import { FILE_ROLE_LABELS } from '../../models/import-settings.model';

interface ImportResultModalProps {
    run: IRunResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmed: (run: IRunResponse) => void;
    onRejected: (runId: string) => void;
}

const confirmRun = async (id: string): Promise<IRunResponse> => {
    const response = await fetchWithAuth(`/v1/runs/${id}/confirm`, { method: 'POST' });
    if (!response.ok) {
        throw new Error('Failed to confirm import run: ' + response.status);
    }
    return response.json();
};

const rejectRun = async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/v1/runs/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Failed to reject import run: ' + response.status);
    }
};

export default function ImportResultModal({ run, open, onOpenChange, onConfirmed, onRejected }: ImportResultModalProps) {
    const { showToast } = useToast();
    const [confirmWarningOpen, setConfirmWarningOpen] = useState(false);

    const confirmMutation = useMutation({
        mutationFn: confirmRun,
        onSuccess: (confirmed) => {
            setConfirmWarningOpen(false);
            onOpenChange(false);
            onConfirmed(confirmed);
        },
        onError: () => {
            showToast('Failed to confirm import run', 'error');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: rejectRun,
        onSuccess: () => {
            if (run) {
                onOpenChange(false);
                onRejected(run.id);
            }
        },
        onError: () => {
            showToast('Failed to reject import run', 'error');
        },
    });

    if (!run) {
        return null;
    }

    const hasErrors = run.counts.errorCount > 0;

    const handleConfirmClick = () => {
        if (hasErrors) {
            setConfirmWarningOpen(true);
        } else {
            confirmMutation.mutate(run.id);
        }
    };

    const handleConfirmAnyway = () => {
        confirmMutation.mutate(run.id);
    };

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Content style={{ maxWidth: 700 }}>
                    <Dialog.Title>{run.name}</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        Parsed {run.counts.employees} employees, {run.counts.trainingCatalogEntries} training catalog entries,{' '}
                        {run.counts.timeslots} timeslots, {run.counts.completedTrainings} completed trainings.
                    </Dialog.Description>

                    <Flex gap="3" mb="4" wrap="wrap">
                        <Badge color={hasErrors ? 'red' : 'gray'}>{run.counts.errorCount} Errors</Badge>
                        <Badge color={run.counts.warningCount > 0 ? 'amber' : 'gray'}>{run.counts.warningCount} Warnings</Badge>
                        <Badge color="green">{run.counts.compliantCount} Compliant</Badge>
                        <Badge color="amber">{run.counts.expiringSoonCount} Expiring Soon</Badge>
                        <Badge color="red">{run.counts.overdueCount} Overdue</Badge>
                    </Flex>

                    {run.findings.length > 0 ? (
                        <Table.Root variant="surface">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Severity</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>File</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Row</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Field</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Message</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {run.findings.map((finding, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell>
                                            <Badge color={finding.severity === 'ERROR' ? 'red' : 'amber'}>{finding.severity}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>{FILE_ROLE_LABELS[finding.file]}</Table.Cell>
                                        <Table.Cell>{finding.row === 0 ? 'File-level' : finding.row}</Table.Cell>
                                        <Table.Cell>{finding.field || '-'}</Table.Cell>
                                        <Table.Cell>{finding.message}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    ) : (
                        <Text size="2" color="gray">No findings — the data parsed cleanly.</Text>
                    )}

                    <Flex gap="3" mt="4" justify="end">
                        <Button
                            variant="solid"
                            color="red"
                            onClick={() => rejectMutation.mutate(run.id)}
                            disabled={rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                        </Button>
                        <Button
                            variant="solid"
                            color="green"
                            onClick={handleConfirmClick}
                            disabled={confirmMutation.isPending}
                        >
                            {confirmMutation.isPending ? 'Confirming...' : 'Confirm'}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={confirmWarningOpen} onOpenChange={setConfirmWarningOpen}>
                <Dialog.Content style={{ maxWidth: 450 }}>
                    <Dialog.Title>Confirm with unresolved errors?</Dialog.Title>
                    <Dialog.Description size="2" mb="4">
                        This run has {run.counts.errorCount} error{run.counts.errorCount !== 1 ? 's' : ''}. Confirming will
                        import the data as-is, errors included. Are you sure?
                    </Dialog.Description>
                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">Cancel</Button>
                        </Dialog.Close>
                        <Button variant="solid" color="red" onClick={handleConfirmAnyway} disabled={confirmMutation.isPending}>
                            {confirmMutation.isPending ? 'Confirming...' : 'Confirm Anyway'}
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
}
