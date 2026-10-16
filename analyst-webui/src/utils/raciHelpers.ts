import { IRaciPrincipal } from '../models/raci.model';

export function principalKey(p: IRaciPrincipal): string {
  if (p.type === 'TEAM_MEMBER') return `tm:${p.teamMemberId}`;
  if (p.type === 'TEAM') return `tm-team:${p.teamId}`;
  return `ext:${p.externalEmail}`;
}

export function samePrincipal(a: IRaciPrincipal, b: IRaciPrincipal): boolean {
  return principalKey(a) === principalKey(b);
}
