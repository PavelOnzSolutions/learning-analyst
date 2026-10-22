import { dashboardPanelHtml, instancesPanelHtml, subscriptionPanelHtml, loadingPanelHtml } from './real-panels';
import type { CustomerDashboard, Instance, Subscription } from '../../../api/types';

test('dashboardPanelHtml includes instance counts and plan', () => {
  const dashboard: CustomerDashboard = {
    customerId: 'c1', totalInstances: 3, countsByStatus: {}, activeInstances: 2,
    plan: 'PRO', subscriptionStatus: 'ACTIVE', maxInstances: 10,
  };
  const html = dashboardPanelHtml(dashboard);
  expect(html).toContain('3');
  expect(html).toContain('2');
  expect(html).toContain('PRO');
  expect(html).toContain('ACTIVE');
});

test('instancesPanelHtml lists each instance name/status/region', () => {
  const instances: Instance[] = [
    { id: 'i1', customerId: 'c1', name: 'Aurora', slug: 'aurora', region: 'westeurope',
      status: 'RUNNING', endpoints: null, versionLabel: null, currentDeploymentId: null, createdAt: '2026-01-01' },
  ];
  const html = instancesPanelHtml(instances);
  expect(html).toContain('Aurora');
  expect(html).toContain('RUNNING');
  expect(html).toContain('westeurope');
});

test('instancesPanelHtml shows an empty state for no instances', () => {
  expect(instancesPanelHtml([])).toContain('No instances');
});

test('subscriptionPanelHtml includes plan and status', () => {
  const sub: Subscription = { customerId: 'c1', plan: 'ENTERPRISE', status: 'ACTIVE', quotas: null, history: [] };
  const html = subscriptionPanelHtml(sub);
  expect(html).toContain('ENTERPRISE');
  expect(html).toContain('ACTIVE');
});

test('loadingPanelHtml renders a loading indicator', () => {
  expect(loadingPanelHtml()).toMatch(/loading/i);
});

test('instancesPanelHtml escapes instance names to prevent HTML injection', () => {
  const instances: Instance[] = [
    { id: 'i1', customerId: 'c1', name: '<img src=x onerror=alert(1)>', slug: 's', region: 'r',
      status: 'RUNNING', endpoints: null, versionLabel: null, currentDeploymentId: null, createdAt: '2026-01-01' },
  ];
  expect(instancesPanelHtml(instances)).not.toContain('<img');
});
