import { stepSpring, FRAME_DT, type SpringState } from './spring';

export type { SpringState } from './spring';

export interface Solver {
  step(s: SpringState, target: number, dt?: number): void;
}

export class SpringSolver implements Solver {
  constructor(private k: number, private d: number) {}
  step(s: SpringState, target: number, dt: number = FRAME_DT): void {
    stepSpring(s, target, this.k, this.d, dt);
  }
}
