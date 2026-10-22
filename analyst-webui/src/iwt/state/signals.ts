export type Listener<T> = (value: T) => void;

export class Signal<T> {
  private listeners = new Set<Listener<T>>();
  constructor(private value: T) {}

  get(): T { return this.value; }

  set(next: T): void {
    if (Object.is(next, this.value)) return;
    this.value = next;
    this.listeners.forEach((l) => l(next));
  }

  update(fn: (current: T) => T): void { this.set(fn(this.value)); }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
