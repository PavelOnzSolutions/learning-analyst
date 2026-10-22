import type { PageId } from '../../model/types';

export interface PageHandle {
  el: HTMLElement;
  open(page: PageId, label: string, originPx?: { x: number; y: number }, bodyHtml?: string): void;
  setBody(html: string): void;
  close(): void;
  setOrigin(x: number, y: number): void;
}

export function buildPage(host: HTMLElement, onClose: () => void): PageHandle {
  const el = document.createElement('section');
  el.className = 'iwt-page';
  el.innerHTML =
    `<div class="pad">` +
      `<div class="head">` +
        `<h4 data-title>I want to …</h4>` +
        `<button class="back" type="button" data-back aria-label="Close">←</button>` +
      `</div>` +
      `<div class="body" data-body></div>` +
    `</div>`;
  host.appendChild(el);

  const title = el.querySelector<HTMLElement>('[data-title]')!;
  const body = el.querySelector<HTMLElement>('[data-body]')!;
  el.querySelector('[data-back]')!.addEventListener('click', () => onClose());

  function renderBody(page: PageId): void {
    if (page === 'dashboard') {
      body.innerHTML =
        `<div class="cards">` +
          `<div class="card"><span class="k">Active projects</span><span class="v">12</span></div>` +
          `<div class="card"><span class="k">Tasks due</span><span class="v">5</span></div>` +
          `<div class="card"><span class="k">Messages</span><span class="v">28</span></div>` +
          `<div class="card"><span class="k">Storage used</span><span class="v">64%</span></div>` +
        `</div>`;
    } else {
      const rows: ReadonlyArray<readonly [string, string, string]> = [
        ['Aurora', 'active', '2026-05-21'],
        ['Borealis', 'paused', '2026-05-18'],
        ['Cirrus', 'active', '2026-05-12'],
        ['Delta', 'archived', '2026-04-30'],
      ];
      body.innerHTML =
        `<table><thead><tr><th>Name</th><th>Status</th><th>Updated</th></tr></thead><tbody>` +
        rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('') +
        `</tbody></table>`;
    }
  }

  function setOrigin(x: number, y: number): void {
    el.style.setProperty('--ox', `${x}px`);
    el.style.setProperty('--oy', `${y}px`);
  }

  function open(page: PageId, label: string, originPx?: { x: number; y: number }, bodyHtml?: string): void {
    title.textContent = `I want to ${label}`;
    if (bodyHtml !== undefined) body.innerHTML = bodyHtml;
    else renderBody(page);
    if (originPx) setOrigin(originPx.x, originPx.y);
    requestAnimationFrame(() => el.classList.add('open'));
    el.querySelector<HTMLButtonElement>('[data-back]')!.focus();
  }

  function setBody(html: string): void {
    body.innerHTML = html;
  }

  function close(): void {
    el.classList.remove('open');
  }

  return { el, open, setBody, close, setOrigin };
}
