import type { OrbNode, AuthCtx } from './types';

const guest = (c: AuthCtx) => c.status !== 'loggedIn';
const member = (c: AuthCtx) => c.status === 'loggedIn';
const admin = (c: AuthCtx) => c.status === 'loggedIn' && c.role === 'admin';

export const ORB_TREE: OrbNode[] = [
  { id: 'login', label: 'log in', color: 'teal', visibleWhen: guest,
    action: { kind: 'morph-form', form: 'login' } },

  { id: 'work', label: 'see my work', color: 'teal', visibleWhen: member, children: [
      { id: 'recent', label: 'open recent', color: 'teal', action: { kind: 'navigate', to: '/recent' } },
      { id: 'new', label: 'start something new', color: 'violet', action: { kind: 'morph-form', form: 'create' } },
      { id: 'archive', label: 'browse the archive', color: 'amber', children: [
          { id: 'y24', label: '2024', color: 'amber', action: { kind: 'navigate', to: '/archive/2024' } },
          { id: 'y23', label: '2023', color: 'rose', action: { kind: 'navigate', to: '/archive/2023' } },
      ] },
  ] },

  { id: 'dashboard', label: 'see my dashboard', color: 'teal', visibleWhen: member,
    action: { kind: 'morph-page', page: 'dashboard' } },
  { id: 'data', label: 'browse the data table', color: 'violet', visibleWhen: member,
    action: { kind: 'morph-page', page: 'table' } },

  { id: 'profile', label: 'edit my profile', color: 'violet', visibleWhen: member,
    action: { kind: 'morph-form', form: 'profile' } },
  { id: 'messages', label: 'read my messages', color: 'rose', visibleWhen: member,
    action: { kind: 'navigate', to: '/messages' } },
  { id: 'settings', label: 'adjust settings', color: 'amber', visibleWhen: member,
    action: { kind: 'navigate', to: '/settings' } },

  { id: 'users', label: 'manage users', color: 'gray', visibleWhen: admin, children: [
      { id: 'roster', label: 'view roster', color: 'gray', action: { kind: 'navigate', to: '/users' } },
  ] },

  { id: 'signout', label: 'sign out', color: 'gray', visibleWhen: member,
    action: { kind: 'command', run: (ctx) => ctx.logout() } },
];
