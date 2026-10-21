import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { fetchWithAuth } from '../../utils/api';
import type { IRunResponse } from '../../models/run.model';
import FileDropZone from '../system/FileDropZone';

interface NewImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (run: IRunResponse) => void;
}

interface CreateRunPayload {
    name: string;
    completedTrainings: File;
    trainingCatalog: File;
    timeslots: File;
    employees: File;
}

const createRun = async (payload: CreateRunPayload): Promise<IRunResponse> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('employees', payload.employees);
    formData.append('trainingCatalog', payload.trainingCatalog);
    formData.append('timeslots', payload.timeslots);
    formData.append('completedTrainings', payload.completedTrainings);

    const response = await fetchWithAuth('/v1/runs', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Failed to create import run: ' + response.status);
    }
    return response.json();
};

export default function NewImportModal({ open, onOpenChange, onCreated }: NewImportModalProps) {
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [completedTrainings, setCompletedTrainings] = useState<File | null>(null);
    const [trainingCatalog, setTrainingCatalog] = useState<File | null>(null);
    const [timeslots, setTimeslots] = useState<File | null>(null);
    const [employees, setEmployees] = useState<File | null>(null);

    const mutation = useMutation({
        mutationFn: createRun,
        onSuccess: (run) => {
            setName('');
            setCompletedTrainings(null);
            setTrainingCatalog(null);
            setTimeslots(null);
            setEmployees(null);
            onOpenChange(false);
            onCreated(run);
        },
        onError: () => {
            showToast('Failed to create import run', 'error');
        },
    });

    const canSubmit = !!name && !!completedTrainings && !!trainingCatalog && !!timeslots && !!employees;

    const handleSubmit = () => {
        if (!completedTrainings || !trainingCatalog || !timeslots || !employees) {
            return;
        }
        mutation.mutate({ name, completedTrainings, trainingCatalog, timeslots, employees });
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content style={{ maxWidth: 650 }}>
                <Dialog.Title>New Import</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Upload the 4 CSV exports to analyze and stage a new import run.
                </Dialog.Description>

                <Flex direction="column" gap="3">
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">Run Name</Text>
                        <TextField.Root
                            placeholder="e.g., October 2026 import"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <FileDropZone label="Completed Trainings" file={completedTrainings} onFileSelected={setCompletedTrainings} />
                        <FileDropZone label="Training Catalog" file={trainingCatalog} onFileSelected={setTrainingCatalog} />
                        <FileDropZone label="Training Timeslots" file={timeslots} onFileSelected={setTimeslots} />
                        <FileDropZone label="Employees" file={employees} onFileSelected={setEmployees} />
                    </div>
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button variant="soft" color="gray">Cancel</Button>
                    </Dialog.Close>
                    <Button variant="solid" onClick={handleSubmit} disabled={!canSubmit || mutation.isPending}>
                        {mutation.isPending ? 'Uploading...' : 'Analyze'}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
