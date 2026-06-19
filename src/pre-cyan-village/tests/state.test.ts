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
    assert.equal(new Set(outing.hotspotIds).size, 4, `${outing.id} has duplicate hotspots`);
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
  let state = startOuting({
    ...createInitialState(),
    currentOutingId: null,
    completedActions: ['receivedSupport', 'spent', 'moved'],
    outingCount: 2
  });
  state = selectHotspot(state, 'bankAtm');
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
