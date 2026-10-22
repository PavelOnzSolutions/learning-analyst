export type Role = 'guest' | 'member' | 'admin';
export type OrbHue = 'teal' | 'violet' | 'amber' | 'rose' | 'gray';
export type FormId = 'login' | 'profile' | 'create';
export type PageId = 'dashboard' | 'table' | 'instances' | 'subscription';
export type AuthStatus = 'loggedOut' | 'loggingIn' | 'loggedIn' | 'loginError';

export interface User { id: string; email: string; displayName: string; }
export interface Profile { userId: string; role: Role; displayName: string; prefs?: Record<string, unknown>; }
export interface Credentials { email: string; password: string; }
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface AuthCtx { status: AuthStatus; role: Role; profile: Profile | null; }
export interface CommandCtx { logout(): void; navigate(to: string): void; login?(): void; }

export type OrbAction =
  | { kind: 'expand' }
  | { kind: 'morph-form'; form: FormId }
  | { kind: 'morph-page'; page: PageId }
  | { kind: 'navigate'; to: string }
  | { kind: 'command'; run: (ctx: CommandCtx) => void };

export interface OrbNode {
  id: string;
  label: string;                              // completes "I want to …"
  color: OrbHue;
  children?: OrbNode[];                        // presence ⇒ expandable (trail-extending)
  action?: OrbAction;                          // defaults to { kind: 'expand' } when children exist
  visibleWhen?: (ctx: AuthCtx) => boolean;     // role/profile gating
}
