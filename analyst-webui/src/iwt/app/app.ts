import { Store } from '../state/store';
import { layout as runLayout } from '../layout/layout';
import { dispatchIntent, type Intent, type KeyboardContext, type FocusedTarget } from '../interaction/keyboard-routing';
import { C, RBIG } from '../layout/constants';
import { stepSpring, FRAME_DT, type SpringState } from '../physics/spring';
import { hitTest, type HitOrb } from '../interaction/hit-test';
import { applyWheel, stepRootSpin, SPIN_TUNING } from '../physics/spin';
import { attachPointer } from '../interaction/pointer';
import type { LivingBlobsSkin } from '../render/living-blobs/skin';
import type { FormHandle } from '../render/overlay/form';
import type { PageHandle } from '../render/overlay/page';
import type { SolverFrame, FrameOrb } from '../render/skin';
import type { CommandCtx, OrbHue, OrbNode } from '../model/types';

const POS_K = 0.022, POS_D = 0.83, R_K = 0.11, R_D = 0.7, OFF_K = 0.05, OFF_D = 0.82, LBL_K = 0.12, LBL_D = 0.7;

interface SceneOrb {
  key: string; parentKey: string; node: OrbNode; hue: OrbHue; role: 'path' | 'option';
  x: SpringState; y: SpringState; r: SpringState; label: SpringState;
  tx: number; ty: number; tr: number; angle: number; peek: boolean; retiring: boolean;
  flash?: { start: number; dur: number; green: boolean };
}
interface Ripple { x: number; y: number; t: number; color: string; }

export class IWTApp {
  private scene = new Map<string, SceneOrb>();
  private ripples: Ripple[] = [];
  private offX: SpringState = { value: 0, vel: 0 };
  private offY: SpringState = { value: 0, vel: 0 };
  private peeking = false;
  private spinVel = 0;
  private raf = 0;
  private detachPointer?: () => void;

  constructor(
    private store: Store,
    private skin: LivingBlobsSkin,
    private form: FormHandle,
    private page: PageHandle,
    private stage: HTMLElement,
    private scaleOf: () => number,
    private commandCtx: CommandCtx,
  ) {}

