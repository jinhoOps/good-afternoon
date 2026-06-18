const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;

function createStorage(seed = {}) {
  const store = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    }
  };
}

function loadModules(seed) {
  const window = {};
  const sandbox = {
    window,
    localStorage: createStorage(seed)
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'village-data.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'village-state.js'), 'utf8'), sandbox);
  return {
    data: window.PreCyanVillageData,
    state: window.PreCyanVillageState,
    storage: sandbox.localStorage
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('initial state includes token and Cyan loop defaults', () => {
  const { state } = loadModules();
  assert.deepEqual(plain(state.createInitialState()), {
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
  const oldState = {
    unlocked: ['room'],
    visited: [],
    log: '카드를 챙겼다.'
  };
  const { state } = loadModules({
    [stateKey()]: JSON.stringify(oldState)
  });
  const loaded = state.loadState();
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

test('startMove locks movement without visiting immediately', () => {
  const { state } = loadModules();
  const initial = state.createInitialState();
  const moving = state.startMove(initial, 'store');
  assert.equal(moving.playerNodeId, 'room');
  assert.equal(moving.movingToNodeId, 'store');
  assert.deepEqual(plain(moving.lastMove), { from: 'room', to: 'store' });
  assert.deepEqual(plain(moving.visited), ['room']);
  assert.equal(moving.log, '나가기 전에 하나만 챙기면 된다.');
});

test('startMove ignores locked, unknown, current, and in-flight destinations', () => {
  const { state } = loadModules();
  const initial = state.createInitialState();
  assert.equal(state.startMove(initial, 'bank'), initial);
  assert.equal(state.startMove(initial, 'missing'), initial);
  assert.equal(state.startMove(initial, 'room'), initial);
  const moving = {
    ...initial,
    unlocked: ['room', 'store'],
    movingToNodeId: 'store'
  };
  assert.equal(state.startMove(moving, 'bus'), moving);
});

test('completeMove visits after arrival and unlocks next places', () => {
  const { state } = loadModules();
  const moving = state.startMove({
    ...state.createInitialState(),
    unlocked: ['room', 'store']
  }, 'store');
  const arrived = state.completeMove(moving);
  assert.equal(arrived.playerNodeId, 'store');
  assert.equal(arrived.movingToNodeId, null);
  assert.deepEqual(plain(arrived.visited), ['room', 'store']);
  assert.equal(arrived.log, '봉투값이 붙었다.');
  assert.ok(arrived.unlocked.includes('work'));
  assert.ok(arrived.unlocked.includes('subscriptions'));
  assert.ok(arrived.unlocked.includes('lottery'));
});

test('completeMove opens Cyan intro when arriving at Cyan gate', () => {
  const { state } = loadModules();
  const moving = state.startMove({
    ...state.createInitialState(),
    unlocked: ['room', 'store', 'bus', 'work', 'bank'],
    visited: ['store', 'bus', 'work', 'bank'],
    cyanGateUnlocked: true,
    playerNodeId: 'bank'
  }, 'cyanGate');
  const arrived = state.completeMove(moving);
  assert.equal(arrived.playerNodeId, 'cyanGate');
  assert.equal(arrived.firstAchievementShown, true);
  assert.equal(arrived.currentStage, 'cyanLoop');
  assert.equal(arrived.cyanLoopSeen, true);
  assert.equal(arrived.cyanLoopCompleted, false);
});

test('room plus three public destinations can unlock Cyan gate', () => {
  const { state } = loadModules();
  const afterStore = state.completeMove(state.startMove(state.createInitialState(), 'store'));
  const afterBus = state.completeMove(state.startMove(afterStore, 'bus'));
  const afterWork = state.completeMove(state.startMove(afterBus, 'work'));
  assert.deepEqual(plain(afterWork.visited), ['room', 'store', 'bus', 'work']);
  assert.equal(state.countVisitedPublicPlaces(afterWork), 4);
  assert.equal(afterWork.cyanGateUnlocked, true);
});

test('visitNode direct compatibility updates token position', () => {
  const { state } = loadModules();
  const visited = state.visitNode({
    ...state.createInitialState(),
    unlocked: ['room', 'store'],
    movingToNodeId: 'store'
  }, 'store');
  assert.equal(visited.playerNodeId, 'store');
  assert.equal(visited.movingToNodeId, null);
  assert.equal(visited.log, '봉투값이 붙었다.');
});

test('completeMove rejects corrupt locked movement without changing position', () => {
  const { state } = loadModules();
  const corrupt = {
    ...state.createInitialState(),
    playerNodeId: 'room',
    movingToNodeId: 'bank'
  };
  const result = state.completeMove(corrupt);
  assert.equal(result, corrupt);
  assert.equal(result.playerNodeId, 'room');
  assert.equal(result.movingToNodeId, 'bank');
});

test('answerCyanLoop records success and failure without scores', () => {
  const { state } = loadModules();
  const ready = {
    ...state.createInitialState(),
    playerNodeId: 'cyanGate',
    firstAchievementShown: true,
    currentStage: 'cyanLoop',
    cyanLoopSeen: true
  };
  const success = state.answerCyanLoop(ready, 'fare-for-time');
  assert.equal(success.cyanLoopCompleted, true);
  assert.equal(success.cyanLoopResult, 'success');
  assert.equal(success.log, '맞아. 뭔가를 내고, 길을 얻었다.');
  assert.equal(success.log.includes('점수'), false);
  const failure = state.answerCyanLoop(ready, 'lottery-for-work');
  assert.equal(failure.cyanLoopCompleted, true);
  assert.equal(failure.cyanLoopResult, 'failure');
  assert.equal(failure.log, '그건 아직 길이 안 이어진다.');
  assert.equal(failure.log.includes('점수'), false);
});

function stateKey() {
  return 'goodafternoon.preCyanVillage.v1';
}
