import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../../api/hooks';
import type { ApiClient } from '../../api/client';
import type { CommandCtx, OrbAction, OrbHue, OrbNode, PageId } from '../model/types';

export const GUEST_TREE: OrbNode[] = [
  {
    id: 'login', label: 'log in', color: 'teal',
    action: { kind: 'morph-form', form: 'login' },
  },
];

const COMMANDS: Record<string, (ctx: CommandCtx) => void> = {
  'sign-out': (ctx) => ctx.logout(),
};

interface MenuActionDto {
  kind: 'morph-page' | 'command';
  page?: PageId;
  key?: string;
}

interface MenuNodeDto {
  id: string;
  label: string;
  color: OrbHue;
  children: MenuNodeDto[] | null;
  action: MenuActionDto | null;
}

function toAction(dto: MenuActionDto): OrbAction {
  if (dto.kind === 'morph-page') {
    return { kind: 'morph-page', page: dto.page! };
  }
  const run = COMMANDS[dto.key!];
  if (!run) throw new Error(`Unknown IWT menu command key: ${dto.key}`);
  return { kind: 'command', run };
}

function toOrbNode(dto: MenuNodeDto): OrbNode {
  return {
    id: dto.id,
    label: dto.label,
    color: dto.color,
    children: dto.children?.map(toOrbNode) ?? undefined,
    action: dto.action ? toAction(dto.action) : undefined,
  };
}

export async function fetchMemberTree(api: ApiClient): Promise<OrbNode[]> {
  const dtos = await api.get<MenuNodeDto[]>('/iwt/menu');
  return dtos.map(toOrbNode);
}

/** Fetches the real member tree once authenticated; disabled (and un-fetched) for guests. */
export function useIwtMenu(enabled: boolean) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['iwt', 'menu'],
    queryFn: () => fetchMemberTree(api),
    enabled,
  });
}
