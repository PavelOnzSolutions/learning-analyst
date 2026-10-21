import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import PaginationControls from '../PaginationControls';

function renderControls(props: Partial<React.ComponentProps<typeof PaginationControls>> = {}) {
    const defaultProps: React.ComponentProps<typeof PaginationControls> = {
        page: 0,
        totalPages: 3,
        pageSize: 10,
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
    };
    const merged = { ...defaultProps, ...props };
    render(
        <Theme>
            <PaginationControls {...merged} />
        </Theme>
    );
    return merged;
}

describe('PaginationControls', () => {
    it('disables Previous on the first page and calls onPageChange with the next page on Next click', () => {
        const { onPageChange } = renderControls({ page: 0, totalPages: 3 });

        expect(screen.getByText('Previous').closest('button')).toBeDisabled();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Next'));

        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('disables Next on the last page', () => {
        renderControls({ page: 2, totalPages: 3 });

        expect(screen.getByText('Next').closest('button')).toBeDisabled();
        expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    });

    it('does not render Previous/Next when there is only one page, but still shows the page-size selector', () => {
        renderControls({ page: 0, totalPages: 1 });

        expect(screen.queryByText('Previous')).not.toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
        expect(screen.getByText('Rows per page')).toBeInTheDocument();
    });

    it('calls onPageSizeChange with the selected size', () => {
        const { onPageSizeChange } = renderControls({ pageSize: 10 });

        fireEvent.click(screen.getByText('10'));
        fireEvent.click(screen.getByText('20'));

        expect(onPageSizeChange).toHaveBeenCalledWith(20);
    });
});
