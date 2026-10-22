import { VIEW } from '../layout/constants';

export interface PointerHandlers {
  move(p: { x: number; y: number }): void;
  down(p: { x: number; y: number }): void;
  leave(): void;
  wheel(deltaY: number): boolean;
}

export function toStageCoords(
  stage: HTMLElement,
  e: { clientX: number; clientY: number },
): { x: number; y: number } {
  const r = stage.getBoundingClientRect();
  const scale = r.width / VIEW;
  return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
}

export function attachPointer(stage: HTMLElement, h: PointerHandlers): () => void {
  const move = (e: PointerEvent) => h.move(toStageCoords(stage, e));
  const down = (e: PointerEvent) => h.down(toStageCoords(stage, e));
  const leave = () => h.leave();
  const wheel = (e: WheelEvent) => { if (h.wheel(e.deltaY)) e.preventDefault(); };
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerdown', down);
  stage.addEventListener('pointerleave', leave);
  stage.addEventListener('wheel', wheel, { passive: false });
  return () => {
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerdown', down);
    stage.removeEventListener('pointerleave', leave);
    stage.removeEventListener('wheel', wheel);
  };
}
