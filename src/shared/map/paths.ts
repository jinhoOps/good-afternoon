import type { Edge, EdgeInput, Move } from '../types/graph';

export function normalizeEdge(edge: EdgeInput): Edge {
  if (Array.isArray(edge)) return { from: edge[0], to: edge[1] };
  return edge as Edge;
}

export function isSamePath(edge: Edge, move: Move): boolean {
  return (edge.from === move.from && edge.to === move.to)
    || (edge.from === move.to && edge.to === move.from);
}
