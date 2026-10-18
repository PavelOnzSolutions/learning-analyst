import { StrictMode, useEffect, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App'
// @ts-ignore
import './index.css'
// @ts-ignore
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToolbarProvider } from './context/ToolbarContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { PageTitleProvider } from './context/PageTitleContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "./i18n";

let toastFn: ((message: string, type?: 'error' | 'success' | 'info') => void) | null = null;

export const setToastFunction = (fn: (message: string, type?: 'error' | 'success' | 'info') => void) => {
    toastFn = fn;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            onError: (error: any) => {
                const message = error?.message?.toString() || 'An error occurred while fetching data';
                const status = error?.response?.status || error?.status;

                if (status === 401) {
                    window.location.href = '/login';
                } else if (status === 403) {
                    window.location.href = '/403';
                }

                toastFn?.(message, 'error');
            },
        },
        mutations: {
            onError: (error: any) => {
                const message = error?.message || 'An error occurred';
                const status = error?.response?.status || error?.status;

                if (status === 403) {
                    window.location.href = '/403';
                }

                if (status !== 401) {
                    toastFn?.(message, 'error');
                }
            },
        },
    },
});

const AppLoader = () => (
    <div className='loader-container'>
        <div className='loader'></div>
    </div>
);

const AppWithTheme = () => {
    const { appearance, accentColor } = useTheme();
    const resolvedAppearance = appearance === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : appearance;
    
    return (
        <Theme appearance={resolvedAppearance as 'light' | 'dark'} accentColor={accentColor as any} radius="large" scaling="100%">
            <App />
        </Theme>
    );
};

const AppWithToast = () => {
    const { showToast } = useToast();
    useEffect(() => {
        setToastFunction(showToast);
    }, [showToast]);
    return (
        <Suspense fallback={<AppLoader />}>
            <AppWithTheme />
        </Suspense>
    );
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <ThemeProvider>
                        <ToolbarProvider>
                            <PageTitleProvider>
                                <AppWithToast />
                            </PageTitleProvider>
                        </ToolbarProvider>
                    </ThemeProvider>
                </ToastProvider>
            </QueryClientProvider>
        </Provider>
    </StrictMode>,
)


