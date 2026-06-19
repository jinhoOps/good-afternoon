export type StageId = 'preCyan' | 'cyanReady';

export type ScreenId = 'room' | 'villageBoard' | 'event';

export type ZoneId = 'home' | 'commercial' | 'transit' | 'work' | 'finance' | 'hidden';

export type HotspotId =
  | 'bankCounter'
  | 'storeFront'
  | 'busStop'
  | 'mailbox'
  | 'workBackDoor'
  | 'storeRegister'
  | 'bankAtm'
  | 'workBoard'
  | 'busEnd'
  | 'cyanTrace';

export type RequiredAction = 'receivedSupport' | 'spent' | 'moved' | 'earned' | 'kept';

export type ReactionKind = 'softSuccess' | 'differentDay' | 'strangeTrace';

export type RoomFeatureId = 'guideDevice' | 'firstRecord' | 'cyanTraceRecord' | 'strangeDrawer';

export type HotspotDefinition = {
  id: HotspotId;
  zoneId: ZoneId;
  label: string;
  shortLabel: string;
};

export type OutingDefinition = {
  id: string;
  title: string;
  guideLine: string;
  hotspotIds: HotspotId[];
};

export type ReactionResult = {
  id: string;
  hotspotId: HotspotId;
  kind: ReactionKind;
  log: string;
  actionsGained: RequiredAction[];
  flagsGained: string[];
};

export type OutingRecord = {
  stage: StageId;
  outingId: string;
  selections: HotspotId[];
  summary: string;
  flagsGained: string[];
  reactionsSeen: string[];
};

export type MoneyFeverState = {
  activeUntil: number | null;
  triggeredEver: boolean;
  triggerCountWindowStartedAt: number | null;
  triggerCount: number;
};

export type VillageState = {
  screen: ScreenId;
  stage: StageId;
  log: string;
  guideLine: string;
  currentOutingId: string | null;
  currentOutingSelections: HotspotId[];
  outingHistory: OutingRecord[];
  completedActions: RequiredAction[];
  sequenceFlags: Record<string, boolean>;
  reactionsSeen: string[];
  zoneLayers: Record<ZoneId, number>;
  roomFeatures: Record<RoomFeatureId, boolean>;
  bankSupportReceived: boolean;
  cyanTraceDiscovered: boolean;
  cyanGateUnlocked: boolean;
  moneyFever: MoneyFeverState;
  alley: {
    discoveredHint: boolean;
    unlockedAfterYellow: boolean;
  };
  pendingReaction: ReactionResult | null;
  outingCount: number;
};
