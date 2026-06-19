# Pre-Cyan Outing Level Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Pre-Cyan node-visit loop with a 3-choice outing sequence loop that supports the approved 10-minute level design.

**Architecture:** Keep the Vite + TypeScript single app in `src/pre-cyan-village/`, but shift domain state from node movement to room/board/outing sequencing. The implementation should be data-driven: outings, hotspots, reactions, and completion flags live in focused domain modules, while rendering and events only call domain functions and repaint state.

**Tech Stack:** Vite, TypeScript, Node test runner via `tsx --test`, localStorage wrapper in `src/shared/storage/local-storage.ts`, plain DOM rendering.

---

## Scope

This plan implements the Pre-Cyan MVP only:

- `내 방` start/return screen
- village board with outing slots
- 3 planned outings with 4 choices each and 3 selections per outing
- 4+ recovery outings when required actions are missing
- required action completion for `receivedSupport`, `spent`, `moved`, `earned`, `kept`
- Cyan entrance trace opening only when all required actions are complete
- `돈독` trigger state and persistence, without opening the back alley in Pre-Cyan
- reset, persistence, corrupt save recovery

This plan does not implement Cyan/Magenta/Yellow/K gameplay beyond marking the Pre-Cyan gate open.

## File Structure

- Modify: `src/shared/types/village.ts`
  - Replace node movement-centric types with outing-centric state and data types.
- Modify: `src/pre-cyan-village/domain/data.ts`
  - Replace node/edge data with zones, room guide copy, planned outings, recovery outing factory inputs, and hotspot definitions.
- Create: `src/pre-cyan-village/domain/outing.ts`
  - Pure domain functions for starting an outing, selecting hotspots, applying reactions, completing outings, recovery outing selection, money fever clicks, and Cyan trace checks.
- Modify: `src/pre-cyan-village/domain/state.ts`
  - Create, normalize, load, save, reset outing state; re-export domain functions from `outing.ts`.
- Modify: `src/pre-cyan-village/view/render.ts`
  - Query new DOM hosts and render room/board/event/archive state.
- Replace: `src/pre-cyan-village/view/board-view.ts`
  - Render zone panels, hotspot buttons, outing slots, status chips.
- Modify: `src/pre-cyan-village/view/events.ts`
  - Wire room start, hotspot select, event continue, reset. Remove movement fallback logic.
- Modify: `src/pre-cyan-village/index.html`
  - Replace token/path markup with room, board, event, and status hosts.
- Modify: `src/pre-cyan-village/styles.css`
  - Replace node-map styling with room/board/outing styling while keeping warm cream visual tokens.
- Replace: `src/pre-cyan-village/tests/state.test.ts`
  - Test initial state, persistence normalization, outing choices, required actions, recovery outings, money fever, Cyan trace.
- Modify: `src/pre-cyan-village/tests/static-contract.test.ts`
  - Update static selectors and banned string tests for new DOM.
- Keep: `src/pre-cyan-village/tests/movement.test.ts`
  - Shared map tests can remain for shared helpers even if Pre-Cyan no longer uses movement.
- Modify: `README.md`
  - Update current implementation description from token movement to outing sequence loop.

---

### Task 1: Define Outing Types

**Files:**
- Modify: `src/shared/types/village.ts`
- Test: `src/pre-cyan-village/tests/state.test.ts`

- [ ] **Step 1: Replace shared village types with outing types**

Replace `src/shared/types/village.ts` with:

```ts
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
```

- [ ] **Step 2: Run the typecheck to see current compile failures**

Run: `npm run build`

Expected: FAIL with TypeScript errors in current Pre-Cyan modules that still reference removed fields such as `unlocked`, `visited`, `playerNodeId`, or `currentStage`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/types/village.ts
git commit -m "refactor: define pre-cyan outing state types"
```

---

### Task 2: Add Outing Data

**Files:**
- Modify: `src/pre-cyan-village/domain/data.ts`
- Test: `src/pre-cyan-village/tests/state.test.ts`

- [ ] **Step 1: Replace domain data with outing definitions**

Replace `src/pre-cyan-village/domain/data.ts` with:

```ts
import type { HotspotDefinition, HotspotId, OutingDefinition, RequiredAction, ZoneId } from '../../shared/types/village';

export const requiredActions: RequiredAction[] = ['receivedSupport', 'spent', 'moved', 'earned', 'kept'];

export const zones: Record<ZoneId, { id: ZoneId; label: string; description: string }> = {
  home: { id: 'home', label: '주거구역', description: '방으로 돌아가는 길이 여기서 시작된다.' },
  commercial: { id: 'commercial', label: '상업구역', description: '불빛과 가격표가 먼저 보인다.' },
  transit: { id: 'transit', label: '이동구역', description: '기다리는 사람과 막차 표시가 있다.' },
  work: { id: 'work', label: '업무구역', description: '닫힌 뒷문 옆에 종이가 붙어 있다.' },
  finance: { id: 'finance', label: '금융구역', description: '은행 창구와 ATM 불빛이 보인다.' },
  hidden: { id: 'hidden', label: '어두운 틈', description: '아직 길이라고 부르기엔 애매하다.' }
};

export const hotspots: Record<HotspotId, HotspotDefinition> = {
  bankCounter: { id: 'bankCounter', zoneId: 'finance', label: '은행 창구', shortLabel: '창구' },
  storeFront: { id: 'storeFront', zoneId: 'commercial', label: '편의점 앞', shortLabel: '편의점' },
  busStop: { id: 'busStop', zoneId: 'transit', label: '버스정류장', shortLabel: '정류장' },
  mailbox: { id: 'mailbox', zoneId: 'home', label: '내 방 우편함', shortLabel: '우편함' },
  workBackDoor: { id: 'workBackDoor', zoneId: 'work', label: '알바처 뒷문', shortLabel: '뒷문' },
  storeRegister: { id: 'storeRegister', zoneId: 'commercial', label: '편의점 계산대', shortLabel: '계산대' },
  bankAtm: { id: 'bankAtm', zoneId: 'finance', label: '은행 ATM', shortLabel: 'ATM' },
  workBoard: { id: 'workBoard', zoneId: 'work', label: '알바처 게시판', shortLabel: '게시판' },
  busEnd: { id: 'busEnd', zoneId: 'transit', label: '버스정류장 끝', shortLabel: '정류장 끝' },
  cyanTrace: { id: 'cyanTrace', zoneId: 'transit', label: 'Cyan 입구 흔적', shortLabel: '입구 흔적' }
};

