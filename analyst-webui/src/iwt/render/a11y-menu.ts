import type { OrbNode } from '../model/types';

export function renderMenu(
  container: HTMLElement,
  root: OrbNode[],
  onActivate: (node: OrbNode) => void,
): void {
  container.innerHTML = '';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'I want to');

  const build = (nodes: OrbNode[], parent: HTMLUListElement): void => {
    nodes.forEach((n) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `I want to ${n.label}`;
      btn.addEventListener('click', () => onActivate(n));
      li.appendChild(btn);
      if (n.children && n.children.length) {
        const sub = document.createElement('ul');
        build(n.children, sub);
        li.appendChild(sub);
      }
      parent.appendChild(li);
    });
  };

  const ul = document.createElement('ul');
  build(root, ul);
  nav.appendChild(ul);
  container.appendChild(nav);
}
