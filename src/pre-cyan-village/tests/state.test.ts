import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerCyanLoop,
  completeMove,
  countVisitedPublicPlaces,
  createInitialState,
  isNodeUnlocked,
  loadState,
  normalizeState,
  resetState,
  saveState,
  startMove,
  STORAGE_KEY,
  visitNode
} from '../domain/state';
import { hotspots, plannedOutings, villageEdges, villageNodes } from '../domain/data';
import { normalizeEdge } from '../../shared/map/paths';
import type { StorageLike } from '../../shared/storage/local-storage';

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

test('initial state includes token and Cyan loop defaults', () => {
  assert.deepEqual(createInitialState(), {
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
  });
});

test('loadState migrates old saved data with new fields', () => {
  const storage = createStorage({
    [STORAGE_KEY]: JSON.stringify({
      unlocked: ['room'],
      visited: [],
      log: '카드를 챙겼다.'
    })
  });
  const loaded = loadState(storage);
  assert.equal(loaded.playerNodeId, 'room');
  assert.equal(loaded.movingToNodeId, null);
  assert.equal(loaded.currentStage, 'preCyan');
  assert.equal(loaded.cyanLoopCompleted, false);
  assert.ok(loaded.unlocked.includes('room'));
  assert.ok(loaded.unlocked.includes('store'));
  assert.ok(loaded.unlocked.includes('bus'));
  assert.equal(new Set(loaded.unlocked).size, loaded.unlocked.length);
  assert.ok(loaded.visited.includes('room'));
  assert.equal(new Set(loaded.visited).size, loaded.visited.length);
});

test('loadState migrates old Cyan gate saved data into Cyan loop', () => {
  const storage = createStorage({
    [STORAGE_KEY]: JSON.stringify({
      unlocked: ['room', 'store', 'bus', 'work', 'bank'],
      visited: ['room', 'store', 'bus', 'work'],
      cyanGateUnlocked: true,
      firstAchievementShown: true,
      currentStage: 'preCyan'
    })
  });
  const loaded = loadState(storage);
  assert.equal(loaded.playerNodeId, 'cyanGate');
  assert.equal(loaded.movingToNodeId, null);
  assert.equal(loaded.currentStage, 'cyanLoop');
  assert.equal(loaded.cyanLoopSeen, true);
});

test('startMove locks movement without visiting immediately', () => {
  const initial = createInitialState();
  const moving = startMove(initial, 'store');
  assert.equal(moving.playerNodeId, 'room');
  assert.equal(moving.movingToNodeId, 'store');
  assert.deepEqual(moving.lastMove, { from: 'room', to: 'store' });
  assert.deepEqual(moving.visited, ['room']);
  assert.equal(moving.log, '나가기 전에 하나만 챙기면 된다.');
});

test('startMove ignores locked, unknown, current, and in-flight destinations', () => {
  const initial = createInitialState();
  assert.equal(startMove(initial, 'bank'), initial);
  assert.equal(startMove(initial, 'missing'), initial);
  assert.equal(startMove(initial, 'room'), initial);
  const moving = {
    ...initial,
    unlocked: ['room', 'store'],
    movingToNodeId: 'store'
  };
  assert.equal(startMove(moving, 'bus'), moving);
});

test('completeMove visits after arrival and unlocks next places', () => {
  const moving = startMove({
    ...createInitialState(),
    unlocked: ['room', 'store']
  }, 'store');
  const arrived = completeMove(moving);
  assert.equal(arrived.playerNodeId, 'store');
  assert.equal(arrived.movingToNodeId, null);
  assert.deepEqual(arrived.visited, ['room', 'store']);
  assert.equal(arrived.log, '봉투값이 붙었다.');
  assert.ok(arrived.unlocked.includes('work'));
  assert.ok(arrived.unlocked.includes('subscriptions'));
  assert.ok(arrived.unlocked.includes('lottery'));
});

test('completeMove opens Cyan intro when arriving at Cyan gate', () => {
  const moving = startMove({
    ...createInitialState(),
    unlocked: ['room', 'store', 'bus', 'work', 'bank'],
    visited: ['store', 'bus', 'work', 'bank'],
    cyanGateUnlocked: true,
    playerNodeId: 'bank'
  }, 'cyanGate');
  const arrived = completeMove(moving);
  assert.equal(arrived.playerNodeId, 'cyanGate');
  assert.equal(arrived.firstAchievementShown, true);
  assert.equal(arrived.currentStage, 'cyanLoop');
  assert.equal(arrived.cyanLoopSeen, true);
  assert.equal(arrived.cyanLoopCompleted, false);
});

