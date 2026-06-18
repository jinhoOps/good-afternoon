export type NodeId = string;

export type Edge = {
  from: NodeId;
  to: NodeId;
  hiddenUntil?: string;
};

export type EdgeInput = readonly [NodeId, NodeId] | Edge;

export type Move = {
  from: NodeId;
  to: NodeId;
};

export type GridPosition = {
  q: number;
  r: number;
  elevation?: number;
};

export type ScreenPosition = {
  x: number;
  y: number;
};
