export interface HitOrb { key: string; x: number; y: number; r: number; retiring?: boolean; }
export type Hit = { kind: 'origin' } | { kind: 'orb'; key: string } | { kind: 'none' };

export function hitTest(
  p: { x: number; y: number },
  origin: { x: number; y: number },
  originR: number,
  orbs: HitOrb[],
  pad = 6,
): Hit {
  if (Math.hypot(p.x - origin.x, p.y - origin.y) < originR) return { kind: 'origin' };
  for (const o of orbs) {
    if (o.retiring) continue;
    if (Math.hypot(p.x - o.x, p.y - o.y) < o.r + pad) return { kind: 'orb', key: o.key };
  }
  return { kind: 'none' };
}