  start(): void {
    this.detachPointer = attachPointer(this.stage, {
      move: (p) => {
        if (this.store.morphKey.get()) return;
        const o = this.originScreen();
        this.store.hoverOrigin.set(Math.hypot(p.x - o.x, p.y - o.y) < RBIG + 12);
      },
      leave: () => { if (!this.store.morphKey.get()) this.store.hoverOrigin.set(false); },
      down: (p) => this.onDown(p),
      wheel: (deltaY) => this.onWheel(deltaY),
    });
    const loop = () => { this.frame(FRAME_DT); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  private onWheel(deltaY: number): boolean {
    if (this.store.morphKey.get() || !this.store.hoverOrigin.get()) return false;
    this.spinVel = applyWheel(this.spinVel, deltaY, SPIN_TUNING.sens);
    return true;
  }

  stop(): void { cancelAnimationFrame(this.raf); this.detachPointer?.(); }

  /** Called when a morph overlay closes (submit/save, Back, or Escape). Returns the morph key that was active. */
  beginMorphClose(): string | null {
    const key = this.store.morphKey.get();
    const kind = this.store.morphKind.get();
    if (kind === 'page') this.page.close();
    else if (kind === 'form') this.form.close();
    this.store.morphKey.set(null);
    this.store.morphKind.set(null);
    return key;
  }

  onKey(intent: Intent): void {
    dispatchIntent(this.keyboardCtx(), intent);
  }

  private currentOrbs(): ReturnType<typeof runLayout>['orbs'] {
    return runLayout({
      rootList: this.store.visibleRoot(),
      path: this.store.path.get(),
      expanded: this.store.expanded.get(),
      peeking: this.peeking,
      rootSpin: this.store.rootSpin,
      driftT: this.store.driftT,
      morphKey: this.store.morphKey.get(),
    }).orbs;
  }

  private keyboardCtx(): KeyboardContext {
    return {
      store: this.store,
      firstOptionKey: () => {
        const o = this.currentOrbs().find((t) => t.role === 'option');
        return o ? o.key : null;
      },
      orderedRing: () => this.currentOrbs().filter((t) => t.role === 'option').map((t) => t.key),
      focusedTarget: (): FocusedTarget | null => {
        const key = this.store.focusedKey.get();
        if (!key) return null;
        const t = this.currentOrbs().find((x) => x.key === key && x.role === 'option');
        if (!t) return null;
        const s = this.scene.get(key);
        const x = s ? s.x.value : t.x;
        const y = s ? s.y.value : t.y;
        return { key, node: t.node, angle: t.angle, x, y };
      },
      originPos: () => this.originWorld(),
      ripple: (x, y) => this.ripple(x, y),
      activateNode: (node, key, x, y) => {
        // Keyboard-activated leaves don't need an angle (leaves don't drill); pass 0.
        this.activateNode(node, key, x, y, 0);
      },
      beginMorphClose: () => { this.beginMorphClose(); },
    };
  }

  flashGreen(key: string): void {
    const s = this.scene.get(key);
    if (s) { s.flash = { start: this.store.t, dur: 0.7, green: true }; this.ripple(s.x.value, s.y.value, '#46d39a'); }
  }

  private originWorld(): { x: number; y: number } {
    const d = this.store.driftT;
    return { x: C + Math.sin(d * 0.3) * 8, y: C + Math.cos(d * 0.24) * 7 };
  }
  private originScreen(): { x: number; y: number } {
    const o = this.originWorld();
    return { x: o.x + this.offX.value, y: o.y + this.offY.value };
  }
  private curWorld(key: string): { x: number; y: number } {
    if (key === 'ORIGIN') return this.originWorld();
    const o = this.scene.get(key);
    return o ? { x: o.x.value, y: o.y.value } : this.originWorld();
  }

  private onDown(p: { x: number; y: number }): void {
    if (this.store.morphKey.get()) return;
    const o = this.originScreen();
    const ox = this.offX.value, oy = this.offY.value;
    const dOrigin = Math.hypot(p.x - o.x, p.y - o.y);

    if (!this.store.expanded.get()) {
      if (dOrigin < RBIG + 34) { this.store.expanded.set(true); this.ripple(o.x - ox, o.y - oy); }
      return;
    }
    if (dOrigin < RBIG) { this.store.back(); this.ripple(o.x - ox, o.y - oy); return; }

    const orbs: HitOrb[] = [...this.scene.values()]
      .filter((s) => !s.retiring)
      .map((s) => ({ key: s.key, x: s.x.value + ox, y: s.y.value + oy, r: s.r.value }));
    const hit = hitTest(p, o, RBIG, orbs);
    if (hit.kind !== 'orb') return;
    const s = this.scene.get(hit.key)!;
    if (s.role === 'option') {
      this.store.focusedKey.set(s.key);
      this.activate(s);
    } else {
      this.store.jump(hit.key.split('/').length); // trail orb → jump back to its level
    }
  }

  private activate(s: SceneOrb): void {
    this.activateNode(s.node, s.key, s.x.value, s.y.value, s.angle);
  }

  private activateNode(node: OrbNode, key: string, x: number, y: number, angle: number): void {
    this.ripple(x, y);
    if (node.children && node.children.length) { this.store.drill(node, angle); return; }
    const action = node.action;
    if (!action) return;
    if (action.kind === 'morph-form') {
      this.store.morphKey.set(key);
      this.store.morphKind.set('form');
      this.form.open(action.form, node.label);
    } else if (action.kind === 'morph-page') {
      this.store.morphKey.set(key);
      this.store.morphKind.set('page');
      const scale = this.scaleOf();
      const rect = this.stage.getBoundingClientRect();
      const px = rect.left + (x + this.offX.value) * scale;
      const py = rect.top + (y + this.offY.value) * scale;
      this.page.open(action.page, node.label, { x: px, y: py });
    } else if (action.kind === 'command') {
      action.run(this.commandCtx);
    } else if (action.kind === 'navigate') {
      this.flashGreen(key);
    }
  }

  private ripple(x: number, y: number, color = '#9fd3ff'): void { this.ripples.push({ x, y, t: 0, color }); }

  private frame(dt: number): void {
    const frozen = !!this.store.morphKey.get();
    this.store.t += dt;
    if (!frozen) this.store.driftT += dt;

    this.peeking = this.store.hoverOrigin.get() && !this.store.expanded.get() && !frozen;
    const spinActive = this.store.hoverOrigin.get() && !frozen;
    const spin = stepRootSpin(this.store.rootSpin, this.spinVel, spinActive, this.peeking, SPIN_TUNING);
    this.store.rootSpin = spin.rootSpin;
    this.spinVel = spin.spinVel;

    const out = runLayout({
      rootList: this.store.visibleRoot(),
      path: this.store.path.get(),
      expanded: this.store.expanded.get(),
      peeking: this.peeking,
      rootSpin: this.store.rootSpin,
      driftT: this.store.driftT,
      morphKey: this.store.morphKey.get(),
    });

    const focused = this.store.focusedKey.get();
    if (focused) {
      const stillVisible = out.orbs.some((t) => t.key === focused && t.role === 'option');
      if (!stillVisible) {
        const first = out.orbs.find((t) => t.role === 'option');
        this.store.focusedKey.set(first ? first.key : null);
      }
    }

    const keep = new Set(out.orbs.map((t) => t.key));
    for (const tgt of out.orbs) {
      let s = this.scene.get(tgt.key);
      if (!s) {
        const p = this.curWorld(tgt.parentKey);
        s = { key: tgt.key, parentKey: tgt.parentKey, node: tgt.node, hue: tgt.node.color, role: tgt.role,
          x: { value: p.x, vel: 0 }, y: { value: p.y, vel: 0 }, r: { value: 0, vel: 0 }, label: { value: 0, vel: 0 },
          tx: p.x, ty: p.y, tr: 0, angle: tgt.angle, peek: tgt.peek, retiring: false };
        this.scene.set(tgt.key, s);
      }
      s.role = tgt.role; s.angle = tgt.angle; s.parentKey = tgt.parentKey; s.peek = tgt.peek;
      s.retiring = false; s.tx = tgt.x; s.ty = tgt.y; s.tr = tgt.r;
    }
    for (const [key, s] of this.scene) {
      if (!keep.has(key)) { const p = this.curWorld(s.parentKey); s.tx = p.x; s.ty = p.y; s.tr = 0; s.retiring = true; }
    }

    // recenter offset only while a trail exists (spec §6)
    let desOx = 0, desOy = 0;
    if (this.store.path.get().length > 0) {
      let cx = 0, cy = 0, cnt = 0;
      this.scene.forEach((s) => { if (!s.retiring) { cx += s.tx; cy += s.ty; cnt++; } });
      if (cnt > 0) { cx /= cnt; cy /= cnt; desOx = -(cx - C) * 0.6; desOy = -(cy - C) * 0.6; }
    }
    stepSpring(this.offX, desOx, OFF_K, OFF_D, dt);
    stepSpring(this.offY, desOy, OFF_K, OFF_D, dt);
    const ox = this.offX.value, oy = this.offY.value;

    const expanded = this.store.expanded.get();
    const morphKey = this.store.morphKey.get();
    const frameOrbs: FrameOrb[] = [];
    const remove: string[] = [];

    this.scene.forEach((s, key) => {
      stepSpring(s.x, s.tx, POS_K, POS_D, dt);
      stepSpring(s.y, s.ty, POS_K, POS_D, dt);
      stepSpring(s.r, s.tr, R_K, R_D, dt);

      let rDraw = Math.max(0, s.r.value);
      let fill: string | undefined;
      if (s.flash) {
        const f = (this.store.t - s.flash.start) / s.flash.dur;
        if (f >= 1) s.flash = undefined;
        else { rDraw += Math.sin(Math.PI * f) * 7; if (s.flash.green) fill = 'url(#gsuccess)'; }
      }

      const sx = s.x.value + ox, sy = s.y.value + oy;
      const pp = this.curWorld(s.parentKey);
      const px = pp.x + ox, py = pp.y + oy;
      const dd = Math.hypot(sx - px, sy - py);
      const neckWidth = morphKey === key ? Math.max(0, 8 - dd * 0.1) : Math.max(4, 22 - dd * 0.12);
      const showLabel = (s.role === 'path' || (s.role === 'option' && expanded && !s.peek)) && morphKey !== key && s.r.value > 15;
      stepSpring(s.label, showLabel ? 1 : 0, LBL_K, LBL_D, dt);

      frameOrbs.push({ key, hue: s.hue, x: sx, y: sy, r: rDraw, fill, parentX: px, parentY: py,
        neckWidth, neckOpacity: rDraw > 3 ? 1 : 0, label: s.node.label, labelOpacity: s.label.value });

      if (morphKey === key && this.store.morphKind.get() === 'form') this.form.setScreenPosition(sx, sy, this.scaleOf());
      if (s.retiring && rDraw < 0.7 && dd < 4) remove.push(key);
    });
    remove.forEach((k) => this.scene.delete(k));

    this.ripples.forEach((r) => (r.t += dt));
    this.ripples = this.ripples.filter((r) => r.t < 1.1);
    if (this.store.hoverOrigin.get() && !frozen && Math.random() < 0.045) {
      const o = this.originWorld(); this.ripple(o.x, o.y);
    }

    const o = this.originWorld();
    const prof = this.store.profile.get();
    const frame: SolverFrame = {
      origin: { x: o.x + ox, y: o.y + oy },
      offset: { x: ox, y: oy },
      orbs: frameOrbs,
      ripples: this.ripples.map((r) => ({ x: r.x + ox, y: r.y + oy, t: r.t, color: r.color })),
      morphKey,
      focusedKey: this.store.focusedKey.get(),
      hoverOrigin: this.store.hoverOrigin.get() && !frozen,
      infoUser: this.store.expanded.get() && out.orbs.filter((o) => o.role === 'option').length === 0
        ? 'nothing here yet'
        : prof ? `${prof.displayName} · ${this.store.role.get()}` : 'not signed in',
    };
    this.skin.render(frame);
  }
}
