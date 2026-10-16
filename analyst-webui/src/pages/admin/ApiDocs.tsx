import {Box, Card, Flex, Tabs} from '@radix-ui/themes';
import {FileBracesCorner, Globe, RefreshCw} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import {useToolbar} from '../../context/ToolbarContext';
import {usePageTitle} from '../../context/PageTitleContext';
import {useState} from 'react';
import config from '../../config';
import {TokenStore} from '../../utils/TokenStore';
import {useTranslation} from 'react-i18next';

const ApiDocs = () => {
  const {t} = useTranslation();
  const [iframeKey, setIframeKey] = useState(0);
  const [activeTab, setActiveTab] = useState('rest');
  const token = TokenStore.getToken();

  usePageTitle(t('ptitle_api_docs', 'API Documentation'));

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  useToolbar([
    {id: 'refresh', label: t('btn_refresh', 'Refresh'), icon: RefreshCw, onClick: handleRefresh, variant: 'soft'},
  ]);

  const restUrl = `${config.baseUrl}/swagger-ui.html${token ? `?token=${token}` : ''}`;

  return (
    <Flex direction="column" height="85vh">
      <Card size="4" className="w-full h-full shadow-lg">
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center" flexShrink="0">
            <PageHeader
              icon={FileBracesCorner}
              title={t('lbl_api_documentation', 'API Documentation')}
              description={t('lbl_api_documentation_desc', 'Interactive API documentation and explorer')}
              mb="0"
            />

            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List size="2">
                <Tabs.Trigger value="rest">
                  <Flex gap="1" align="center">
                    <Globe size={14}/>
                    REST API (Swagger)
                  </Flex>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Flex>

          <Box style={{height: 'calc(100vh - 300px)', overflow: 'hidden', position: 'relative'}}>
            <Tabs.Root value={activeTab} className="h-full">
              <Tabs.Content value="rest" className="h-full">
                <iframe
                  key={`rest-${iframeKey}`}
                  src={restUrl}
                  className="w-full h-full border-0 rounded"
                  title="REST API Documentation"
                />
              </Tabs.Content>
            </Tabs.Root>
          </Box>
        </Flex>
      </Card>
    </Flex>
  );
};

export default ApiDocs;
