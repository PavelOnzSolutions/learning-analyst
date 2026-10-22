import type { OrbNode, AuthCtx } from '../model/types';

export function prune(nodes: OrbNode[], ctx: AuthCtx): OrbNode[] {
  return nodes
    .filter((n) => !n.visibleWhen || n.visibleWhen(ctx))
    .map((n) => (n.children ? { ...n, children: prune(n.children, ctx) } : n));
}
