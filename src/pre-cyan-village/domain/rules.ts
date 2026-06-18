import { cyanFirstLoop, villageNodes } from './data';
import type { NodeId } from '../../shared/types/graph';
import type { VillageState } from '../../shared/types/village';

export function isNodeUnlocked(state: VillageState, id: NodeId): boolean {
  if (id === 'cyanGate') return state.cyanGateUnlocked;
  if (id === 'alley') return state.backAlleyDiscovered;
  return state.unlocked.includes(id);
}

export function countVisitedPublicPlaces(state: VillageState): number {
  return state.visited.filter((id) => {
    const node = villageNodes[id];
    return Boolean(node && !node.hidden && !node.gate);
  }).length;
}

export function visitNode(state: VillageState, id: NodeId): VillageState {
  const node = villageNodes[id];
  if (!node || !isNodeUnlocked(state, id)) return state;

  const nextState: VillageState = {
    ...state,
    unlocked: [...state.unlocked],
    visited: [...state.visited],
    log: node.log,
    playerNodeId: id,
    movingToNodeId: null
  };

  if (!nextState.visited.includes(id)) {
    nextState.visited.push(id);
  }

  node.unlocks.forEach((nextId) => {
    if (!nextState.unlocked.includes(nextId)) {
      nextState.unlocked.push(nextId);
    }
  });

  if (id === 'lottery') nextState.lotterySeen = true;
  if (nextState.lotterySeen && (id === 'bank' || id === 'store')) nextState.backAlleyDiscovered = true;
  if (id === 'alley') nextState.backAlleyEntered = true;
  if (countVisitedPublicPlaces(nextState) >= 4) nextState.cyanGateUnlocked = true;

  return nextState;
}

export function enterGate(state: VillageState): VillageState {
  if (!state.cyanGateUnlocked) return state;
  return {
    ...state,
    log: villageNodes.cyanGate?.log ?? state.log,
    firstAchievementShown: true,
    playerNodeId: 'cyanGate',
    movingToNodeId: null,
    currentStage: 'cyanLoop',
    cyanLoopSeen: true
  };
}

export function answerCyanLoop(state: VillageState, choiceId: string): VillageState {
  if (state.currentStage !== 'cyanLoop' || state.cyanLoopCompleted) return state;
  const choice = cyanFirstLoop.choices.find((item) => item.id === choiceId);
  if (!choice) return state;
  const isCorrect = choice.id === cyanFirstLoop.correctChoiceId;
  return {
    ...state,
    log: isCorrect ? cyanFirstLoop.successLog : cyanFirstLoop.failureLog,
    cyanLoopCompleted: true,
    cyanLoopResult: isCorrect ? 'success' : 'failure'
  };
}
