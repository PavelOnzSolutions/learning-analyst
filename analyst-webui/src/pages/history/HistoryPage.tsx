import { Card, Text } from '@radix-ui/themes';
import { History } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { usePageTitle } from '../../context/PageTitleContext';

const HistoryPage = () => {
    usePageTitle('History');
    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader icon={History} title="History" description="All import runs and their analysis results" />
            <Text size="2" color="gray">No import runs yet. Use New Import from the sidebar to get started.</Text>
        </Card>
    );
};

export default HistoryPage;
