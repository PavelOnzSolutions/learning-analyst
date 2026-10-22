import {Card, Flex, Heading, Text} from "@radix-ui/themes";
import {useTranslation} from 'react-i18next';
import {useQuery} from "@tanstack/react-query";
import {fetchWithAuth} from "../../utils/api";
import config from "../../config.ts";

interface SystemInfo {
    git?: {
        build?: {
            version: string;
        };
        commit?: {
            id?: {
                abbrev: string;
            };
            user?: {
                email: string;
            };
        };
    };
}

const fetchInfo = async (): Promise<SystemInfo> => {
    const response = await fetchWithAuth('/management/info');
    if (!response.ok) throw new Error('Failed to fetch info');
    return response.json();
};

export const About = () => {
    const { t } = useTranslation();

    const { data: info, status: infoStatus } = useQuery({
        queryKey: ['system-info'],
        queryFn: fetchInfo,
    });

    const platformVersion = info?.git?.build?.version || '---';
    const commitId = info?.git?.commit?.id?.abbrev || '---';
    const commitAuthor = info?.git?.commit?.user?.email || '---';
    const backendStatus = infoStatus === 'success' ? 'UP' : (infoStatus === 'loading' ? '...' : 'DOWN');

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[var(--color-background)]">

            {/* Content Layer */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">

                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-6xl font-bold bg-clip-text pb-2">
                            Learning Analyst
                        </h1>
                        <Text size="6" className="font-light animate-faerie-text">
                            CSV Import & Analysis
                        </Text>
                    </div>

                    <Card className="p-8 backdrop-blur-xl shadow-2xl">
                        <Flex direction="column" gap="4">
                            <Text as="p" size="3" className="tleading-relaxed">
                                {'Built on WorldOfGlass template by © 2026 Pavel Onz'}
                            </Text>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="p-4 rounded-lg border">
                                    <Heading size="6" className="text-(--blue-11) mb-1">{platformVersion}</Heading>
                                    <Text size="1" className="text-(--gray-11) uppercase tracking-wider">{'Platform Version'}</Text>
                                </div>
                                <div className="p-4 rounded-lg border">
                                    <Heading size="6" className="text-(--red-11) mb-1">{commitId}</Heading>
                                    <Text size="1" className="text-(--gray-11) uppercase tracking-wider">{'Commit ID'}</Text>
                                </div>
                                <div className="p-4 rounded-lg border">
                                    <Heading size="3" className="text-(--green-11) mb-1">{commitAuthor}</Heading>
                                    <Text size="1" className="text-(--gray-11) uppercase tracking-wider">{'Commit Author'}</Text>
                                </div>
                                <div className="p-4 rounded-lg border">
                                    <Heading size="6" className={`${backendStatus === 'UP' ? 'text-(--orange-11)' : 'text-(--gray-11)'} mb-1`}>{backendStatus}</Heading>
                                    <Text size="1" className="text-(--gray-11) uppercase tracking-wider">{'Backend status'}</Text>
                                </div>
                            </div>
                        </Flex>
                    </Card>

                    <Text size="1" className="text-(--gray-11) mt-8 block">
                        {t('lbl_copyright', 'Learning Analyst v{{version}} | © {{year}} Pavel Onz. All rights reserved.', {year: new Date().getFullYear().toString(), version: config.version})}
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default About;
