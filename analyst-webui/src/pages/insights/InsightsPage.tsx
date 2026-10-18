import { Card, Text } from '@radix-ui/themes';
import { LineChart } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { usePageTitle } from '../../context/PageTitleContext';

const InsightsPage = () => {
    usePageTitle('Insights');
    return (
        <Card size="4" className="w-full shadow-lg">
            <PageHeader icon={LineChart} title="Insights" description="Compliance and capacity trends across all completed import runs" />
            <Text size="2" color="gray">No completed import runs yet. Trends will appear here once at least one import has been confirmed.</Text>
        </Card>
    );
};

export default InsightsPage;
