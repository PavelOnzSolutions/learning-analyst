import type { OrbNode, AuthStatus } from '../model/types';
export type { AuthStatus };

export interface PathEntry { node: OrbNode; angle: number; }

export const pushEntry = (path: PathEntry[], node: OrbNode, angle: number): PathEntry[] =>
  [...path, { node, angle }];

export const popEntry = (path: PathEntry[]): PathEntry[] => path.slice(0, -1);

export const jumpTo = (path: PathEntry[], depth: number): PathEntry[] => path.slice(0, depth);

export type AuthEvent =
  | { type: 'submit' }
  | { type: 'success' }
  | { type: 'fail' }
  | { type: 'retry' }
  | { type: 'signOut' };

export function authReducer(state: AuthStatus, event: AuthEvent): AuthStatus {
  switch (state) {
    case 'loggedOut':  return event.type === 'submit' ? 'loggingIn' : state;
    case 'loggingIn':  return event.type === 'success' ? 'loggedIn'
                          : event.type === 'fail' ? 'loginError' : state;
    case 'loginError': return event.type === 'retry' || event.type === 'submit' ? 'loggingIn' : state;
    case 'loggedIn':   return event.type === 'signOut' ? 'loggedOut' : state;
  }
}
