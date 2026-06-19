import { readStorage, removeStorage, type StorageLike, writeStorage } from '../../shared/storage/local-storage';
import type {
  HotspotId,
  RequiredAction,
  RoomFeatureId,
  ScreenId,
  StageId,
  VillageState,
  ZoneId
} from '../../shared/types/village';
import { recordMoneyFeverClick, selectHotspot, startOuting } from './outing';

export const STORAGE_KEY = 'goodafternoon.preCyanVillage.v2';

const VALID_SCREENS: ScreenId[] = ['room', 'villageBoard', 'event'];
const VALID_STAGES: StageId[] = ['preCyan', 'cyanReady'];
const VALID_ACTIONS: RequiredAction[] = ['receivedSupport', 'spent', 'moved', 'earned', 'kept'];
const VALID_ZONES: ZoneId[] = ['home', 'commercial', 'transit', 'work', 'finance', 'hidden'];
const VALID_ROOM_FEATURES: RoomFeatureId[] = ['guideDevice', 'firstRecord', 'cyanTraceRecord', 'strangeDrawer'];

export function createInitialState(): VillageState {
  return {
    screen: 'room',
    stage: 'preCyan',
    log: '문은 열려 있어.',
    guideLine: '다녀올래?',
    currentOutingId: null,
    currentOutingSelections: [],
    outingHistory: [],
    completedActions: [],
    sequenceFlags: {},
    reactionsSeen: [],
    zoneLayers: {
      home: 1,
      commercial: 0,
      transit: 0,
      work: 0,
      finance: 0,
      hidden: 0
    },
    roomFeatures: {
      guideDevice: true,
      firstRecord: false,
      cyanTraceRecord: false,
      strangeDrawer: false
    },
    bankSupportReceived: false,
    cyanTraceDiscovered: false,
    cyanGateUnlocked: false,
    moneyFever: {
      activeUntil: null,
      triggeredEver: false,
      triggerCountWindowStartedAt: null,
      triggerCount: 0
    },
    alley: {
      discoveredHint: false,
      unlockedAfterYellow: false
    },
    pendingReaction: null,
    outingCount: 0
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function validArray<T extends string>(items: string[], valid: T[]): T[] {
  return items.filter((item): item is T => valid.includes(item as T));
}

function booleanRecord<T extends string>(value: unknown, keys: T[], defaults: Record<T, boolean>): Record<T, boolean> {
  if (!isRecord(value)) return defaults;
  return keys.reduce<Record<T, boolean>>((result, key) => {
    result[key] = value[key] === true || defaults[key];
    return result;
  }, { ...defaults });
}

function zoneLayerRecord(value: unknown, defaults: Record<ZoneId, number>): Record<ZoneId, number> {
  if (!isRecord(value)) return defaults;
  return VALID_ZONES.reduce<Record<ZoneId, number>>((result, zone) => {
    const layer = value[zone];
    result[zone] = typeof layer === 'number' && Number.isFinite(layer) && layer >= 0 ? Math.floor(layer) : defaults[zone];
    return result;
  }, { ...defaults });
}

function trueBooleanRecord(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};
  return Object.entries(value).reduce<Record<string, boolean>>((result, [key, recordValue]) => {
    if (recordValue === true) result[key] = true;
    return result;
  }, {});
}

function getBrowserStorage(): StorageLike | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function normalizeState(parsed: unknown): VillageState {
  const base = createInitialState();
  if (!isRecord(parsed)) return base;

  const screen = typeof parsed.screen === 'string' && VALID_SCREENS.includes(parsed.screen as ScreenId)
    ? parsed.screen as ScreenId
    : base.screen;
  const stage = typeof parsed.stage === 'string' && VALID_STAGES.includes(parsed.stage as StageId)
    ? parsed.stage as StageId
    : base.stage;
  const completedActions = validArray(stringArray(parsed.completedActions), VALID_ACTIONS);

  return {
    ...base,
    screen,
    stage,
    log: typeof parsed.log === 'string' ? parsed.log : base.log,
    guideLine: typeof parsed.guideLine === 'string' ? parsed.guideLine : base.guideLine,
    currentOutingId: typeof parsed.currentOutingId === 'string' ? parsed.currentOutingId : null,
    currentOutingSelections: stringArray(parsed.currentOutingSelections) as HotspotId[],
    outingHistory: Array.isArray(parsed.outingHistory) ? parsed.outingHistory as VillageState['outingHistory'] : [],
    completedActions,
    sequenceFlags: trueBooleanRecord(parsed.sequenceFlags),
    reactionsSeen: stringArray(parsed.reactionsSeen),
    zoneLayers: zoneLayerRecord(parsed.zoneLayers, base.zoneLayers),
    roomFeatures: booleanRecord(parsed.roomFeatures, VALID_ROOM_FEATURES, base.roomFeatures),
    bankSupportReceived: parsed.bankSupportReceived === true || completedActions.includes('receivedSupport'),
    cyanTraceDiscovered: parsed.cyanTraceDiscovered === true,
    cyanGateUnlocked: parsed.cyanGateUnlocked === true,
    moneyFever: isRecord(parsed.moneyFever)
      ? {
        activeUntil: typeof parsed.moneyFever.activeUntil === 'number' ? parsed.moneyFever.activeUntil : null,
        triggeredEver: parsed.moneyFever.triggeredEver === true,
        triggerCountWindowStartedAt: typeof parsed.moneyFever.triggerCountWindowStartedAt === 'number'
          ? parsed.moneyFever.triggerCountWindowStartedAt
          : null,
        triggerCount: typeof parsed.moneyFever.triggerCount === 'number' ? parsed.moneyFever.triggerCount : 0
      }
      : base.moneyFever,
    alley: isRecord(parsed.alley)
      ? {
        discoveredHint: parsed.alley.discoveredHint === true,
        unlockedAfterYellow: parsed.alley.unlockedAfterYellow === true
      }
      : base.alley,
    pendingReaction: null,
    outingCount: typeof parsed.outingCount === 'number' && parsed.outingCount >= 0 ? Math.floor(parsed.outingCount) : base.outingCount
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
  if (activeStorage) removeStorage(activeStorage, STORAGE_KEY);
  return createInitialState();
}

export {
  recordMoneyFeverClick,
  selectHotspot,
  startOuting
};