export const plannedOutings: OutingDefinition[] = [
  {
    id: 'settling',
    title: '첫 외출',
    guideLine: '처음이면 은행 쪽이 덜 헤매.',
    hotspotIds: ['bankCounter', 'storeFront', 'busStop', 'mailbox']
  },
  {
    id: 'daily-loop',
    title: '생활 실험',
    guideLine: '오늘은 돈이 오가고 남는 걸 보면 돼.',
    hotspotIds: ['workBackDoor', 'storeRegister', 'busStop', 'bankAtm']
  },
  {
    id: 'trace-check',
    title: '정리',
    guideLine: '길 끝에 이상한 색이 조금 보여.',
    hotspotIds: ['bankAtm', 'workBoard', 'busEnd', 'cyanTrace']
  }
];

export function outingById(id: string): OutingDefinition | null {
  return plannedOutings.find((outing) => outing.id === id) ?? null;
}

export function nextPlannedOutingId(outingCount: number): string {
  return plannedOutings[Math.min(outingCount, plannedOutings.length - 1)].id;
}
```

- [ ] **Step 2: Add a failing data integrity test**

Add this test to `src/pre-cyan-village/tests/state.test.ts` after imports are updated in later tasks:

```ts
test('outing data references known hotspots and has four choices per outing', () => {
  for (const outing of plannedOutings) {
    assert.equal(outing.hotspotIds.length, 4);
    outing.hotspotIds.forEach((hotspotId) => {
      assert.ok(hotspots[hotspotId], `${outing.id} references unknown hotspot ${hotspotId}`);
    });
  }
});
```

Expected now: the test file will not compile until Task 3 rewrites imports and state tests.

- [ ] **Step 3: Commit**

```bash
git add src/pre-cyan-village/domain/data.ts src/pre-cyan-village/tests/state.test.ts
git commit -m "feat: add pre-cyan outing data"
```

---

### Task 3: Implement Pure Outing Domain

**Files:**
- Create: `src/pre-cyan-village/domain/outing.ts`
- Modify: `src/pre-cyan-village/domain/state.ts`
- Test: `src/pre-cyan-village/tests/state.test.ts`

- [ ] **Step 1: Replace state tests with outing behavior tests**

Replace `src/pre-cyan-village/tests/state.test.ts` with:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialState,
  loadState,
  normalizeState,
  recordMoneyFeverClick,
  resetState,
  saveState,
  selectHotspot,
  startOuting,
  STORAGE_KEY
} from '../domain/state';
import { hotspots, plannedOutings, requiredActions } from '../domain/data';
import type { StorageLike } from '../../shared/storage/local-storage';
import type { HotspotId } from '../../shared/types/village';

function createStorage(seed: Record<string, string> = {}): StorageLike {
  const store = { ...seed };
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] ?? null : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    }
  };
}

test('initial state starts in room with guide device only', () => {
  const state = createInitialState();
  assert.equal(state.screen, 'room');
  assert.equal(state.stage, 'preCyan');
  assert.equal(state.currentOutingId, null);
  assert.deepEqual(state.completedActions, []);
  assert.equal(state.roomFeatures.guideDevice, true);
  assert.equal(state.cyanGateUnlocked, false);
});

test('outing data references known hotspots and has four choices per outing', () => {
  for (const outing of plannedOutings) {
    assert.equal(outing.hotspotIds.length, 4);
    outing.hotspotIds.forEach((hotspotId) => {
      assert.ok(hotspots[hotspotId], `${outing.id} references unknown hotspot ${hotspotId}`);
    });
  }
});

test('startOuting opens the first planned outing', () => {
  const state = startOuting(createInitialState());
  assert.equal(state.screen, 'villageBoard');
  assert.equal(state.currentOutingId, 'settling');
  assert.deepEqual(state.currentOutingSelections, []);
  assert.equal(state.guideLine, '처음이면 은행 쪽이 덜 헤매.');
});

test('first optimal outing gains support spend and move actions', () => {
  let state = startOuting(createInitialState());
  state = selectHotspot(state, 'bankCounter');
  assert.deepEqual(state.completedActions, ['receivedSupport']);
  state = selectHotspot(state, 'storeFront');
  assert.ok(state.completedActions.includes('spent'));
  state = selectHotspot(state, 'busStop');
  assert.equal(state.screen, 'room');
  assert.equal(state.outingHistory.length, 1);
  assert.ok(state.completedActions.includes('moved'));
});

test('same hotspot reacts differently before support', () => {
  let state = startOuting(createInitialState());
  state = selectHotspot(state, 'storeFront');
  assert.equal(state.completedActions.includes('spent'), false);
  assert.equal(state.pendingReaction?.kind, 'differentDay');
  assert.match(state.log, /빈손/);
});

test('three optimal outings unlock Cyan trace after all required actions', () => {
  let state = startOuting(createInitialState());
  for (const hotspot of ['bankCounter', 'storeFront', 'busStop'] as HotspotId[]) {
    state = selectHotspot(state, hotspot);
  }
  state = startOuting(state);
  for (const hotspot of ['workBackDoor', 'storeRegister', 'bankAtm'] as HotspotId[]) {
    state = selectHotspot(state, hotspot);
  }
  state = startOuting(state);
  for (const hotspot of ['bankAtm', 'busEnd', 'cyanTrace'] as HotspotId[]) {
    state = selectHotspot(state, hotspot);
  }

  assert.deepEqual([...state.completedActions].sort(), [...requiredActions].sort());
  assert.equal(state.cyanGateUnlocked, true);
  assert.equal(state.stage, 'cyanReady');
  assert.equal(state.roomFeatures.firstRecord, true);
});

test('Cyan trace stays faint until every required action is complete', () => {
  let state = startOuting(createInitialState());
  state = selectHotspot(state, 'bankCounter');
  state = selectHotspot(state, 'mailbox');
  state = selectHotspot(state, 'cyanTrace');
  assert.equal(state.cyanGateUnlocked, false);
  assert.match(state.log, /흐릿/);
});

test('recovery outing emphasizes missing actions', () => {
  const state = startOuting({
    ...createInitialState(),
    completedActions: ['receivedSupport', 'spent', 'moved', 'earned'],
    outingCount: 3
  });
  assert.equal(state.currentOutingId, 'recovery-kept');
});

test('money fever triggers after ten finance clicks without opening alley', () => {
  let state = startOuting(createInitialState());
  for (let index = 0; index < 10; index += 1) {
    state = recordMoneyFeverClick(state, 1000 + index * 100);
  }
  assert.equal(state.moneyFever.triggeredEver, true);
  assert.equal(state.alley.discoveredHint, true);
  assert.equal(state.alley.unlockedAfterYellow, false);
});

test('loadState recovers corrupt or old data safely', () => {
  const storage = createStorage({ [STORAGE_KEY]: '{"visited":["room"]}' });
  const loaded = loadState(storage);
  assert.equal(loaded.screen, 'room');
  assert.equal(loaded.currentOutingSelections.length, 0);
  assert.equal(loaded.cyanGateUnlocked, false);
});

test('saveState and resetState use provided storage', () => {
  const storage = createStorage();
  const saved = saveState(storage, createInitialState());
  assert.equal(storage.getItem(STORAGE_KEY), JSON.stringify(saved));
  const reset = resetState(storage);
  assert.deepEqual(reset, createInitialState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('normalizeState recovers from non-object input', () => {
  assert.deepEqual(normalizeState(null), createInitialState());
});
```

