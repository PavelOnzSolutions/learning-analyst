import type { OrbHue } from '../model/types';

export interface FrameOrb {
  key: string;
  hue: OrbHue;
  x: number; y: number; r: number;
  fill?: string;                 // override gradient (e.g. success flash)
  parentX: number; parentY: number;
  neckWidth: number; neckOpacity: number;
  label: string; labelOpacity: number;
}

export interface FrameRipple { x: number; y: number; t: number; color: string; }

export interface SolverFrame {
  origin: { x: number; y: number };
  offset: { x: number; y: number };
  orbs: FrameOrb[];
  ripples: FrameRipple[];
  morphKey: string | null;
  focusedKey: string | null;
  hoverOrigin: boolean;
  infoUser: string;              // e.g. "Pavel · member" or "not signed in"
}

export interface Skin {
  mount(container: HTMLElement): void;
  render(frame: SolverFrame): void;
  destroy(): void;
}
