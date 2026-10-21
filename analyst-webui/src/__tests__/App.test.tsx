import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../context/ToastContext';
import App from '../App';

vi.mock('../context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({ isAuthenticated: true, isLoading: false, isAdmin: true, user: { username: 'jane' }, logout: vi.fn(), tokenExpiration: null, tokenIssuedAt: null }),
}));

// MainLayout renders Navbar + AnimatedBackground + Sidebar, which normally read Theme/Toolbar/PageTitle/Toast/
// QueryClient context supplied by providers that live in main.tsx (outside App). Since this test renders
// <App /> on its own, those hooks are mocked or wrapped here the same way existing component tests
// (e.g. Navbar.test.tsx) mock them, so the real route tree can render without crashing. Sidebar now reads
// useToast() and mounts NewImportModal/ImportResultModal (which call useMutation()), so this test needs a
// real ToastProvider and QueryClientProvider, not just the Theme/Theme-context mocks it had before.
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
        const queryClient = new QueryClient();
        render(
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <Theme>
                        <App />
                    </Theme>
                </ToastProvider>
            </QueryClientProvider>
        );

        await waitFor(() => expect(screen.getByText(/Compliance and capacity trends across all completed import runs/i)).toBeInTheDocument());
    });
});
