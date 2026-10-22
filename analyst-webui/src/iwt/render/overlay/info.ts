export interface InfoHandle {
  el: HTMLElement;
  setUser(text: string): void;
  setVisible(v: boolean): void;
  setPosition(xPct: number, yPct: number): void;
}

export function buildInfo(host: HTMLElement, version: string): InfoHandle {
  const el = document.createElement('div');
  el.className = 'iwt-info';
  el.innerHTML = `<div class="v">IWT v${version}</div><div class="u" data-user>not signed in</div>`;
  host.appendChild(el);
  const user = el.querySelector<HTMLElement>('[data-user]')!;
  return {
    el,
    setUser: (t) => { user.textContent = t; },
    setVisible: (v) => { el.style.opacity = v ? '1' : '0'; },
    setPosition: (x, y) => { el.style.left = `${x}%`; el.style.top = `${y}%`; },
  };
}