test('room plus three public destinations can unlock Cyan gate', () => {
  const afterStore = completeMove(startMove(createInitialState(), 'store'));
  const afterBus = completeMove(startMove(afterStore, 'bus'));
  const afterWork = completeMove(startMove(afterBus, 'work'));
  assert.deepEqual(afterWork.visited, ['room', 'store', 'bus', 'work']);
  assert.equal(countVisitedPublicPlaces(afterWork), 4);
  assert.equal(afterWork.cyanGateUnlocked, true);
});

test('visitNode direct compatibility updates token position', () => {
  const visited = visitNode({
    ...createInitialState(),
    unlocked: ['room', 'store'],
    movingToNodeId: 'store'
  }, 'store');
  assert.equal(visited.playerNodeId, 'store');
  assert.equal(visited.movingToNodeId, null);
  assert.equal(visited.log, '봉투값이 붙었다.');
});

test('completeMove rejects corrupt locked movement without changing position', () => {
  const corrupt = {
    ...createInitialState(),
    playerNodeId: 'room',
    movingToNodeId: 'bank'
  };
  const result = completeMove(corrupt);
  assert.equal(result, corrupt);
  assert.equal(result.playerNodeId, 'room');
  assert.equal(result.movingToNodeId, 'bank');
});

test('answerCyanLoop records success and failure without scores', () => {
  const ready = {
    ...createInitialState(),
    playerNodeId: 'cyanGate',
    firstAchievementShown: true,
    currentStage: 'cyanLoop' as const,
    cyanLoopSeen: true
  };
  const success = answerCyanLoop(ready, 'fare-for-time');
  assert.equal(success.cyanLoopCompleted, true);
  assert.equal(success.cyanLoopResult, 'success');
  assert.equal(success.log, '맞아. 뭔가를 내고, 길을 얻었다.');
  assert.equal(success.log.includes('점수'), false);
  const failure = answerCyanLoop(ready, 'lottery-for-work');
  assert.equal(failure.cyanLoopCompleted, true);
  assert.equal(failure.cyanLoopResult, 'failure');
  assert.equal(failure.log, '그건 아직 길이 안 이어진다.');
  assert.equal(failure.log.includes('점수'), false);
});

test('saveState and resetState use the provided storage safely', () => {
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

test('loadState and resetState without storage are safe in Node', () => {
  assert.doesNotThrow(() => loadState());
  assert.deepEqual(loadState(), createInitialState());
  assert.doesNotThrow(() => resetState());
  assert.deepEqual(resetState(), createInitialState());
});

test('normalizeState rejects string booleans instead of unlocking gated state', () => {
  const normalized = normalizeState({
    cyanGateUnlocked: 'false',
    lotterySeen: 'true',
    backAlleyDiscovered: 'true',
    backAlleyEntered: 'true',
    firstAchievementShown: 'true',
    currentStage: 'cyanLoop',
    cyanLoopSeen: 'true',
    cyanLoopCompleted: 'false'
  });

  assert.equal(normalized.cyanGateUnlocked, false);
  assert.equal(normalized.lotterySeen, false);
  assert.equal(normalized.backAlleyDiscovered, false);
  assert.equal(normalized.backAlleyEntered, false);
  assert.equal(normalized.firstAchievementShown, false);
  assert.equal(normalized.currentStage, 'cyanLoop');
  assert.equal(normalized.cyanLoopSeen, false);
  assert.equal(normalized.cyanLoopCompleted, false);
  assert.equal(isNodeUnlocked(normalized, 'cyanGate'), false);
  assert.equal(isNodeUnlocked(normalized, 'alley'), false);
});

test('village data references only known nodes and state flags', () => {
  const nodeIds = new Set(Object.keys(villageNodes));
  const stateKeys = new Set(Object.keys(createInitialState()));

  Object.values(villageNodes).forEach((node) => {
    node.unlocks.forEach((nextId) => {
      assert.equal(nodeIds.has(nextId), true, `${node.id} unlocks unknown node ${nextId}`);
    });
  });

  villageEdges.map(normalizeEdge).forEach((edge) => {
    assert.equal(nodeIds.has(edge.from), true, `edge starts at unknown node ${edge.from}`);
    assert.equal(nodeIds.has(edge.to), true, `edge ends at unknown node ${edge.to}`);
    if (edge.hiddenUntil) {
      assert.equal(stateKeys.has(edge.hiddenUntil), true, `edge uses unknown hiddenUntil key ${edge.hiddenUntil}`);
    }
  });
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
