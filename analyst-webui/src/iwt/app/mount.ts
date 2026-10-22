import '../styles/iwt.css';
import { Store } from '../state/store';
import type { AuthProvider } from '../providers/auth';
import type { ProfileProvider } from '../providers/profile';
import { LivingBlobsSkin } from '../render/living-blobs/skin';
import { buildForm, type FormHandle } from '../render/overlay/form';
import { buildPage, type PageHandle } from '../render/overlay/page';
import { renderMenu } from '../render/a11y-menu';
import { IWTApp } from './app';
import { VIEW } from '../layout/constants';
import { attachKeyboard } from '../interaction/keyboard';
import type { CommandCtx, Credentials, OrbNode, Result } from '../model/types';

export const VERSION = '0.1.0';

export interface MountDeps {
  auth: AuthProvider;
  profileProvider: ProfileProvider;
  initialTree?: OrbNode[];
  navigate?: (to: string) => void;
  /** Runs the Microsoft redirect for the login form's "Sign in with Microsoft" button. */
  login?: () => void;
  /** Local email/password submit for the login form. Falls back to store.login(creds) when absent (demo mode). */
  loginLocal?: (creds: Credentials) => Promise<Result<void>>;
}

export interface MountHandle {
  app: IWTApp;
  store: Store;
  page: PageHandle;
  form: FormHandle;
  stop(): void;
}

export function mountIWT(root: HTMLElement, deps: MountDeps): MountHandle {
  const store = new Store({ auth: deps.auth, profileProvider: deps.profileProvider, tree: deps.initialTree });

  const commandCtx: CommandCtx = {
    logout: () => void store.logout(),
    navigate: deps.navigate ?? (() => {}),
    login: deps.login,
  };

  // Liquid skin
  const skinHost = document.createElement('div');
  skinHost.className = 'iwt-stagewrap';
  root.appendChild(skinHost);
  const lite = typeof window !== 'undefined'
    && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        || (navigator.hardwareConcurrency ?? 8) <= 2);
  const skin = new LivingBlobsSkin(VERSION, { lite });
  skin.mount(skinHost);
  const stage = skinHost.querySelector<HTMLElement>('.iwt-stage')!;
  const overlay = stage.querySelector<HTMLElement>('.iwt-overlay')!;

  const scaleOf = () => stage.getBoundingClientRect().width / VIEW;

  // Morph form lives in the overlay; submit drives the auth loop.
  const form = buildForm(overlay, async (creds) => {
    const key = store.morphKey.get();
    if (key === 'login') {
      form.setError(null);
      form.setBusy(true);
      const res = deps.loginLocal ? await deps.loginLocal(creds) : await store.login(creds);
      form.setBusy(false);
      if (res.ok) {
        app.beginMorphClose();      // form pours back into the orb
        app.flashGreen('login');   // green flash on the orb as it retires
        store.expanded.set(true);  // member constellation blooms — one continuous motion
      } else {
        form.setError(res.error ?? 'Login failed');
        form.shake();              // red flash + shake; stay on the form to retry
      }
    } else if (key) {
      app.beginMorphClose();        // profile / create
      app.flashGreen(key);         // acknowledge save in the demo
    }
  }, () => {
    app.beginMorphClose();         // Back: pour the form back into its orb, unfreeze the app
  }, deps.login);

  // Morph page lives at the top level so its fixed panel anchors to the viewport, not the scaled stage.
  const page = buildPage(root, () => app.beginMorphClose());

  // Accessible parallel menu, kept in sync with the visible root.
  const a11yHost = document.createElement('div');
  a11yHost.className = 'iwt-a11y';
  root.appendChild(a11yHost);
  const syncMenu = () => renderMenu(a11yHost, store.visibleRoot(), (node) => {
    const action = node.action;
    if (action?.kind === 'morph-form') {
      store.morphKey.set(node.id);
      store.morphKind.set('form');
      form.open(action.form, node.label);
      form.setScreenPosition(VIEW / 2, VIEW / 2, scaleOf()); // a11y route may have no on-screen orb to anchor to
    } else if (action?.kind === 'morph-page') {
      store.morphKey.set(node.id);
      store.morphKind.set('page');
      page.open(action.page, node.label, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    } else if (action?.kind === 'command') action.run(commandCtx);
  });
  store.status.subscribe(syncMenu);
  store.role.subscribe(syncMenu);
  store.tree.subscribe(syncMenu);
  syncMenu();

  // Fit the stage to the viewport.
  const fit = () => {
    const m = Math.min(window.innerWidth - 30, window.innerHeight - 60, 640);
    stage.style.transform = `scale(${m / VIEW})`;
  };
  window.addEventListener('resize', fit);
  fit();

  const app = new IWTApp(store, skin, form, page, stage, scaleOf, commandCtx);
  app.start();

  const detachKeyboard = attachKeyboard(document, {
    expand:    () => app.onKey('expand'),
    collapse:  () => app.onKey('collapse'),
    drill:     () => app.onKey('drill'),
    activate:  () => app.onKey('activate'),
    focusPrev: () => app.onKey('focusPrev'),
    focusNext: () => app.onKey('focusNext'),
    reset:     () => app.onKey('reset'),
  });

  const stop = (): void => {
    detachKeyboard();
    window.removeEventListener('resize', fit);
    app.stop();
  };

  return { app, store, page, form, stop };
}
