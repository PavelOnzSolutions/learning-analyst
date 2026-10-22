import { render, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IwtRoute } from './IwtRoute';
import * as useAuthModule from '../../auth/useAuth';
import type { AuthState } from '../../auth/useAuth';

function mockAuth(overrides: Partial<AuthState> = {}) {
  const state: AuthState = {
    account: null,
    roles: [],
    isAuthenticated: false,
    tokenIssuedAt: null,
    tokenExpiration: null,
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn().mockResolvedValue('test-token'),
    ...overrides,
  };
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue(state);
  return state;
}

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/iwt/app" element={<IwtRoute />} />
          <Route path="/iwt/app/:section" element={<IwtRoute />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('IwtRoute', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('mounts the IWT stage for a guest without fetching the menu endpoint', async () => {
    mockAuth({ isAuthenticated: false });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { container } = renderAt('/iwt/app');

    await waitFor(() => expect(container.querySelector('.iwt-stage')).not.toBeNull());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches the real menu for an authenticated member', async () => {
    mockAuth({ isAuthenticated: true, roles: ['CUSTOMER_MEMBER'], account: { username: 'p@x.test', localAccountId: 'u1' } as unknown as AuthState['account'] });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify([
        { id: 'dashboard', label: 'see my dashboard', color: 'teal', children: null, action: { kind: 'morph-page', page: 'dashboard' } },
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    ));

    renderAt('/iwt/app');

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/iwt/menu'), expect.anything()));
  });

  it('unmounts the IWT stage on cleanup without throwing', async () => {
    mockAuth({ isAuthenticated: false });
    vi.stubGlobal('fetch', vi.fn());
    const { container, unmount } = renderAt('/iwt/app');
    await waitFor(() => expect(container.querySelector('.iwt-stage')).not.toBeNull());
    expect(() => unmount()).not.toThrow();
  });
});