- [ ] **Step 2: Run tests to verify failures**

Run: `npm test`

Expected: FAIL because `selectHotspot`, `startOuting`, `recordMoneyFeverClick`, and new state fields are not implemented yet.

- [ ] **Step 3: Add pure outing implementation**

Create `src/pre-cyan-village/domain/outing.ts`:

```ts
import { nextPlannedOutingId, outingById, requiredActions } from './data';
import type { HotspotId, ReactionResult, RequiredAction, VillageState } from '../../shared/types/village';

const MAX_SELECTIONS = 3;
const MONEY_FEVER_WINDOW_MS = 2000;
const MONEY_FEVER_DURATION_MS = 60_000;

function uniqueActions(actions: RequiredAction[], gained: RequiredAction[]): RequiredAction[] {
  return [...new Set([...actions, ...gained])];
}

function hasAction(state: VillageState, action: RequiredAction): boolean {
  return state.completedActions.includes(action);
}

function allRequiredActionsComplete(state: VillageState): boolean {
  return requiredActions.every((action) => state.completedActions.includes(action));
}

function missingActions(state: VillageState): RequiredAction[] {
  return requiredActions.filter((action) => !state.completedActions.includes(action));
}

function recoveryOutingId(state: VillageState): string {
  const missing = missingActions(state)[0];
  return missing ? `recovery-${missing}` : 'trace-check';
}

function hotspotIdsForRecovery(state: VillageState): HotspotId[] {
  const missing = missingActions(state);
  const ids: HotspotId[] = [];
  if (missing.includes('receivedSupport')) ids.push('bankCounter');
  if (missing.includes('spent')) ids.push('storeRegister');
  if (missing.includes('moved')) ids.push('busEnd');
  if (missing.includes('earned')) ids.push('workBoard');
  if (missing.includes('kept')) ids.push('bankAtm');
  return [...new Set([...ids, 'cyanTrace', 'busEnd', 'bankAtm'])].slice(0, 4);
}

export function activeHotspotIds(state: VillageState): HotspotId[] {
  if (state.currentOutingId?.startsWith('recovery-')) {
    return hotspotIdsForRecovery(state);
  }
  const outing = state.currentOutingId ? outingById(state.currentOutingId) : null;
  return outing?.hotspotIds ?? [];
}

function reactionFor(state: VillageState, hotspotId: HotspotId): ReactionResult {
  const selected = state.currentOutingSelections;
  const hasSupport = hasAction(state, 'receivedSupport') || selected.includes('bankCounter');
  const hasEarned = hasAction(state, 'earned') || selected.includes('workBackDoor') || selected.includes('workBoard');

  if (hotspotId === 'bankCounter') {
    return {
      id: 'bank-counter-support',
      hotspotId,
      kind: 'softSuccess',
      log: '처음 온 사람한텐 이 정도는 괜찮대.',
      actionsGained: ['receivedSupport'],
      flagsGained: ['supportEnvelope']
    };
  }

  if (hotspotId === 'storeFront' || hotspotId === 'storeRegister') {
    return hasSupport || hasEarned
      ? {
        id: `${hotspotId}-spent`,
        hotspotId,
        kind: 'softSuccess',
        log: '봉투가 조금 가벼워졌다.',
        actionsGained: ['spent'],
        flagsGained: ['spentSmall']
      }
      : {
        id: `${hotspotId}-empty`,
        hotspotId,
        kind: 'differentDay',
        log: '빈손으로 가격표만 보고 나왔다.',
        actionsGained: [],
        flagsGained: ['sawPriceWithoutMoney']
      };
  }

  if (hotspotId === 'busStop' || hotspotId === 'busEnd') {
    return {
      id: `${hotspotId}-moved`,
      hotspotId,
      kind: 'softSuccess',
      log: '정류장 끝에서 길이 조금 이어졌다.',
      actionsGained: ['moved'],
      flagsGained: ['foundTransitPath']
    };
  }

  if (hotspotId === 'workBackDoor' || hotspotId === 'workBoard') {
    return selected.includes('busStop') || selected.includes('busEnd')
      ? {
        id: `${hotspotId}-late`,
        hotspotId,
        kind: 'differentDay',
        log: '조금 늦었지만, 게시판 메모는 봤다.',
        actionsGained: ['earned'],
        flagsGained: ['lateWorkNote']
      }
      : {
        id: `${hotspotId}-earned`,
        hotspotId,
        kind: 'softSuccess',
        log: '짧은 일을 돕고 봉투가 조금 묵직해졌다.',
        actionsGained: ['earned'],
        flagsGained: ['earnedSmall']
      };
  }

  if (hotspotId === 'bankAtm') {
    return hasEarned || hasSupport
      ? {
        id: 'bank-atm-kept',
        hotspotId,
        kind: 'softSuccess',
        log: '조금 남겨두는 칸이 생겼다.',
        actionsGained: ['kept'],
        flagsGained: ['keptSmall']
      }
      : {
        id: 'bank-atm-empty',
        hotspotId,
        kind: 'differentDay',
        log: '기계 불빛만 조용히 켜져 있다.',
        actionsGained: [],
        flagsGained: ['sawAtmEmpty']
      };
  }

  if (hotspotId === 'mailbox') {
    return {
      id: 'mailbox-hint',
      hotspotId,
      kind: 'differentDay',
      log: '방으로 돌아오면 적어둘 만한 종이가 있다.',
      actionsGained: [],
      flagsGained: ['mailboxHint']
    };
  }

  const ready = allRequiredActionsComplete(state);
  return ready
    ? {
      id: 'cyan-trace-open',
      hotspotId,
      kind: 'softSuccess',
      log: '길이 하나 더 생겼어.',
      actionsGained: [],
      flagsGained: ['cyanTraceOpen']
    }
    : {
      id: 'cyan-trace-faint',
      hotspotId,
      kind: 'differentDay',
      log: '길이 아직 흐릿하다.',
      actionsGained: [],
      flagsGained: ['cyanTraceFaint']
    };
}

function finishOuting(state: VillageState): VillageState {
  const summary = state.currentOutingSelections.length
    ? `${state.currentOutingSelections.join(' → ')} 순서로 다녀왔다.`
    : '오늘은 문 앞에서만 맴돌았다.';

  return {
    ...state,
    screen: 'room',
    guideLine: '방금 일은 적어뒀어.',
    log: summary,
    outingHistory: [
      ...state.outingHistory,
      {
        stage: state.stage,
        outingId: state.currentOutingId ?? 'unknown',
        selections: [...state.currentOutingSelections],
        summary,
        flagsGained: Object.keys(state.sequenceFlags),
        reactionsSeen: [...state.reactionsSeen]
      }
    ],
    currentOutingId: null,
    currentOutingSelections: [],
    roomFeatures: {
      ...state.roomFeatures,
      firstRecord: true
    },
    outingCount: state.outingCount + 1
  };
}

export function startOuting(state: VillageState): VillageState {
  if (state.screen !== 'room') return state;
  const outingId = state.outingCount >= 3 && !allRequiredActionsComplete(state)
    ? recoveryOutingId(state)
    : nextPlannedOutingId(state.outingCount);
  const outing = outingById(outingId);

  return {
    ...state,
    screen: 'villageBoard',
    currentOutingId: outingId,
    currentOutingSelections: [],
    pendingReaction: null,
    guideLine: outing?.guideLine ?? '오늘 못 본 길이 하나 남았네.',
    log: outing?.title ?? '다른 하루'
  };
}

export function selectHotspot(state: VillageState, hotspotId: HotspotId): VillageState {
  if (state.screen !== 'villageBoard') return state;
  if (state.currentOutingSelections.length >= MAX_SELECTIONS) return state;
  if (!activeHotspotIds(state).includes(hotspotId)) return state;
  if (state.currentOutingSelections.includes(hotspotId)) return state;

  const reaction = reactionFor(state, hotspotId);
  const completedActions = uniqueActions(state.completedActions, reaction.actionsGained);
  const sequenceFlags = reaction.flagsGained.reduce<Record<string, boolean>>((flags, flag) => {
    return { ...flags, [flag]: true };
  }, state.sequenceFlags);
  const readyForCyan = hotspotId === 'cyanTrace'
    && requiredActions.every((action) => completedActions.includes(action));
  const nextState: VillageState = {
    ...state,
    log: reaction.log,
    pendingReaction: reaction,
    currentOutingSelections: [...state.currentOutingSelections, hotspotId],
    completedActions,
    sequenceFlags,
    reactionsSeen: [...new Set([...state.reactionsSeen, reaction.id])],
    bankSupportReceived: completedActions.includes('receivedSupport'),
    cyanTraceDiscovered: state.cyanTraceDiscovered || hotspotId === 'cyanTrace',
    cyanGateUnlocked: state.cyanGateUnlocked || readyForCyan,
    stage: state.stage === 'preCyan' && readyForCyan ? 'cyanReady' : state.stage,
    roomFeatures: readyForCyan
      ? { ...state.roomFeatures, cyanTraceRecord: true }
      : state.roomFeatures
  };

  return nextState.currentOutingSelections.length >= MAX_SELECTIONS ? finishOuting(nextState) : nextState;
}

export function recordMoneyFeverClick(state: VillageState, nowMs: number): VillageState {
  const windowStartedAt = state.moneyFever.triggerCountWindowStartedAt;
  const insideWindow = windowStartedAt !== null && nowMs - windowStartedAt <= MONEY_FEVER_WINDOW_MS;
  const triggerCount = insideWindow ? state.moneyFever.triggerCount + 1 : 1;
  const triggerCountWindowStartedAt = insideWindow ? windowStartedAt : nowMs;
  const triggered = triggerCount >= 10;

  return {
    ...state,
    log: triggered ? '골목 쪽 신호가 섞였어.' : state.log,
    moneyFever: {
      activeUntil: triggered ? nowMs + MONEY_FEVER_DURATION_MS : state.moneyFever.activeUntil,
      triggeredEver: state.moneyFever.triggeredEver || triggered,
      triggerCountWindowStartedAt,
      triggerCount
    },
    alley: {
      ...state.alley,
      discoveredHint: state.alley.discoveredHint || triggered
    },
    roomFeatures: triggered
      ? { ...state.roomFeatures, strangeDrawer: true }
      : state.roomFeatures
  };
}
```

