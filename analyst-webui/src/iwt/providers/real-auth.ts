import type { AuthState, Role as WebuiRole } from '../../auth/useAuth';
import type { AuthCtx, Credentials, Profile, Result, Role as IwtRole, User } from '../model/types';
import type { AuthProvider } from './auth';
import type { ProfileProvider } from './profile';

/** CUSTOMER_ADMIN outranks CUSTOMER_MEMBER; no customer role at all is a guest here. */
export function iwtRoleFor(roles: WebuiRole[]): IwtRole {
  if (roles.includes('CUSTOMER_ADMIN')) return 'admin';
  if (roles.includes('CUSTOMER_MEMBER')) return 'member';
  return 'guest';
}

/**
 * Maps the app's real MSAL-backed auth into IWT's AuthCtx shape. Real login is
 * a full-page redirect, not a credentials round-trip, so there is no
 * loggingIn/loginError transition to model here — the caller is either
 * already authenticated or not.
 */
export function iwtCtxFor(auth: AuthState): AuthCtx {
  if (!auth.isAuthenticated) {
    return { status: 'loggedOut', role: 'guest', profile: null };
  }
  const role = iwtRoleFor(auth.roles);
  const profile: Profile = {
    userId: auth.account?.localAccountId ?? '',
    role,
    displayName: auth.account?.username ?? '',
  };
  return { status: 'loggedIn', role, profile };
}

/**
 * Satisfies Store's AuthProvider seam for the real path without implementing
 * credential login — the login form's local submit goes through mountIWT's
 * deps.loginLocal (a direct call to auth/localAuth), and its Microsoft
 * button calls auth.login() (see mountIWT's deps.login), so
 * store.login(creds) is never called in real mode. logout() is used, via
 * the sign-out command running store.logout().
 */
export class RealAuthAdapter implements AuthProvider {
  constructor(private auth: Pick<AuthState, 'logout'>) {}

  async login(_creds: Credentials): Promise<Result<User>> {
    throw new Error('RealAuthAdapter does not support credential login; the login orb runs a command instead.');
  }

  async logout(): Promise<void> {
    this.auth.logout();
  }
}

/** Real profile data comes from useAuth()/useMe(), never from store.login() — see RealAuthAdapter. */
export class RealProfileAdapter implements ProfileProvider {
  async profile(_userId: string): Promise<Profile> {
    throw new Error('RealProfileAdapter does not support profile lookup; profile comes from useAuth().');
  }
}
