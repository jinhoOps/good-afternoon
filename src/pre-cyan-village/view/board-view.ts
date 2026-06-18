import { villageNodes } from '../domain/data';
import { isLastMovePath, shouldRenderDirectLastMove, visibleEdges } from '../domain/movement';
import { isNodeUnlocked } from '../domain/state';
import type { Edge } from '../../shared/types/graph';
import type { VillageNode, VillageState } from '../../shared/types/village';

type BoardPosition = Pick<VillageNode, 'x' | 'y'>;

function positionFor(node: VillageNode): BoardPosition {
  return { x: node.x, y: node.y };
}

function lineFor(edge: Edge, className: string): string {
  const fromNode = villageNodes[edge.from];
  const toNode = villageNodes[edge.to];
  if (!fromNode || !toNode) return '';

  const from = positionFor(fromNode);
  const to = positionFor(toNode);
  return `<line class="${className}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
}

export function renderPaths(pathsHost: SVGElement, state: VillageState): void {
  const lines = visibleEdges(state).map((edge) => {
    const isLit = isNodeUnlocked(state, edge.from) && isNodeUnlocked(state, edge.to);
    const classes = [
      'village-path',
      isLit ? 'is-lit' : '',
      isLastMovePath(edge, state.lastMove) ? 'is-last-move' : ''
    ].filter(Boolean).join(' ');

    return lineFor(edge, classes);
  });

  if (state.lastMove && shouldRenderDirectLastMove(state)) {
    lines.push(lineFor(state.lastMove, 'village-path is-lit is-last-move is-last-move-direct'));
  }

  pathsHost.innerHTML = lines.join('');
}

export function renderNodes(nodesHost: HTMLElement, state: VillageState): void {
  const moving = Boolean(state.movingToNodeId);

  nodesHost.innerHTML = Object.values(villageNodes).filter((node) => {
    return !node.hidden || state.backAlleyDiscovered;
  }).map((node) => {
    const unlocked = isNodeUnlocked(state, node.id);
    const visited = state.visited.includes(node.id);
    const current = state.playerNodeId === node.id;
    const movingTarget = state.movingToNodeId === node.id;
    const position = positionFor(node);
    const classes = [
      'village-node',
      unlocked ? 'is-unlocked' : '',
      visited ? 'is-visited' : '',
      current ? 'is-current' : '',
      movingTarget ? 'is-moving-target' : '',
      node.gate ? 'is-gate' : ''
    ].filter(Boolean).join(' ');
    const disabled = moving || !unlocked ? 'disabled' : '';

    return `<button class="${classes}" type="button" style="--x:${position.x};--y:${position.y}" data-node-id="${node.id}" ${disabled}>${node.label}</button>`;
  }).join('');
}

export function renderToken(token: HTMLElement, state: VillageState): void {
  const targetId = state.movingToNodeId || state.playerNodeId;
  const targetNode = villageNodes[targetId] || villageNodes.room;
  const position = positionFor(targetNode);

  token.style.setProperty('--x', String(position.x));
  token.style.setProperty('--y', String(position.y));
  token.classList.toggle('is-moving', Boolean(state.movingToNodeId));
}
