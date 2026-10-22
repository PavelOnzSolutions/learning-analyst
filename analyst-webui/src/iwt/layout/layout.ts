import { C, RBIG, L, FULLR, PATHR, PEEKR } from './constants';
import type { OrbNode } from '../model/types';
import type { PathEntry } from '../state/reducers';

export const MAX_PER_LEVEL = 8;

function capLevel(nodes: OrbNode[]): OrbNode[] {
  if (nodes.length <= MAX_PER_LEVEL) return nodes;
  const head = nodes.slice(0, MAX_PER_LEVEL - 1);
  const more: OrbNode = { id: '__more', label: '…more', color: 'gray', action: { kind: 'expand' },
    children: nodes.slice(MAX_PER_LEVEL - 1) };
  return [...head, more];
}

export interface LayoutInput {
  rootList: OrbNode[];          // pruned visible root options
  path: PathEntry[];            // breadcrumb (root → tip)
  expanded: boolean;
  peeking: boolean;
  rootSpin: number;
  driftT: number;
  morphKey: string | null;
}

export interface OrbTarget {
  key: string;
  parentKey: string;            // 'ORIGIN' or another orb key
  node: OrbNode;
  role: 'path' | 'option';
  angle: number;
  x: number;
  y: number;
  r: number;
  peek: boolean;
}

export function originTarget(driftT: number): { x: number; y: number } {
  return { x: C + Math.sin(driftT * 0.3) * 8, y: C + Math.cos(driftT * 0.24) * 7 };
}

export function layout(input: LayoutInput): { origin: { x: number; y: number }; orbs: OrbTarget[] } {
  const origin = originTarget(input.driftT);
  const orbs: OrbTarget[] = [];
  if (!input.expanded && !input.peeking) return { origin, orbs };

  const pos: Record<string, { x: number; y: number }> = { ORIGIN: origin };

  // Path chain: each trail orb hangs off its parent at its stored selection angle.
  let parentKey = 'ORIGIN';
  const prefix: string[] = [];
  for (const entry of input.path) {
    prefix.push(entry.node.id);
    const key = prefix.join('/');
    const p = pos[parentKey];
    const x = p.x + Math.cos(entry.angle) * L;
    const y = p.y + Math.sin(entry.angle) * L;
    pos[key] = { x, y };
    orbs.push({ key, parentKey, node: entry.node, role: 'path', angle: entry.angle,
      x, y, r: input.morphKey === key ? 0 : PATHR, peek: false });
    parentKey = key;
  }

  // Tip options fan out from the last path node (or Origin at root).
  const tipNode = input.path.length ? input.path[input.path.length - 1].node : null;
  const tipChildren = capLevel(tipNode ? (tipNode.children ?? []) : input.rootList);
  const tipKey = input.path.length ? parentKey : 'ORIGIN';
  const tipPos = pos[tipKey];
  const n = tipChildren.length;
  const outgoing = input.path.length ? input.path[input.path.length - 1].angle : -Math.PI / 2;

  tipChildren.forEach((ch, i) => {
    let angle: number;
    if (!input.path.length) {
      angle = -Math.PI / 2 + (i * 2 * Math.PI) / n + input.rootSpin;
    } else {
      const arc = Math.min(2.4, 0.62 * n);
      const step = n > 1 ? arc / (n - 1) : 0;
      angle = outgoing - (n > 1 ? arc / 2 : 0) + i * step;
    }
    const key = (input.path.length ? tipKey + '/' : '') + ch.id;
    const len = input.peeking ? RBIG + 10 : L;
    const x = tipPos.x + Math.cos(angle) * len;
    const y = tipPos.y + Math.sin(angle) * len;
    const r = input.morphKey === key ? 0 : input.peeking ? PEEKR : FULLR;
    orbs.push({ key, parentKey: tipKey, node: ch, role: 'option', angle, x, y, r, peek: input.peeking });
  });

  return { origin, orbs };
}
