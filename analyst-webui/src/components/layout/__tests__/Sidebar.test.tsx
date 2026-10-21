import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../../context/ToastContext';
import Sidebar from '../Sidebar';

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ logout: vi.fn(), user: { username: 'jane' } }),
}));

function renderSidebar() {
    const queryClient = new QueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <Theme>
                    <MemoryRouter>
                        <Sidebar isOpen={true} closeSidebar={() => {}} />
                    </MemoryRouter>
                </Theme>
            </ToastProvider>
        </QueryClientProvider>
    );
}

describe('Sidebar', () => {
    it('shows exactly the four fixed top-level items and no demon-era sections', () => {
        renderSidebar();

        expect(screen.getByText('New Import')).toBeInTheDocument();
        expect(screen.getByText('Insights')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('Administration')).toBeInTheDocument();

        expect(screen.queryByText('Auto SRE')).not.toBeInTheDocument();
        expect(screen.queryByText('Operations')).not.toBeInTheDocument();
        expect(screen.queryByText('Knowledge Base')).not.toBeInTheDocument();
        expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
    });

    it('expanding Administration reveals Users, API Tokens, API Docs, and Configuration only', () => {
        renderSidebar();

        fireEvent.click(screen.getByText('Administration'));

        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('API Tokens')).toBeInTheDocument();
        expect(screen.getByText('API Docs')).toBeInTheDocument();
        expect(screen.getByText('Configuration')).toBeInTheDocument();
        expect(screen.queryByText('Roles')).not.toBeInTheDocument();
        expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
    });

    it('clicking New Import opens a dialog without navigating', () => {
        renderSidebar();

        fireEvent.click(screen.getByText('New Import'));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
