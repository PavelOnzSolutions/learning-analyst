import { Signal } from './signals';
import { ORB_TREE } from '../model/orb-tree';
import { prune } from './derive-visible';
import { authReducer, pushEntry, popEntry, jumpTo, type PathEntry } from './reducers';
import type { AuthProvider } from '../providers/auth';
import type { ProfileProvider } from '../providers/profile';
import type {
  AuthCtx, AuthStatus, Credentials, OrbNode, Profile, Result, Role, User,
} from '../model/types';

export interface StoreDeps { auth: AuthProvider; profileProvider: ProfileProvider; tree?: OrbNode[]; }

export class Store {
  readonly status = new Signal<AuthStatus>('loggedOut');
  readonly role = new Signal<Role>('guest');
  readonly profile = new Signal<Profile | null>(null);
  readonly error = new Signal<string | null>(null);
  readonly path = new Signal<PathEntry[]>([]);
  readonly expanded = new Signal<boolean>(false);
  readonly morphKey = new Signal<string | null>(null);
  readonly morphKind = new Signal<'form' | 'page' | null>(null);
  readonly focusedKey = new Signal<string | null>(null);
  readonly hoverOrigin = new Signal<boolean>(false);
  readonly tree: Signal<OrbNode[]>;

  // plain time accumulators (mutated by the rAF loop, not observable)
  rootSpin = 0;
  driftT = 0;
  t = 0;

  constructor(private deps: StoreDeps) {
    this.tree = new Signal<OrbNode[]>(deps.tree ?? ORB_TREE);
  }

  ctx(): AuthCtx {
    return { status: this.status.get(), role: this.role.get(), profile: this.profile.get() };
  }

  visibleRoot(): OrbNode[] {
    return prune(this.tree.get(), this.ctx());
  }

  async login(creds: Credentials): Promise<Result<User>> {
    this.error.set(null);
    this.status.update((s) => authReducer(s, { type: 'submit' }));
    const res = await this.deps.auth.login(creds);
    if (res.ok) {
      const prof = await this.deps.profileProvider.profile(res.value.id);
      this.profile.set(prof);
      this.role.set(prof.role);
      this.status.update((s) => authReducer(s, { type: 'success' }));
    } else {
      this.error.set(res.error);
      this.status.update((s) => authReducer(s, { type: 'fail' }));
    }
    return res;
  }

  async logout(): Promise<void> {
    await this.deps.auth.logout();
    this.profile.set(null);
    this.role.set('guest');
    this.status.update((s) => authReducer(s, { type: 'signOut' }));
    this.path.set([]);
    this.expanded.set(false);
    this.morphKey.set(null);
    this.morphKind.set(null);
    this.focusedKey.set(null);
  }

  drill(node: OrbNode, angle: number): void { this.path.update((p) => pushEntry(p, node, angle)); }

  back(): void {
    const p = this.path.get();
    if (p.length) this.path.set(popEntry(p));
    else this.expanded.set(false);
  }

  jump(depth: number): void { this.path.update((p) => jumpTo(p, depth)); }
}