- [ ] **Step 4: Replace state persistence module**

Replace `src/pre-cyan-village/domain/state.ts` with:

```ts
import { readStorage, removeStorage, type StorageLike, writeStorage } from '../../shared/storage/local-storage';
import type { HotspotId, RequiredAction, RoomFeatureId, ScreenId, StageId, VillageState, ZoneId } from '../../shared/types/village';
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
    sequenceFlags: isRecord(parsed.sequenceFlags) ? Object.fromEntries(Object.entries(parsed.sequenceFlags).filter(([, value]) => value === true)) : {},
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
        triggerCountWindowStartedAt: typeof parsed.moneyFever.triggerCountWindowStartedAt === 'number' ? parsed.moneyFever.triggerCountWindowStartedAt : null,
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
```

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: state tests PASS or reveal only import/static-contract failures from old DOM selectors.

- [ ] **Step 6: Commit**

```bash
git add src/pre-cyan-village/domain/outing.ts src/pre-cyan-village/domain/state.ts src/pre-cyan-village/tests/state.test.ts
git commit -m "feat: implement pre-cyan outing domain"
```

---

### Task 4: Render Room and Village Board

**Files:**
- Modify: `src/pre-cyan-village/index.html`
- Replace: `src/pre-cyan-village/view/board-view.ts`
- Modify: `src/pre-cyan-village/view/render.ts`
- Test: `src/pre-cyan-village/tests/static-contract.test.ts`

