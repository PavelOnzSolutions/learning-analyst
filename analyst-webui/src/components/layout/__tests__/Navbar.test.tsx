import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';
import { Theme } from '@radix-ui/themes';

vi.mock('react-avatar', () => ({
    default: ({ name }: { name: string }) => <div>{name}</div>
}));

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: () => ({
        appearance: 'dark',
        toggleTheme: vi.fn(),
        accentColor: 'indigo',
        setAccentColor: vi.fn(),
        backgroundType: 'orbs',
        setBackgroundType: vi.fn(),
        useAccentColorForBackground: false,
        setUseAccentColorForBackground: vi.fn(),
    }),
    accentColors: ['indigo', 'red'],
}));
vi.mock('../../../context/ToolbarContext', () => ({ useToolbarState: () => ({ actions: [] }) }));
vi.mock('../../../context/PageTitleContext', () => ({ usePageTitleState: () => 'Test Page' }));
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ user: { username: 'jane', role: 'USER' }, logout: vi.fn(), tokenExpiration: null, tokenIssuedAt: null }),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

describe('Navbar', () => {
    it('has no notifications bell and no language switcher', () => {
        render(
            <Theme>
                <Navbar toggleSidebar={() => {}} />
            </Theme>
        );

        expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Change language')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Application Background')).toBeInTheDocument();
    });
});
