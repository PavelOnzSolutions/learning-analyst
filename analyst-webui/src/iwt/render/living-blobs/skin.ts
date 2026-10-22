import type { Skin, SolverFrame, FrameOrb } from '../skin';
import { DEFS_MARKUP } from './defs';
import { VIEW, C, RBIG } from '../../layout/constants';
import { buildInfo, type InfoHandle } from '../overlay/info';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (name: string, attrs: Record<string, string | number>): SVGElement => {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
};

interface OrbNodes { neck: SVGElement; circ: SVGElement; hi: SVGElement; label: SVGElement; }

export class LivingBlobsSkin implements Skin {
  private container!: HTMLElement;
  private fx!: SVGGElement;
  private body!: SVGGElement;
  private hi!: SVGGElement;
  private focusLayer!: SVGGElement;
  private origin!: SVGElement;
  private originHi!: SVGElement;
  private overlay!: HTMLElement;
  info!: InfoHandle;
  private nodes = new Map<string, OrbNodes>();
  private focusRings = new Map<string, SVGElement>();

  constructor(private version: string, private opts: { lite?: boolean } = {}) {}

  mount(container: HTMLElement): void {
    this.container = container;
    const stage = document.createElement('div');
    stage.className = 'iwt-stage' + (this.opts.lite ? ' iwt-lite' : '');
    const bodyFilter = this.opts.lite ? '' : ' filter="url(#goo)"';
    stage.innerHTML =
      `<svg viewBox="0 0 ${VIEW} ${VIEW}"><defs>${DEFS_MARKUP}</defs>` +
      `<g data-fx></g><g data-body${bodyFilter}></g><g data-focus></g><g data-hi></g></svg>` +
      `<div class="iwt-overlay"></div>`;
    container.appendChild(stage);

    const svg = stage.querySelector('svg')!;
    this.fx = svg.querySelector('[data-fx]')!;
    this.body = svg.querySelector('[data-body]')!;
    this.focusLayer = svg.querySelector('[data-focus]')!;
    this.hi = svg.querySelector('[data-hi]')!;
    this.overlay = stage.querySelector('.iwt-overlay')!;

    this.origin = svgEl('circle', { 'data-origin': '', cx: C, cy: C, r: RBIG, fill: 'url(#gOrigin)' });
    this.body.appendChild(this.origin);
    this.originHi = svgEl('ellipse', { cx: C - 16, cy: C - 18, rx: 15, ry: 10, fill: '#fff', 'fill-opacity': 0.32 });
    this.hi.appendChild(this.originHi);

    this.info = buildInfo(this.overlay, this.version);
  }

  render(frame: SolverFrame): void {
    this.origin.setAttribute('cx', String(frame.origin.x));
    this.origin.setAttribute('cy', String(frame.origin.y));
    this.originHi.setAttribute('cx', String(frame.origin.x - 16));
    this.originHi.setAttribute('cy', String(frame.origin.y - 18));

    const keep = new Set(frame.orbs.map((o) => o.key));
    for (const [key, n] of this.nodes) {
      if (!keep.has(key)) { n.neck.remove(); n.circ.remove(); n.hi.remove(); n.label.remove(); this.nodes.delete(key); }
    }
    for (const o of frame.orbs) this.drawOrb(o);

    // Focus ring: at most one orb. Reconcile the singleton.
    for (const [key, ring] of this.focusRings) {
      if (key !== frame.focusedKey || !keep.has(key)) { ring.remove(); this.focusRings.delete(key); }
    }
    if (frame.focusedKey) {
      const o = frame.orbs.find((x) => x.key === frame.focusedKey);
      if (o) this.drawFocusRing(o);
    }

    // ripples redrawn each frame
    while (this.fx.firstChild) this.fx.removeChild(this.fx.firstChild);
    for (const rp of frame.ripples) {
      const a = 1 - rp.t / 1.1, rad = 10 + rp.t * 72;
      this.fx.appendChild(svgEl('circle', { cx: rp.x, cy: rp.y, r: rad, fill: 'none',
        stroke: rp.color, 'stroke-opacity': a * 0.5, 'stroke-width': 2 }));
    }

    this.info.setVisible(frame.hoverOrigin);
    this.info.setUser(frame.infoUser);
    this.info.setPosition((frame.origin.x / VIEW) * 100, (frame.origin.y / VIEW) * 100);
  }

  private drawOrb(o: FrameOrb): void {
    let n = this.nodes.get(o.key);
    if (!n) {
      const neck = svgEl('line', { stroke: `url(#g${o.hue})`, 'stroke-linecap': 'round', opacity: 0 });
      const circ = svgEl('circle', { 'data-orb': o.key, fill: `url(#g${o.hue})`, r: 0 });
      const hi = svgEl('ellipse', { rx: 6, ry: 4, fill: '#fff', 'fill-opacity': 0.3, opacity: 0 });
      const label = svgEl('text', { fill: '#eaf3ff', 'font-size': 12.5, 'text-anchor': 'middle',
        'font-family': 'system-ui', 'pointer-events': 'none', opacity: 0 });
      label.textContent = o.label;
      this.body.appendChild(neck); this.body.appendChild(circ);
      this.hi.appendChild(hi); this.hi.appendChild(label);
      n = { neck, circ, hi, label };
      this.nodes.set(o.key, n);
    }
    n.circ.setAttribute('cx', String(o.x));
    n.circ.setAttribute('cy', String(o.y));
    n.circ.setAttribute('r', String(o.r));
    n.circ.setAttribute('fill', o.fill ?? `url(#g${o.hue})`);
    n.hi.setAttribute('cx', String(o.x - 4));
    n.hi.setAttribute('cy', String(o.y - 5));
    n.hi.setAttribute('opacity', o.r > 9 ? '0.3' : '0');
    n.neck.setAttribute('x1', String(o.parentX));
    n.neck.setAttribute('y1', String(o.parentY));
    n.neck.setAttribute('x2', String(o.x));
    n.neck.setAttribute('y2', String(o.y));
    n.neck.setAttribute('stroke-width', String(o.neckWidth));
    n.neck.setAttribute('opacity', String(o.neckOpacity));
    n.label.setAttribute('x', String(o.x));
    n.label.setAttribute('y', String(o.y - o.r - 8));
    n.label.setAttribute('opacity', String(o.labelOpacity));
  }

  private drawFocusRing(o: FrameOrb): void {
    let ring = this.focusRings.get(o.key);
    if (!ring) {
      ring = svgEl('circle', {
        'data-focus-ring': o.key,
        class: 'iwt-focus-ring',
        fill: 'none',
        'stroke-width': 2,
        'stroke-opacity': 0.7,
      });
      this.focusLayer.appendChild(ring);
      this.focusRings.set(o.key, ring);
    }
    ring.setAttribute('cx', String(o.x));
    ring.setAttribute('cy', String(o.y));
    ring.setAttribute('r', String(Math.max(0, o.r + 4)));
    ring.setAttribute('stroke', `url(#g${o.hue})`);
  }

  destroy(): void {
    this.nodes.clear();
    this.focusRings.clear();
    this.container.innerHTML = '';
  }
}