- [ ] **Step 1: Update HTML hosts**

Replace the content inside `<main class="app-shell">` in `src/pre-cyan-village/index.html` with:

```html
<header class="village-header">
  <p class="eyebrow">// Pre-Cyan</p>
  <h1>첫 방</h1>
</header>

<section class="room-screen" id="room-screen" aria-label="내 방">
  <div class="room-illustration" aria-hidden="true">
    <div class="room-window"></div>
    <div class="guide-device" id="guide-device"></div>
    <div class="room-door"></div>
  </div>
  <div class="guide-panel">
    <p class="guide-name">작은 단말</p>
    <p id="guide-line">다녀올래?</p>
  </div>
  <button type="button" class="start-outing" id="start-outing">문 열기</button>
</section>

<section class="village-board" id="village-board" aria-label="Pre-Cyan 구역 보드" hidden>
  <div class="outing-status">
    <p class="outing-title" id="outing-title"></p>
    <div class="outing-slots" id="outing-slots" aria-label="이번 외출 선택 순서"></div>
  </div>
  <div class="zone-board" id="zone-board"></div>
</section>

<section class="village-log" aria-live="polite">
  <p id="village-log-text">문은 열려 있어.</p>
</section>

<section class="reaction-panel" id="reaction-panel" hidden>
  <p class="reaction-kicker">방금 일</p>
  <p id="reaction-text"></p>
</section>

<section class="status-strip" id="status-strip" aria-label="상태"></section>

<footer class="controls">
  <button type="button" id="reset-state">초기화</button>
</footer>
```

- [ ] **Step 2: Replace board renderer**

Replace `src/pre-cyan-village/view/board-view.ts` with:

```ts
import { activeHotspotIds } from '../domain/outing';
import { hotspots, zones } from '../domain/data';
import type { HotspotId, VillageState, ZoneId } from '../../shared/types/village';

const zoneOrder: ZoneId[] = ['home', 'commercial', 'transit', 'work', 'finance', 'hidden'];

export function renderOutingSlots(host: HTMLElement, state: VillageState): void {
  const selections = state.currentOutingSelections;
  host.innerHTML = [0, 1, 2].map((index) => {
    const hotspotId = selections[index];
    const label = hotspotId ? hotspots[hotspotId]?.shortLabel ?? hotspotId : String(index + 1);
    return `<span class="outing-slot ${hotspotId ? 'is-filled' : ''}">${label}</span>`;
  }).join('');
}

function renderHotspotButton(hotspotId: HotspotId, state: VillageState): string {
  const hotspot = hotspots[hotspotId];
  const selected = state.currentOutingSelections.includes(hotspotId);
  const disabled = selected || state.currentOutingSelections.length >= 3 ? 'disabled' : '';
  return `<button type="button" class="hotspot ${selected ? 'is-selected' : ''}" data-hotspot-id="${hotspot.id}" ${disabled}>${hotspot.label}</button>`;
}

export function renderZoneBoard(host: HTMLElement, state: VillageState): void {
  const activeIds = activeHotspotIds(state);
  host.innerHTML = zoneOrder.map((zoneId) => {
    const zone = zones[zoneId];
    const zoneHotspots = activeIds.filter((hotspotId) => hotspots[hotspotId]?.zoneId === zoneId);
    const layer = state.zoneLayers[zoneId] ?? 0;
    const hiddenActive = zoneId === 'hidden' && state.alley.discoveredHint;
    return `
      <section class="zone-card zone-${zoneId} ${zoneHotspots.length || hiddenActive ? 'is-active' : ''}" data-zone-id="${zoneId}">
        <div>
          <h2>${zone.label}</h2>
          <p>${zone.description}</p>
          <span class="zone-layer">layer ${layer}</span>
        </div>
        <div class="hotspots">
          ${zoneHotspots.map((hotspotId) => renderHotspotButton(hotspotId, state)).join('')}
          ${hiddenActive ? '<span class="hidden-hint">신호가 섞였다.</span>' : ''}
        </div>
      </section>
    `;
  }).join('');
}

export function renderStatusStrip(host: HTMLElement, state: VillageState): void {
  const chips = [
    state.moneyFever.triggeredEver ? '<span class="status-chip is-strange">돈독</span>' : '',
    state.cyanGateUnlocked ? '<span class="status-chip is-cyan">길 열림</span>' : '',
    state.roomFeatures.firstRecord ? '<span class="status-chip">기록 있음</span>' : ''
  ].filter(Boolean);
  host.innerHTML = chips.join('');
}
```

