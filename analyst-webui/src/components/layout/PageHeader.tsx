import { Flex, Heading, Text } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  mb?: '0' | '5';
}

export default function PageHeader({ icon: Icon, title, description, mb = '5' }: Props) {
  return (
    <Flex direction="column" mb={mb}>
      <Flex direction="row" gap="2" align="center">
        <Icon size={32} className="text-(--accent-9)" />
        <Heading size="6" as="h2">
          <span className="bg-linear-to-l from-(--gray-12) to-(--accent-11) bg-clip-text text-transparent">
            {title}
          </span>
        </Heading>
      </Flex>
      {description && <Text size="2" color="gray">{description}</Text>}
    </Flex>
  );
}
