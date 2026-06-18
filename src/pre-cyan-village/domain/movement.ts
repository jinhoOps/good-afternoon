import { villageEdges, villageNodes } from './data';
import { enterGate, isNodeUnlocked, visitNode } from './rules';
import { isSamePath, normalizeEdge } from '../../shared/map/paths';
import type { Edge, Move, NodeId } from '../../shared/types/graph';
import type { VillageState } from '../../shared/types/village';

export function startMove(state: VillageState, destinationId: NodeId): VillageState {
  if (state.movingToNodeId) return state;
  if (state.playerNodeId === destinationId) return state;
  if (!villageNodes[destinationId] || !isNodeUnlocked(state, destinationId)) return state;
  return {
    ...state,
    movingToNodeId: destinationId,
    lastMove: {
      from: state.playerNodeId,
      to: destinationId
    }
  };
}

export function completeMove(state: VillageState): VillageState {
  if (!state.movingToNodeId) return state;
  const destinationId = state.movingToNodeId;
  if (!villageNodes[destinationId] || !isNodeUnlocked(state, destinationId)) return state;
  const arrived: VillageState = {
    ...state,
    playerNodeId: destinationId,
    movingToNodeId: null
  };
  if (destinationId === 'cyanGate') return enterGate(arrived);
  return visitNode(arrived, destinationId);
}

export function visibleEdges(state: VillageState): Edge[] {
  return villageEdges
    .map(normalizeEdge)
    .filter((edge) => !edge.hiddenUntil || Boolean(state[edge.hiddenUntil as keyof VillageState]));
}

export function hasVisiblePathForMove(state: VillageState, move: Move): boolean {
  return visibleEdges(state).some((edge) => isSamePath(edge, move));
}

export function shouldRenderDirectLastMove(state: VillageState): boolean {
  return Boolean(state.lastMove && !hasVisiblePathForMove(state, state.lastMove));
}

export function isLastMovePath(edge: Edge, move: Move | null): boolean {
  return Boolean(move && isSamePath(edge, move));
}