- [ ] **Step 3: Replace main renderer**

Replace `src/pre-cyan-village/view/render.ts` with:

```ts
import { outingById } from '../domain/data';
import { renderOutingSlots, renderStatusStrip, renderZoneBoard } from './board-view';
import type { VillageState } from '../../shared/types/village';

export type AppElements = {
  roomScreen: HTMLElement;
  villageBoard: HTMLElement;
  guideLine: HTMLElement;
  startOutingButton: HTMLButtonElement;
  outingTitle: HTMLElement;
  outingSlots: HTMLElement;
  zoneBoard: HTMLElement;
  logText: HTMLElement;
  reactionPanel: HTMLElement;
  reactionText: HTMLElement;
  statusStrip: HTMLElement;
  resetButton: HTMLButtonElement;
};

export function queryAppElements(documentRef: Document = document): AppElements {
  const roomScreen = documentRef.querySelector<HTMLElement>('#room-screen');
  const villageBoard = documentRef.querySelector<HTMLElement>('#village-board');
  const guideLine = documentRef.querySelector<HTMLElement>('#guide-line');
  const startOutingButton = documentRef.querySelector<HTMLButtonElement>('#start-outing');
  const outingTitle = documentRef.querySelector<HTMLElement>('#outing-title');
  const outingSlots = documentRef.querySelector<HTMLElement>('#outing-slots');
  const zoneBoard = documentRef.querySelector<HTMLElement>('#zone-board');
  const logText = documentRef.querySelector<HTMLElement>('#village-log-text');
  const reactionPanel = documentRef.querySelector<HTMLElement>('#reaction-panel');
  const reactionText = documentRef.querySelector<HTMLElement>('#reaction-text');
  const statusStrip = documentRef.querySelector<HTMLElement>('#status-strip');
  const resetButton = documentRef.querySelector<HTMLButtonElement>('#reset-state');

  if (!roomScreen || !villageBoard || !guideLine || !startOutingButton || !outingTitle || !outingSlots || !zoneBoard || !logText || !reactionPanel || !reactionText || !statusStrip || !resetButton) {
    throw new Error('Missing Pre-Cyan outing DOM element');
  }

  return { roomScreen, villageBoard, guideLine, startOutingButton, outingTitle, outingSlots, zoneBoard, logText, reactionPanel, reactionText, statusStrip, resetButton };
}

export function renderApp(elements: AppElements, state: VillageState): void {
  const inRoom = state.screen === 'room';
  elements.roomScreen.hidden = !inRoom;
  elements.villageBoard.hidden = inRoom;
  elements.guideLine.textContent = state.guideLine;
  elements.startOutingButton.disabled = !inRoom || state.cyanGateUnlocked;
  elements.outingTitle.textContent = state.currentOutingId ? outingById(state.currentOutingId)?.title ?? '다른 하루' : '';
  renderOutingSlots(elements.outingSlots, state);
  renderZoneBoard(elements.zoneBoard, state);
  renderStatusStrip(elements.statusStrip, state);
  elements.logText.textContent = state.log;
  elements.reactionPanel.hidden = !state.pendingReaction;
  elements.reactionText.textContent = state.pendingReaction?.log ?? '';
}
```

- [ ] **Step 4: Update static contract tests**

Modify `src/pre-cyan-village/tests/static-contract.test.ts`:

```ts
test('Vite entry keeps room and outing hosts wired', () => {
  const indexHtml = readVillageFile('index.html');

  assert.ok(indexHtml.includes('id="room-screen"'));
  assert.ok(indexHtml.includes('id="village-board"'));
  assert.ok(indexHtml.includes('id="outing-slots"'));
  assert.ok(indexHtml.includes('id="zone-board"'));
  assert.equal(hasViteEntryScript(indexHtml), true);
});
```

Replace the old movement locking test with:

```ts
test('outing render and event hosts remain wired', () => {
  const renderSource = readVillageFile(join('view', 'render.ts'));
  const eventsSource = readVillageFile(join('view', 'events.ts'));

  assert.match(renderSource, /renderOutingSlots/);
  assert.match(renderSource, /renderZoneBoard/);
  assert.match(eventsSource, /startOuting/);
  assert.match(eventsSource, /selectHotspot/);
});
```

Keep banned string and repository docs tests.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: render/static tests may pass, event tests fail until Task 5 rewires events.

- [ ] **Step 6: Commit**

```bash
git add src/pre-cyan-village/index.html src/pre-cyan-village/view/board-view.ts src/pre-cyan-village/view/render.ts src/pre-cyan-village/tests/static-contract.test.ts
git commit -m "feat: render pre-cyan outing screens"
```

---

### Task 5: Wire Events and Remove Movement Loop

**Files:**
- Modify: `src/pre-cyan-village/view/events.ts`
- Modify: `src/pre-cyan-village/main.ts`
- Test: `src/pre-cyan-village/tests/static-contract.test.ts`

- [ ] **Step 1: Replace event wiring**

Replace `src/pre-cyan-village/view/events.ts` with:

