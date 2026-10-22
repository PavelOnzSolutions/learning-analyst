import { GUEST_TREE, fetchMemberTree } from './real-menu';
import type { ApiClient } from '../../api/client';

function fakeApi(response: unknown): ApiClient {
  return {
    get: vi.fn().mockResolvedValue(response),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  };
}

test('GUEST_TREE has exactly one login orb that opens the login form', () => {
  expect(GUEST_TREE).toHaveLength(1);
  expect(GUEST_TREE[0].id).toBe('login');
  expect(GUEST_TREE[0].action).toEqual({ kind: 'morph-form', form: 'login' });
});

test('fetchMemberTree maps a morph-page DTO into an OrbNode', async () => {
  const api = fakeApi([
    { id: 'dashboard', label: 'see my dashboard', color: 'teal', children: null, action: { kind: 'morph-page', page: 'dashboard' } },
  ]);
  const tree = await fetchMemberTree(api);
  expect(tree).toEqual([
    { id: 'dashboard', label: 'see my dashboard', color: 'teal', children: undefined,
      action: { kind: 'morph-page', page: 'dashboard' } },
  ]);
  expect(api.get).toHaveBeenCalledWith('/iwt/menu');
});

test('fetchMemberTree maps a command DTO into an OrbNode whose run() calls the matching CommandCtx method', async () => {
  const api = fakeApi([
    { id: 'sign-out', label: 'sign out', color: 'gray', children: null, action: { kind: 'command', key: 'sign-out' } },
  ]);
  const tree = await fetchMemberTree(api);
  const logoutSpy = vi.fn();
  if (tree[0].action?.kind !== 'command') throw new Error('expected a command action');
  tree[0].action.run({ logout: logoutSpy, navigate: vi.fn() });
  expect(logoutSpy).toHaveBeenCalledOnce();
});

test('fetchMemberTree throws on an unknown command key', async () => {
  const api = fakeApi([
    { id: 'mystery', label: 'do a mystery thing', color: 'gray', children: null, action: { kind: 'command', key: 'nope' } },
  ]);
  await expect(fetchMemberTree(api)).rejects.toThrow(/nope/);
});

test('fetchMemberTree maps nested children recursively', async () => {
  const api = fakeApi([
    { id: 'parent', label: 'parent', color: 'teal', children: [
      { id: 'child', label: 'child', color: 'teal', children: null, action: { kind: 'morph-page', page: 'instances' } },
    ], action: null },
  ]);
  const tree = await fetchMemberTree(api);
  expect(tree[0].children).toHaveLength(1);
  expect(tree[0].children![0].id).toBe('child');
});
