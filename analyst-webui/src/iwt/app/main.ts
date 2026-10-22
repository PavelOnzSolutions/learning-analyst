import { mountIWT, VERSION } from './mount';
import { MockAuthProvider } from '../providers/mock-auth';
import { MockProfileProvider } from '../providers/mock-profile';
import type { IWTApp } from './app';

export { VERSION };

export function boot(root: HTMLElement): IWTApp {
  const handle = mountIWT(root, {
    auth: new MockAuthProvider(),
    profileProvider: new MockProfileProvider(),
  });
  return handle.app;
}

if (typeof document !== 'undefined' && document.getElementById('iwt-root')) {
  boot(document.getElementById('iwt-root')!);
}
