import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import App from '../App';

vi.mock('../context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({ isAuthenticated: true, isLoading: false, isAdmin: true, user: { username: 'jane' }, logout: vi.fn(), tokenExpiration: null, tokenIssuedAt: null }),
}));

// MainLayout renders Navbar + AnimatedBackground, which normally read Theme/Toolbar/PageTitle
// context supplied by providers that live in main.tsx (outside App). Since this test renders
// <App /> on its own, those hooks are mocked here the same way existing component tests
// (e.g. Navbar.test.tsx) mock them, so the real route tree can render without crashing.
vi.mock('../context/ThemeContext', () => ({
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
vi.mock('../context/ToolbarContext', () => ({ useToolbarState: () => ({ actions: [] }) }));
vi.mock('../context/PageTitleContext', () => ({
    usePageTitleState: () => 'Insights',
    usePageTitle: vi.fn(),
}));
vi.mock('react-avatar', () => ({
    default: ({ name }: { name: string }) => <div>{name}</div>,
}));

describe('App', () => {
    it('renders the Insights page at the root route without crashing', async () => {
        window.history.pushState({}, '', '/');
        render(
            <Theme>
                <App />
            </Theme>
        );

        await waitFor(() => expect(screen.getAllByText(/Insights/i).length).toBeGreaterThan(0));
    });
});
