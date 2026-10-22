import { iwtRoleFor, iwtCtxFor, RealAuthAdapter, RealProfileAdapter } from './real-auth';
import type { AuthState } from '../../auth/useAuth';

function authState(overrides: Partial<AuthState>): AuthState {
  return {
    account: null,
    roles: [],
    isAuthenticated: false,
    tokenIssuedAt: null,
    tokenExpiration: null,
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn(),
    ...overrides,
  };
}

describe('iwtRoleFor', () => {
  test('CUSTOMER_ADMIN maps to admin', () => {
    expect(iwtRoleFor(['CUSTOMER_ADMIN'])).toBe('admin');
  });
  test('CUSTOMER_MEMBER maps to member', () => {
    expect(iwtRoleFor(['CUSTOMER_MEMBER'])).toBe('member');
  });
  test('no customer role maps to guest', () => {
    expect(iwtRoleFor(['PLATFORM_ADMIN'])).toBe('guest');
  });
  test('CUSTOMER_ADMIN takes priority over CUSTOMER_MEMBER when both are present', () => {
    expect(iwtRoleFor(['CUSTOMER_MEMBER', 'CUSTOMER_ADMIN'])).toBe('admin');
  });
});

describe('iwtCtxFor', () => {
  test('unauthenticated maps to guest with no profile', () => {
    const ctx = iwtCtxFor(authState({ isAuthenticated: false }));
    expect(ctx).toEqual({ status: 'loggedOut', role: 'guest', profile: null });
  });

  test('authenticated member maps to loggedIn with a profile', () => {
    const ctx = iwtCtxFor(authState({
      isAuthenticated: true,
      roles: ['CUSTOMER_MEMBER'],
      account: { username: 'pavel@onz.solutions', localAccountId: 'u1' } as unknown as AuthState['account'],
    }));
    expect(ctx.status).toBe('loggedIn');
    expect(ctx.role).toBe('member');
    expect(ctx.profile).toEqual({ userId: 'u1', role: 'member', displayName: 'pavel@onz.solutions' });
  });
});

describe('RealAuthAdapter', () => {
  test('logout() calls through to the real auth logout', async () => {
    const logout = vi.fn();
    const adapter = new RealAuthAdapter({ logout });
    await adapter.logout();
    expect(logout).toHaveBeenCalledOnce();
  });

  test('login() rejects — the real login orb is a command, not a credentials form', async () => {
    const adapter = new RealAuthAdapter({ logout: vi.fn() });
    await expect(adapter.login({ email: 'x', password: 'y' })).rejects.toThrow();
  });
});

describe('RealProfileAdapter', () => {
  test('profile() rejects — real profile comes from useAuth(), not store.login()', async () => {
    const adapter = new RealProfileAdapter();
    await expect(adapter.profile('u1')).rejects.toThrow();
  });
});
