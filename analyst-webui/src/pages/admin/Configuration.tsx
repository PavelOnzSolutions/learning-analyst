import { Button, Card, Flex, Select, Tabs, Text } from '@radix-ui/themes';
import { SlidersHorizontal } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { usePageTitle } from '../../context/PageTitleContext';
import { useToast } from '../../context/ToastContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../utils/api';
import {
    FILE_ROLE_LABELS,
    FILE_ROLE_ORDER,
    type DelimiterSetting,
    type FileRole,
    type ImportSettingsMap,
} from '../../models/import-settings.model';

const DELIMITER_OPTIONS: { value: DelimiterSetting; label: string }[] = [
    { value: 'AUTO', label: 'Auto (detect)' },
    { value: 'COMMA', label: 'Comma (,)' },
    { value: 'SEMICOLON', label: 'Semicolon (;)' },
    { value: 'TAB', label: 'Tab' },
    { value: 'PIPE', label: 'Pipe (|)' },
];

const fetchImportSettings = async (): Promise<ImportSettingsMap> => {
    const response = await fetchWithAuth('/v1/admin/import-settings');
    if (!response.ok) {
        throw new Error('Failed to fetch import settings: ' + response.status);
    }
    return response.json();
};

const saveImportSettings = async (settings: ImportSettingsMap): Promise<ImportSettingsMap> => {
    const response = await fetchWithAuth('/v1/admin/import-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        throw new Error('Failed to save import settings: ' + response.status);
    }
    return response.json();
};

const Configuration = () => {
    usePageTitle('Configuration');
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState<ImportSettingsMap>({});

    const { data, isLoading } = useQuery({
        queryKey: ['import-settings'],
        queryFn: fetchImportSettings,
    });

    useEffect(() => {
        if (data) {
            setLocalSettings(data);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: saveImportSettings,
        onSuccess: (saved) => {
            setLocalSettings(saved);
            queryClient.invalidateQueries({ queryKey: ['import-settings'] });
            showToast('Import settings saved', 'success');
        },
        onError: () => {
            showToast('Failed to save import settings', 'error');
        },
    });

    const handleDelimiterChange = (role: FileRole, value: DelimiterSetting) => {
        setLocalSettings((prev) => ({ ...prev, [role]: value }));
    };

    const handleSave = () => {
        const payload: ImportSettingsMap = {};
        FILE_ROLE_ORDER.forEach((role) => {
            payload[role] = localSettings[role] || 'AUTO';
        });
        saveMutation.mutate(payload);
    };

    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader
                icon={SlidersHorizontal}
                title="Configuration"
                description="Per-file CSV delimiter settings for the import pipeline"
            />

            <Tabs.Root defaultValue="import-settings">
                <Tabs.List>
                    <Tabs.Trigger value="import-settings">Import Settings</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="import-settings">
                    <Flex direction="column" gap="4" mt="4">
                        {FILE_ROLE_ORDER.map((role) => (
                            <label key={role}>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    {FILE_ROLE_LABELS[role]}
                                </Text>
                                <Select.Root
                                    value={localSettings[role] || 'AUTO'}
                                    onValueChange={(value) => handleDelimiterChange(role, value as DelimiterSetting)}
                                    disabled={isLoading}
                                >
                                    <Select.Trigger />
                                    <Select.Content>
                                        {DELIMITER_OPTIONS.map((opt) => (
                                            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Root>
                            </label>
                        ))}

                        <Flex justify="end" mt="2">
                            <Button variant="solid" onClick={handleSave} disabled={isLoading || saveMutation.isPending}>
                                {saveMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </Flex>
                    </Flex>
                </Tabs.Content>
            </Tabs.Root>
        </Card>
    );
};

export default Configuration;
