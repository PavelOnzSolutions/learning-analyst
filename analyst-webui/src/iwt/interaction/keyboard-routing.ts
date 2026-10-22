import type { Store } from '../state/store';
import type { OrbNode } from '../model/types';

export type Intent =
  | 'expand'
  | 'collapse'
  | 'drill'
  | 'activate'
  | 'focusPrev'
  | 'focusNext'
  | 'reset';

export interface FocusedTarget {
  key: string;
  node: OrbNode;
  angle: number;
  x: number;
  y: number;
}

export interface KeyboardContext {
  store: Store;
  /** First option key in the current ring, or null if the ring is empty. */
  firstOptionKey(): string | null;
  /** All option keys in render order; first wraps to last via cyclic index. */
  orderedRing(): string[];
  /** The currently focused option (if any), with its node + angle + scene position. */
  focusedTarget(): FocusedTarget | null;
  /** The current origin world coords (matches what pointer ripples use). */
  originPos(): { x: number; y: number };
  /** Ripple at the given world coords. */
  ripple(x: number, y: number): void;
  /** Run a leaf orb's action (mirrors the pointer activate path). */
  activateNode(node: OrbNode, key: string, x: number, y: number): void;
  /** Close the active morph overlay (form or page). */
  beginMorphClose(): void;
}

export function dispatchIntent(ctx: KeyboardContext, intent: Intent): void {
  const store = ctx.store;
  const morphKey = store.morphKey.get();

  if (intent === 'reset') {
    if (morphKey) { ctx.beginMorphClose(); return; }
    if (!store.expanded.get() && store.path.get().length === 0) return;
    store.path.set([]);
    store.expanded.set(false);
    store.focusedKey.set(null);
    const o = ctx.originPos();
    ctx.ripple(o.x, o.y);
    return;
  }

  // All other intents are suspended while an overlay is open.
  if (morphKey) return;

  switch (intent) {
    case 'expand': {
      if (store.expanded.get()) return;
      store.expanded.set(true);
      store.focusedKey.set(ctx.firstOptionKey());
      const o = ctx.originPos();
      ctx.ripple(o.x, o.y);
      return;
    }
    case 'collapse': {
      if (!store.expanded.get()) return;
      store.back();
      store.focusedKey.set(ctx.firstOptionKey());
      return;
    }
    case 'drill': {
      if (!store.expanded.get()) {
        // ↓ at rest blooms the constellation (mirrors the key map: collapsed ↓ = bloom).
        store.expanded.set(true);
        store.focusedKey.set(ctx.firstOptionKey());
        const o = ctx.originPos();
        ctx.ripple(o.x, o.y);
        return;
      }
      const t = ctx.focusedTarget();
      if (!t) return;
      if (!t.node.children?.length) return;
      ctx.ripple(t.x, t.y);
      store.drill(t.node, t.angle);
      store.focusedKey.set(ctx.firstOptionKey());
      return;
    }
    case 'activate': {
      if (!store.expanded.get()) {
        store.expanded.set(true);
        store.focusedKey.set(ctx.firstOptionKey());
        const o = ctx.originPos();
        ctx.ripple(o.x, o.y);
        return;
      }
      const t = ctx.focusedTarget();
      if (!t) return;
      if (t.node.children?.length) return;     // parents are no-op on activate
      ctx.activateNode(t.node, t.key, t.x, t.y);
      return;
    }
    case 'focusPrev':
    case 'focusNext': {
      if (!store.expanded.get()) return;
      const ring = ctx.orderedRing();
      if (ring.length === 0) return;
      const delta = intent === 'focusNext' ? 1 : -1;
      const cur = store.focusedKey.get();
      const i = cur ? ring.indexOf(cur) : -1;
      const base = i < 0 ? 0 : i;
      const next = (base + delta + ring.length) % ring.length;
      store.focusedKey.set(ring[next]);
      return;
    }
  }
}
