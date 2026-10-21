import { Button, Flex, Select, Text } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

interface PaginationControlsProps {
    page: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export default function PaginationControls({
    page,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationControlsProps) {
    return (
        <Flex justify="between" align="center" mt="3">
            <Flex align="center" gap="2">
                <Text size="2" color="gray">Rows per page</Text>
                <Select.Root value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
                    <Select.Trigger />
                    <Select.Content>
                        {pageSizeOptions.map((size) => (
                            <Select.Item key={size} value={String(size)}>{size}</Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            </Flex>

            {totalPages > 1 && (
                <Flex align="center" gap="3">
                    <Button variant="soft" color="gray" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Text size="2" color="gray">Page {page + 1} of {totalPages}</Text>
                    <Button variant="soft" color="gray" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                </Flex>
            )}
        </Flex>
    );
}
