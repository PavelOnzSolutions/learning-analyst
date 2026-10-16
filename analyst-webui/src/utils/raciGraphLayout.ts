import dagre from 'dagre';
import { IRaciMatrix, RaciRole } from '../models/raci.model';
import { principalKey } from './raciHelpers';

const nodeWidth = 200;
const nodeHeight = 80;

export interface GraphNode { id: string; label: string; type: 'op' | 'principal'; x: number; y: number; }
export interface GraphEdge {
  id: string; source: string; target: string; role: RaciRole;
  sourceHandle?: string; targetHandle?: string;
  /** Curvature offset applied when multiple edges share the same source→target pair. */
  curveOffset: number;
}

export function getClosestHandle(
  source: { x: number; y: number },
  target: { x: number; y: number },
) {
  const sx = source.x + nodeWidth / 2;
  const sy = source.y + nodeHeight / 2;
  const tx = target.x + nodeWidth / 2;
  const ty = target.y + nodeHeight / 2;
  const dx = tx - sx;
  const dy = ty - sy;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourceHandle: 'right-out', targetHandle: 'left' }
      : { sourceHandle: 'left-out', targetHandle: 'right' };
  }
  return dy > 0
    ? { sourceHandle: 'bottom-out', targetHandle: 'top' }
    : { sourceHandle: 'top-out', targetHandle: 'bottom' };
}

export function buildGraph(matrix: IRaciMatrix) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 160, marginx: 50, marginy: 50 });
  g.setDefaultEdgeLabel(() => ({}));

  const operationIds = new Set<string>();
  const principalIds = new Set<string>();
  const principalLabels = new Map<string, string>();
  const rawEdges: { id: string; source: string; target: string; role: RaciRole }[] = [];

  for (const cell of matrix.cells ?? []) {
    const opId = `op:${cell.operationClass}`;
    operationIds.add(opId);
    g.setNode(opId, { label: cell.operationClass, width: nodeWidth, height: nodeHeight });
    for (const p of cell.principals) {
      const pId = principalKey(p);
      principalIds.add(pId);
      principalLabels.set(pId, p.displayName);
      g.setNode(pId, { label: p.displayName, width: nodeWidth, height: nodeHeight });
      rawEdges.push({
        id: `${opId}->${pId}:${cell.raciRole}`,
        source: opId, target: pId, role: cell.raciRole,
      });
      // Only add one dagre edge per unique source→target pair
      if (!g.hasEdge(opId, pId)) {
        g.setEdge(opId, pId);
      }
    }
  }
  dagre.layout(g);

  const nodeMap = new Map<string, { x: number; y: number }>();
  const nodes: GraphNode[] = [];

  operationIds.forEach((id) => {
    const n = g.node(id);
    const pos = { x: n.x - nodeWidth / 2, y: n.y - nodeHeight / 2 };
    nodeMap.set(id, pos);
    nodes.push({ id, label: id.replace('op:', ''), type: 'op', ...pos });
  });
  principalIds.forEach((id) => {
    const n = g.node(id);
    const pos = { x: n.x - nodeWidth / 2, y: n.y - nodeHeight / 2 };
    nodeMap.set(id, pos);
    nodes.push({ id, label: principalLabels.get(id) ?? id, type: 'principal', ...pos });
  });

  // Group edges by source→target pair to compute curve offsets
  const pairGroups = new Map<string, typeof rawEdges>();
  for (const e of rawEdges) {
    const pairKey = `${e.source}||${e.target}`;
    let group = pairGroups.get(pairKey);
    if (!group) { group = []; pairGroups.set(pairKey, group); }
    group.push(e);
  }

  const CURVE_SPREAD = 50; // px between parallel splines

  const edges: GraphEdge[] = [];
  for (const group of pairGroups.values()) {
    const count = group.length;
    for (let i = 0; i < count; i++) {
      const e = group[i];
      const srcPos = nodeMap.get(e.source);
      const tgtPos = nodeMap.get(e.target);
      const handles = srcPos && tgtPos ? getClosestHandle(srcPos, tgtPos) : {};
      // Spread offsets symmetrically: e.g. for 3 edges → -50, 0, +50
      const curveOffset = count > 1
        ? (i - (count - 1) / 2) * CURVE_SPREAD
        : 0;
      edges.push({ ...e, ...handles, curveOffset });
    }
  }

  return { nodes, edges };
}

export const ROLE_COLORS: Record<RaciRole, string> = {
  RESPONSIBLE: '#3b82f6',
  ACCOUNTABLE: '#22c55e',
  CONSULTED:   '#f59e0b',
  INFORMED:    '#9ca3af',
};