```ts
import { recordMoneyFeverClick, resetState, saveState, selectHotspot, startOuting } from '../domain/state';
import { renderApp, type AppElements } from './render';
import type { StorageLike } from '../../shared/storage/local-storage';
import type { HotspotId, VillageState } from '../../shared/types/village';

export function wireEvents(elements: AppElements, initialState: VillageState, storage: StorageLike | null): void {
  let currentState = initialState;

  function saveCurrentState(): void {
    if (!storage) return;
    saveState(storage, currentState);
  }

  function update(nextState: VillageState): void {
    if (nextState === currentState) return;
    currentState = nextState;
    saveCurrentState();
    renderApp(elements, currentState);
  }

  elements.startOutingButton.addEventListener('click', () => {
    update(startOuting(currentState));
  });

  elements.zoneBoard.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-hotspot-id]');
    if (!button) return;
    const hotspotId = button.dataset.hotspotId as HotspotId | undefined;
    if (!hotspotId) return;
    update(selectHotspot(currentState, hotspotId));
  });

  elements.zoneBoard.addEventListener('pointerdown', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-hotspot-id="bankAtm"], [data-hotspot-id="bankCounter"]');
    if (!button) return;
    update(recordMoneyFeverClick(currentState, Date.now()));
  });

  elements.resetButton.addEventListener('click', () => {
    currentState = storage ? resetState(storage) : resetState();
    saveCurrentState();
    renderApp(elements, currentState);
  });
}
```

- [ ] **Step 2: Verify main remains simple**

`src/pre-cyan-village/main.ts` should remain:

```ts
import './styles.css';
import { createInitialState, loadState, saveState } from './domain/state';
import { wireEvents } from './view/events';
import { queryAppElements, renderApp } from './view/render';
import type { StorageLike } from '../shared/storage/local-storage';

function getSafeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const elements = queryAppElements();
const storage = getSafeStorage();
const initialState = storage ? loadState(storage) : createInitialState();

if (storage) {
  saveState(storage, initialState);
}
renderApp(elements, initialState);
wireEvents(elements, initialState, storage);
```

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: tests PASS except possible TypeScript compile errors from old files imported nowhere. If old movement files compile cleanly, leave them for later cleanup.

- [ ] **Step 4: Commit**

```bash
git add src/pre-cyan-village/view/events.ts src/pre-cyan-village/main.ts
git commit -m "feat: wire pre-cyan outing interactions"
```

---

### Task 6: Style the Outing Experience

**Files:**
- Modify: `src/pre-cyan-village/styles.css`
- Test: `src/pre-cyan-village/tests/static-contract.test.ts`

- [ ] **Step 1: Replace CSS with room and board styling**

Replace `src/pre-cyan-village/styles.css` with a concise CSS file using the existing visual tokens:

```css
:root {
  --bg: #FAF9F5;
  --surface: #FFFFFF;
  --surface-soft: #F2EFE9;
  --line: #E5DEC9;
  --accent: #8E744A;
  --text: #1C1B18;
  --muted: #6C6A64;
  --cyan: #63B4D2;
  --cyan-dark: #287D9C;
  --shadow: 0 10px 28px rgba(28, 27, 24, 0.12);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif;
}

button { font: inherit; }

.app-shell {
  width: min(100%, 430px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.village-header { display: grid; gap: 4px; }
.eyebrow {
  margin: 0;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
}
h1 { margin: 0; font-size: 24px; line-height: 1.1; letter-spacing: 0; }

.room-screen,
.village-board,
.village-log,
.reaction-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.room-screen {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.room-screen[hidden],
.village-board[hidden],
.reaction-panel[hidden] {
  display: none;
}

.room-illustration {
  position: relative;
  min-height: 260px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.82), rgba(242,239,233,.92)),
    radial-gradient(circle at 78% 18%, rgba(99,180,210,.12), transparent 26%);
  border: 1px solid var(--line);
  overflow: hidden;
}

.room-window,
.room-door,
.guide-device {
  position: absolute;
  border: 1px solid var(--line);
  background: var(--surface);
}

.room-window {
  top: 28px;
  right: 28px;
  width: 82px;
  height: 58px;
  border-color: rgba(99,180,210,.45);
  background: rgba(99,180,210,.12);
}

.room-door {
  left: 28px;
  bottom: 24px;
  width: 68px;
  height: 112px;
  background: #E8E0D2;
}

.guide-device {
  right: 42px;
  bottom: 34px;
  width: 64px;
  height: 48px;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.guide-device::after {
  content: "";
  position: absolute;
  left: 18px;
  top: 14px;
  width: 26px;
  height: 12px;
  border-radius: 999px;
  background: var(--cyan);
}

.guide-panel,
.village-log,
.reaction-panel {
  padding: 11px 12px;
  font-size: 13px;
  line-height: 1.5;
}

.guide-name,
.reaction-kicker {
  margin: 0 0 4px;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
}

#guide-line,
#village-log-text,
#reaction-text { margin: 0; }

.start-outing,
.controls button {
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  padding: 9px 12px;
  cursor: pointer;
}

.village-board {
  display: grid;
  gap: 12px;
  padding: 12px;
}

.outing-status {
  display: grid;
  gap: 8px;
}

.outing-title {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.outing-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.outing-slot {
  min-height: 34px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--line);
  border-radius: 6px;
  color: var(--muted);
  background: var(--surface-soft);
  font-size: 12px;
}

.outing-slot.is-filled {
  border-style: solid;
  border-color: var(--accent);
  color: var(--text);
  background: rgba(142,116,74,.08);
}

.zone-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.zone-card {
  min-height: 136px;
  display: grid;
  align-content: space-between;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(242,239,233,.62);
  padding: 10px;
  opacity: .72;
}

.zone-card.is-active {
  opacity: 1;
  background: var(--surface);
}

.zone-card h2 {
  margin: 0 0 4px;
  font-size: 14px;
}

.zone-card p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.4;
}

.zone-layer {
  display: inline-block;
  margin-top: 6px;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 10px;
}

.hotspots {
  display: grid;
  gap: 6px;
}

.hotspot {
  min-height: 36px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  padding: 8px;
  text-align: left;
  cursor: pointer;
}

.hotspot.is-selected,
.hotspot:not(:disabled):hover {
  border-color: var(--accent);
  background: rgba(142,116,74,.08);
}

.hotspot:disabled {
  cursor: default;
  opacity: .68;
}

.hidden-hint,
.status-chip {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 8px;
  color: var(--muted);
  background: var(--surface-soft);
  font-size: 11px;
}

.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
}

.status-chip.is-strange {
  border-color: #1C1B18;
  color: #1C1B18;
}

.status-chip.is-cyan {
  border-color: var(--cyan);
  color: var(--cyan-dark);
}

.controls { display: flex; gap: 8px; }

@media (max-width: 390px) {
  .app-shell { padding: 12px; }
  .room-illustration { min-height: 230px; }
  .zone-board { gap: 7px; }
  .zone-card { min-height: 128px; padding: 8px; }
  .hotspot { font-size: 12px; }
}
```

