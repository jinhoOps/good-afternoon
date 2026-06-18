import { villageNodes } from './data';
import { answerCyanLoop, countVisitedPublicPlaces, enterGate, isNodeUnlocked, visitNode } from './rules';
import {
  completeMove,
  hasVisiblePathForMove,
  isLastMovePath,
  shouldRenderDirectLastMove,
  startMove,
  visibleEdges
} from './movement';
import { readStorage, removeStorage, type StorageLike, writeStorage } from '../../shared/storage/local-storage';
import type { CurrentStage, CyanLoopResult, VillageState } from '../../shared/types/village';

export const STORAGE_KEY = 'goodafternoon.preCyanVillage.v1';

const VALID_STAGES: CurrentStage[] = ['preCyan', 'cyanIntro', 'cyanLoop'];
const VALID_RESULTS: Exclude<CyanLoopResult, null>[] = ['success', 'failure'];

export function createInitialState(): VillageState {
  return {
    unlocked: ['room', 'store', 'bus'],
    visited: ['room'],
    log: '나가기 전에 하나만 챙기면 된다.',
    cyanGateUnlocked: false,
    lotterySeen: false,
    backAlleyDiscovered: false,
    backAlleyEntered: false,
    firstAchievementShown: false,
    playerNodeId: 'room',
    movingToNodeId: null,
    lastMove: null,
    currentStage: 'preCyan',
    cyanLoopSeen: false,
    cyanLoopCompleted: false,
    cyanLoopResult: null
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeUnique(base: string[], extra: string[]): string[] {
  return [...new Set([...base, ...extra])];
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeStage(value: unknown): CurrentStage | null {
  return typeof value === 'string' && VALID_STAGES.includes(value as CurrentStage)
    ? value as CurrentStage
    : null;
}

function normalizeResult(value: unknown): Exclude<CyanLoopResult, null> | null {
  return typeof value === 'string' && VALID_RESULTS.includes(value as Exclude<CyanLoopResult, null>)
    ? value as Exclude<CyanLoopResult, null>
    : null;
}

function getBrowserStorage(): StorageLike | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function normalizeState(parsed: unknown): VillageState {
  const base = createInitialState();
  if (!isRecord(parsed)) return base;

  const unlocked = stringArray(parsed.unlocked);
  const visited = stringArray(parsed.visited);
  const validPlayerNodeId = typeof parsed.playerNodeId === 'string' && villageNodes[parsed.playerNodeId]
    ? parsed.playerNodeId
    : null;
  const validCurrentStage = normalizeStage(parsed.currentStage);
  const reachedCyanGateInOldSave = parsed.firstAchievementShown === true && parsed.cyanGateUnlocked === true;
  const migratedCurrentStage = reachedCyanGateInOldSave
    && (!validCurrentStage || validCurrentStage === base.currentStage)
    ? 'cyanLoop'
    : validCurrentStage ?? base.currentStage;
  const validLastMove = isRecord(parsed.lastMove)
    && typeof parsed.lastMove.from === 'string'
    && typeof parsed.lastMove.to === 'string'
    && villageNodes[parsed.lastMove.from]
    && villageNodes[parsed.lastMove.to]
    ? { from: parsed.lastMove.from, to: parsed.lastMove.to }
    : base.lastMove;

  return {
    unlocked: unlocked ? mergeUnique(base.unlocked, unlocked) : base.unlocked,
    visited: visited ? mergeUnique(base.visited, visited) : base.visited,
    log: typeof parsed.log === 'string' ? parsed.log : base.log,
    cyanGateUnlocked: parsed.cyanGateUnlocked === true,
    lotterySeen: parsed.lotterySeen === true,
    backAlleyDiscovered: parsed.backAlleyDiscovered === true,
    backAlleyEntered: parsed.backAlleyEntered === true,
    firstAchievementShown: parsed.firstAchievementShown === true,
    playerNodeId: reachedCyanGateInOldSave && (!validPlayerNodeId || validPlayerNodeId === base.playerNodeId)
      ? 'cyanGate'
      : validPlayerNodeId ?? base.playerNodeId,
    movingToNodeId: null,
    lastMove: validLastMove,
    currentStage: migratedCurrentStage,
    cyanLoopSeen: reachedCyanGateInOldSave ? true : parsed.cyanLoopSeen === true,
    cyanLoopCompleted: parsed.cyanLoopCompleted === true,
    cyanLoopResult: normalizeResult(parsed.cyanLoopResult)
  };
}

export function loadState(storage?: StorageLike): VillageState {
  const activeStorage = storage ?? getBrowserStorage();
  if (!activeStorage) return createInitialState();

  try {
    const saved = readStorage(activeStorage, STORAGE_KEY);
    if (!saved) return createInitialState();
    return normalizeState(JSON.parse(saved));
  } catch {
    return createInitialState();
  }
}

export function saveState(storage: StorageLike, state: VillageState): VillageState {
  writeStorage(storage, STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function resetState(storage?: StorageLike): VillageState {
  const activeStorage = storage ?? getBrowserStorage();
  if (activeStorage) {
    removeStorage(activeStorage, STORAGE_KEY);
  }

  return createInitialState();
}

export {
  answerCyanLoop,
  completeMove,
  countVisitedPublicPlaces,
  enterGate,
  hasVisiblePathForMove,
  isLastMovePath,
  isNodeUnlocked,
  shouldRenderDirectLastMove,
  startMove,
  visibleEdges,
  visitNode
};
