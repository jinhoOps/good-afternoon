import type { GridPosition, Move, NodeId } from './graph';

export type VillageNodeKind = 'home' | 'place' | 'gate' | 'hidden';

export type VillageNode = {
  id: NodeId;
  label: string;
  log: string;
  x: number;
  y: number;
  grid: GridPosition;
  kind: VillageNodeKind;
  unlocks: NodeId[];
  hidden?: boolean;
  gate?: boolean;
  startsUnlocked?: boolean;
};

export type CyanChoice = {
  id: string;
  label: string;
};

export type CyanLoop = {
  id: string;
  situation: string;
  question: string;
  correctChoiceId: string;
  successLog: string;
  failureLog: string;
  choices: CyanChoice[];
};

export type CurrentStage = 'preCyan' | 'cyanIntro' | 'cyanLoop';

export type CyanLoopResult = 'success' | 'failure' | null;

export type VillageState = {
  unlocked: NodeId[];
  visited: NodeId[];
  log: string;
  cyanGateUnlocked: boolean;
  lotterySeen: boolean;
  backAlleyDiscovered: boolean;
  backAlleyEntered: boolean;
  firstAchievementShown: boolean;
  playerNodeId: NodeId;
  movingToNodeId: NodeId | null;
  lastMove: Move | null;
  currentStage: CurrentStage;
  cyanLoopSeen: boolean;
  cyanLoopCompleted: boolean;
  cyanLoopResult: CyanLoopResult;
};