- [ ] **Step 2: Run static banned string tests**

Run: `npm test`

Expected: PASS. The CSS should not introduce banned first-experience strings.

- [ ] **Step 3: Commit**

```bash
git add src/pre-cyan-village/styles.css
git commit -m "style: add pre-cyan outing interface"
```

---

### Task 7: Update Documentation and Run Verification

**Files:**
- Modify: `README.md`
- Test: all test suite and production build

- [ ] **Step 1: Update README current implementation copy**

In `README.md`, replace the current implementation paragraph under `## 현재 구현 상태` with:

```md
현재 활성 첫 슬라이스의 소스는 `src/pre-cyan-village/`입니다. 플레이어는 `내 방`에서 시작해 작은 단말의 안내를 받고, 한 번의 외출에서 4개 선택지 중 3개를 순서대로 고르는 Pre-Cyan 외출 루프를 진행합니다. 선택 순서에 따라 마을 반응과 기록이 달라지고, 필수 행동 감각을 모두 경험하면 Cyan 입구 흔적이 열리는 Vite + TypeScript 구현입니다. `dist/`는 빌드로 생성되는 출력물이며 저장소에 커밋하지 않습니다.
```

Replace the Pre-Cyan execution steps with:

```md
Pre-Cyan 첫 모험 마을:

1. `npm install`로 의존성을 설치합니다.
2. `npm run dev`로 Vite 개발 서버를 실행합니다.
3. 브라우저에서 안내된 로컬 주소를 열고, `내 방`에서 문을 열어 첫 외출을 시작합니다.
4. 각 외출에서 4개 선택지 중 3개를 순서대로 골라 마을 반응과 단말 기록이 바뀌는지 확인합니다.
5. 필수 행동 감각을 모두 경험한 뒤 Cyan 입구 흔적이 열리는지 확인합니다.
```

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS and Vite writes generated files to `dist/`.

- [ ] **Step 4: Run forbidden-string scan**

Run:

```powershell
rg -n "필수 기초 단어 놀이터|이해함|점수|학습 완료" src\pre-cyan-village
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: update pre-cyan outing instructions"
```

---

### Task 8: Browser Smoke Test

**Files:**
- No source changes unless the smoke test finds layout or console defects.

- [ ] **Step 1: Start local Vite server**

Run:

```powershell
$server = Start-Process -FilePath node -ArgumentList './node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174' -WindowStyle Hidden -PassThru
```

Expected: hidden Vite process starts.

- [ ] **Step 2: Run desktop and mobile smoke script**

Run:

```powershell
node -e "const { chromium } = require('playwright'); (async()=>{ const browser=await chromium.launch(); for (const viewport of [{width:1280,height:900},{width:390,height:844}]) { const page=await browser.newPage({ viewport }); const errors=[]; page.on('console', msg=>{ if(msg.type()==='error') errors.push(msg.text()); }); await page.goto('http://127.0.0.1:5174/src/pre-cyan-village/index.html', { waitUntil:'domcontentloaded', timeout:30000 }); await page.click('#start-outing'); await page.click('[data-hotspot-id=bankCounter]'); await page.click('[data-hotspot-id=storeFront]'); await page.click('[data-hotspot-id=busStop]'); const result=await page.evaluate(()=>({ roomHidden: document.querySelector('#room-screen')?.hasAttribute('hidden'), boardHidden: document.querySelector('#village-board')?.hasAttribute('hidden'), overflow: document.documentElement.scrollWidth-document.documentElement.clientWidth, log: document.querySelector('#village-log-text')?.textContent || '', errors: [] })); if(errors.length) throw new Error(errors.join('\\n')); if(result.overflow > 0) throw new Error('horizontal overflow '+result.overflow); await page.close(); } await browser.close(); })().catch(err=>{ console.error(err); process.exit(1); });"
```

Expected: exits 0, no console errors, no horizontal overflow.

- [ ] **Step 3: Stop local Vite server**

Run:

```powershell
if ($server -and !$server.HasExited) { Stop-Process -Id $server.Id -Force }
```

Expected: Vite process stops.

- [ ] **Step 4: Commit smoke-test fixes if needed**

If Task 8 required source changes, run:

```bash
git add src/pre-cyan-village
git commit -m "fix: polish pre-cyan outing smoke issues"
```

If no changes were needed, do not create an empty commit.

---

## Self-Review Checklist

- Spec coverage:
  - `내 방`: Tasks 4, 6
  - 3-choice outing loop: Tasks 3, 4, 5
  - 3 optimal outings and 4+ recovery: Task 3
  - required 5 actions: Task 3
  - Cyan trace gating: Task 3
  - money fever without alley entry: Task 3
  - persistence and corrupt save recovery: Task 3
  - mobile/no banned strings/build checks: Tasks 6, 7, 8
- Placeholder scan: this plan contains concrete paths, code blocks, commands, and expected outputs for each task.
- Type consistency:
  - `HotspotId`, `RequiredAction`, `VillageState`, `OutingRecord` are defined in Task 1 and used consistently after that.
  - `startOuting`, `selectHotspot`, and `recordMoneyFeverClick` are defined in Task 3 and used by Tasks 4 and 5.
