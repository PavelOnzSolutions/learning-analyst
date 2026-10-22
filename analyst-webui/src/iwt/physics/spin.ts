export interface SpinTuning { sens: number; damp: number; eps: number; passiveDrift: number; }

export const SPIN_TUNING: SpinTuning = { sens: 0.00025, damp: 0.92, eps: 0.0006, passiveDrift: 0.0058 };

export function applyWheel(spinVel: number, deltaY: number, sens: number): number {
  const clamped = Math.max(-120, Math.min(120, deltaY));
  return spinVel + clamped * sens;
}

export function stepRootSpin(
  rootSpin: number,
  spinVel: number,
  active: boolean,
  peeking: boolean,
  tuning: SpinTuning,
): { rootSpin: number; spinVel: number } {
  if (!active) return { rootSpin, spinVel: 0 };
  if (Math.abs(spinVel) > tuning.eps) {
    return { rootSpin: rootSpin + spinVel, spinVel: spinVel * tuning.damp };
  }
  if (peeking) return { rootSpin: rootSpin + tuning.passiveDrift, spinVel };
  return { rootSpin, spinVel };
}
