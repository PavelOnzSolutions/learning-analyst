import type { CustomerDashboard, Instance, Subscription } from '../../../api/types';

function esc(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

export function dashboardPanelHtml(d: CustomerDashboard): string {
  return `<div class="cards">` +
    `<div class="card"><span class="k">Total instances</span><span class="v">${d.totalInstances}</span></div>` +
    `<div class="card"><span class="k">Active instances</span><span class="v">${d.activeInstances}</span></div>` +
    `<div class="card"><span class="k">Plan</span><span class="v">${esc(d.plan ?? '—')}</span></div>` +
    `<div class="card"><span class="k">Subscription</span><span class="v">${esc(d.subscriptionStatus ?? '—')}</span></div>` +
    `</div>`;
}

export function instancesPanelHtml(instances: Instance[]): string {
  if (instances.length === 0) return `<p class="empty">No instances yet.</p>`;
  return `<table><thead><tr><th>Name</th><th>Status</th><th>Region</th></tr></thead><tbody>` +
    instances.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.status)}</td><td>${esc(i.region)}</td></tr>`).join('') +
    `</tbody></table>`;
}

export function subscriptionPanelHtml(sub: Subscription): string {
  return `<div class="cards">` +
    `<div class="card"><span class="k">Plan</span><span class="v">${esc(sub.plan)}</span></div>` +
    `<div class="card"><span class="k">Status</span><span class="v">${esc(sub.status)}</span></div>` +
    `</div>`;
}

export function loadingPanelHtml(): string {
  return `<p class="loading">Loading…</p>`;
}
