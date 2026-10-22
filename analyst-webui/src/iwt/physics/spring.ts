export interface SpringState { value: number; vel: number; }

/** The proven recurrence is calibrated to a 1/60s frame. Larger dt runs fixed substeps so feel is dt-stable and tests stay deterministic. */
export const FRAME_DT = 1 / 60;

export function stepSpring(s: SpringState, target: number, k: number, d: number, dt: number = FRAME_DT): void {
  const steps = Math.max(1, Math.round(dt / FRAME_DT));
  for (let i = 0; i < steps; i++) {
    s.vel = (s.vel + (target - s.value) * k) * d;
    s.value += s.vel;
  }
}
