# Pre-Cyan Cyan Token Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first formal Pre-Cyan to Cyan slice where a player token moves across the village map, reaches the Cyan gate, and opens one minimal Cyan judgment loop.

**Architecture:** Keep the current static app and IIFE module pattern. Put domain data in `village-data.js`, all persisted state transitions in `village-state.js`, DOM and event wiring in `village-render.js`, and visual movement/panel styling in `styles.css`.

**Tech Stack:** Plain HTML, CSS, browser JavaScript, localStorage, Node built-in `vm` for state tests.

---

## File Structure

- Modify `app/pre-cyan-village/village-data.js`: add first Cyan loop content and keep node/edge definitions as the single map data source.
- Modify `app/pre-cyan-village/village-state.js`: add token position fields, movement start/complete functions, Cyan stage fields, and Cyan loop answer handling.
- Modify `app/pre-cyan-village/village-render.js`: render token, lock input while moving, complete movement from transition/fallback, and render Cyan loop choices.
- Modify `app/pre-cyan-village/index.html`: add token host and Cyan loop panel host; remove separate gate button workflow.
- Modify `app/pre-cyan-village/styles.css`: style token, current node, last path, moving board state, Cyan gate, and Cyan loop choices.
- Create `app/pre-cyan-village/village-state.test.js`: dependency-free Node smoke tests for state migration, movement guards, Cyan gate arrival, loop answers, and reset behavior.

## Task 1: State Test Harness

**Files:**
- Create: `app/pre-cyan-village/village-state.test.js`
- Modify: `app/pre-cyan-village/village-state.js`
- Test: `app/pre-cyan-village/village-state.test.js`

- [ ] **Step 1: Write the failing state tests**

Create `app/pre-cyan-village/village-state.test.js` with this complete file:

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;

function createStorage(seed) {
  const store = new Map(Object.entries(seed || {}));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
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

test('initial state includes token and Cyan loop defaults', () => {
  const { state } = loadModules();
  assert.deepEqual(state.createInitialState(), {
    unlocked: ['room'],
    visited: [],
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
    unlocked: ['room', 'store'],
    visited: ['room'],
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
  assert.deepEqual(loaded.unlocked, ['room', 'store']);
});

test('startMove locks movement without visiting immediately', () => {
  const { state } = loadModules();
  const initial = {
    ...state.createInitialState(),
    unlocked: ['room', 'store']
  };
  const moving = state.startMove(initial, 'store');
  assert.equal(moving.playerNodeId, 'room');
  assert.equal(moving.movingToNodeId, 'store');
  assert.deepEqual(moving.lastMove, { from: 'room', to: 'store' });
  assert.deepEqual(moving.visited, []);
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
  assert.deepEqual(arrived.visited, ['store']);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
node app/pre-cyan-village/village-state.test.js
```

Expected: FAIL on `initial state includes token and Cyan loop defaults`, with an assertion showing missing `playerNodeId`, `movingToNodeId`, `lastMove`, `currentStage`, `cyanLoopSeen`, `cyanLoopCompleted`, and `cyanLoopResult`.

- [ ] **Step 3: Implement state fields and movement functions**

Replace `app/pre-cyan-village/village-state.js` with this complete file:

```javascript
(() => {
  const { cyanFirstLoop, villageNodes } = window.PreCyanVillageData;

  const STORAGE_KEY = 'goodafternoon.preCyanVillage.v1';

  function createInitialState() {
    return {
      unlocked: ['room'],
      visited: [],
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

  function normalizeState(parsed) {
    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : base.unlocked,
      visited: Array.isArray(parsed.visited) ? parsed.visited : base.visited,
      playerNodeId: villageNodes[parsed.playerNodeId] ? parsed.playerNodeId : base.playerNodeId,
      movingToNodeId: null,
      lastMove: parsed.lastMove && villageNodes[parsed.lastMove.from] && villageNodes[parsed.lastMove.to]
        ? parsed.lastMove
        : base.lastMove,
      currentStage: ['preCyan', 'cyanIntro', 'cyanLoop'].includes(parsed.currentStage)
        ? parsed.currentStage
        : base.currentStage,
      cyanLoopResult: ['success', 'failure'].includes(parsed.cyanLoopResult)
        ? parsed.cyanLoopResult
        : base.cyanLoopResult
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return createInitialState();
      return normalizeState(JSON.parse(saved));
    } catch {
      return createInitialState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    return state;
  }

  function resetState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    return createInitialState();
  }

  function isNodeUnlocked(state, id) {
    if (id === 'cyanGate') return state.cyanGateUnlocked;
    if (id === 'alley') return state.backAlleyDiscovered;
    return state.unlocked.includes(id);
  }

  function countVisitedPublicPlaces(state) {
    return state.visited.filter((id) => {
      const node = villageNodes[id];
      return node && !node.hidden && !node.gate;
    }).length;
  }

  function visitNode(state, id) {
    const node = villageNodes[id];
    if (!node || !isNodeUnlocked(state, id)) return state;

    const nextState = {
      ...state,
      unlocked: [...state.unlocked],
      visited: [...state.visited],
      log: node.log
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

  function enterGate(state) {
    if (!state.cyanGateUnlocked) return state;
    return {
      ...state,
      log: villageNodes.cyanGate.log,
      firstAchievementShown: true,
      currentStage: 'cyanLoop',
      cyanLoopSeen: true
    };
  }

  function startMove(state, destinationId) {
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

  function completeMove(state) {
    if (!state.movingToNodeId) return state;
    const destinationId = state.movingToNodeId;
    const arrived = {
      ...state,
      playerNodeId: destinationId,
      movingToNodeId: null
    };
    if (destinationId === 'cyanGate') {
      return enterGate(arrived);
    }
    return visitNode(arrived, destinationId);
  }

  function answerCyanLoop(state, choiceId) {
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

  window.PreCyanVillageState = {
    STORAGE_KEY,
    createInitialState,
    loadState,
    saveState,
    resetState,
    isNodeUnlocked,
    countVisitedPublicPlaces,
    visitNode,
    enterGate,
    startMove,
    completeMove,
    answerCyanLoop
  };
})();
```

- [ ] **Step 4: Run tests to verify the current data dependency fails**

Run:

```powershell
node app/pre-cyan-village/village-state.test.js
```

Expected: FAIL in `answerCyanLoop records success and failure without scores` because `cyanFirstLoop` is not defined in `village-data.js`.

- [ ] **Step 5: Commit the failing test and partial state implementation**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village/village-state.test.js app/pre-cyan-village/village-state.js
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "test: cover pre-cyan token state"
```

Expected: commit succeeds and records the red test plus state contract.

## Task 2: Cyan Loop Data

**Files:**
- Modify: `app/pre-cyan-village/village-data.js`
- Test: `app/pre-cyan-village/village-state.test.js`

- [ ] **Step 1: Add Cyan loop data**

Replace `app/pre-cyan-village/village-data.js` with this complete file:

```javascript
(() => {
  const villageNodes = {
    room: { id: 'room', label: '내 방', log: '카드를 챙겼다.', x: 50, y: 76, unlocks: ['store', 'bus'], startsUnlocked: true },
    store: { id: 'store', label: '편의점', log: '봉투값이 붙었다.', x: 28, y: 55, unlocks: ['work', 'subscriptions', 'lottery'] },
    bus: { id: 'bus', label: '버스정류장', log: '잔액이 부족하다.', x: 70, y: 56, unlocks: ['bank'] },
    work: { id: 'work', label: '알바처', log: '입금액이 예상보다 작다.', x: 24, y: 34, unlocks: ['bank'] },
    subscriptions: { id: 'subscriptions', label: '구독함', log: '이번 달에도 빠졌다.', x: 52, y: 35, unlocks: [] },
    bank: { id: 'bank', label: '은행', log: '숫자가 조금 늘었다.', x: 78, y: 34, unlocks: [] },
    lottery: { id: 'lottery', label: '복권방', log: '같은 번호가 또 걸려 있다.', x: 18, y: 18, unlocks: [] },
    alley: { id: 'alley', label: '어두운 골목', log: '불이 잠깐 켜졌다.', x: 16, y: 12, unlocks: [], hidden: true },
    cyanGate: { id: 'cyanGate', label: 'Cyan 입구', log: '길이 열렸다.', x: 82, y: 14, unlocks: [], gate: true }
  };

  const villageEdges = [
    ['room', 'store'],
    ['room', 'bus'],
    ['store', 'work'],
    ['store', 'subscriptions'],
    ['store', 'lottery'],
    ['bus', 'bank'],
    ['work', 'bank'],
    ['bank', 'cyanGate'],
    { from: 'lottery', to: 'alley', hiddenUntil: 'backAlleyDiscovered' }
  ];

  const cyanFirstLoop = {
    id: 'fare-exchange',
    situation: '버스정류장에서 잔액이 부족하다.',
    question: '지금 오가야 하는 건 뭐지?',
    correctChoiceId: 'fare-for-time',
    successLog: '맞아. 뭔가를 내고, 길을 얻었다.',
    failureLog: '그건 아직 길이 안 이어진다.',
    choices: [
      { id: 'fare-for-time', label: '교통카드 잔액을 내고 이동 시간을 얻는다.' },
      { id: 'time-for-bag', label: '이동 시간을 내고 봉투값을 얻는다.' },
      { id: 'lottery-for-work', label: '복권 번호를 내고 알바 시간을 얻는다.' }
    ]
  };

  window.PreCyanVillageData = { villageNodes, villageEdges, cyanFirstLoop };
})();
```

- [ ] **Step 2: Run state tests to verify they pass**

Run:

```powershell
node app/pre-cyan-village/village-state.test.js
```

Expected: every line starts with `PASS`; process exits with code `0`.

- [ ] **Step 3: Commit state and data**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village/village-data.js app/pre-cyan-village/village-state.js app/pre-cyan-village/village-state.test.js
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "feat: add token movement state"
```

Expected: commit succeeds.

## Task 3: Markup and Renderer

**Files:**
- Modify: `app/pre-cyan-village/index.html`
- Modify: `app/pre-cyan-village/village-render.js`
- Test: `app/pre-cyan-village/village-state.test.js`

- [ ] **Step 1: Update HTML hosts**

Replace `app/pre-cyan-village/index.html` with this complete file:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Good Afternoon. Pre-Cyan</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="app-shell">
    <header class="village-header">
      <p class="eyebrow">// Pre-Cyan</p>
      <h1>Good Afternoon.</h1>
    </header>

    <section class="village-board" aria-label="Pre-Cyan 첫 모험 마을" aria-busy="false">
      <svg class="village-paths" viewBox="0 0 100 100" aria-hidden="true" focusable="false"></svg>
      <div class="village-nodes" id="village-nodes"></div>
      <div class="player-token" id="player-token" aria-hidden="true"></div>
    </section>

    <section class="village-log" aria-live="polite">
      <p id="village-log-text">나가기 전에 하나만 챙기면 된다.</p>
    </section>

    <section class="achievement" id="achievement" hidden>
      <p class="achievement-kicker">기록</p>
      <h2>첫 길</h2>
      <p>마을 밖으로 나갈 준비가 됐다.</p>
    </section>

    <section class="cyan-loop" id="cyan-loop" hidden>
      <p class="cyan-loop-kicker">Cyan</p>
      <h2 id="cyan-loop-situation"></h2>
      <p id="cyan-loop-question"></p>
      <div class="cyan-loop-choices" id="cyan-loop-choices"></div>
    </section>

    <footer class="controls">
      <button type="button" id="reset-state">초기화</button>
    </footer>
  </main>

  <script src="./village-data.js"></script>
  <script src="./village-state.js"></script>
  <script src="./village-render.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace renderer with token movement flow**

Replace `app/pre-cyan-village/village-render.js` with this complete file:

```javascript
(() => {
  const { cyanFirstLoop, villageEdges, villageNodes } = window.PreCyanVillageData;
  const {
    answerCyanLoop,
    completeMove,
    isNodeUnlocked,
    loadState,
    resetState,
    saveState,
    startMove
  } = window.PreCyanVillageState;

  const MOVE_FALLBACK_MS = 520;

  const board = document.querySelector('.village-board');
  const nodesHost = document.querySelector('#village-nodes');
  const pathsHost = document.querySelector('.village-paths');
  const token = document.querySelector('#player-token');
  const logText = document.querySelector('#village-log-text');
  const achievement = document.querySelector('#achievement');
  const cyanLoop = document.querySelector('#cyan-loop');
  const cyanLoopSituation = document.querySelector('#cyan-loop-situation');
  const cyanLoopQuestion = document.querySelector('#cyan-loop-question');
  const cyanLoopChoices = document.querySelector('#cyan-loop-choices');
  const resetButton = document.querySelector('#reset-state');

  let currentState = loadState();
  let moveFallbackId = null;
  let completingMove = false;

  function normalizeEdge(edge) {
    if (Array.isArray(edge)) return { from: edge[0], to: edge[1] };
    return edge;
  }

  function isEdgeVisible(edge) {
    if (!edge.hiddenUntil) return true;
    return Boolean(currentState[edge.hiddenUntil]);
  }

  function isLastMove(edge) {
    return currentState.lastMove
      && currentState.lastMove.from === edge.from
      && currentState.lastMove.to === edge.to;
  }

  function renderPaths() {
    pathsHost.innerHTML = villageEdges
      .map(normalizeEdge)
      .filter(isEdgeVisible)
      .map((edge) => {
        const fromNode = villageNodes[edge.from];
        const toNode = villageNodes[edge.to];
        const isLit = isNodeUnlocked(currentState, edge.from) && isNodeUnlocked(currentState, edge.to);
        const classes = [
          'village-path',
          isLit ? 'is-lit' : '',
          isLastMove(edge) ? 'is-last-move' : ''
        ].filter(Boolean).join(' ');
        return `<line class="${classes}" x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}"></line>`;
      }).join('');
  }

  function renderNodes() {
    const moving = Boolean(currentState.movingToNodeId);
    nodesHost.innerHTML = Object.values(villageNodes).map((node) => {
      const unlocked = isNodeUnlocked(currentState, node.id);
      const visited = currentState.visited.includes(node.id);
      const hidden = node.hidden && !currentState.backAlleyDiscovered;
      const current = currentState.playerNodeId === node.id && !moving;
      const movingTarget = currentState.movingToNodeId === node.id;
      const classes = [
        'village-node',
        unlocked ? 'is-unlocked' : '',
        visited ? 'is-visited' : '',
        hidden ? 'is-hidden' : '',
        current ? 'is-current' : '',
        movingTarget ? 'is-moving-target' : '',
        node.gate ? 'is-gate' : ''
      ].filter(Boolean).join(' ');
      const disabled = !unlocked || moving;
      return `<button class="${classes}" type="button" style="--x:${node.x};--y:${node.y}" data-node-id="${node.id}" ${disabled ? 'disabled' : ''}>${node.label}</button>`;
    }).join('');
  }

  function getTokenNode() {
    return villageNodes[currentState.movingToNodeId || currentState.playerNodeId] || villageNodes.room;
  }

  function renderToken() {
    const node = getTokenNode();
    token.style.setProperty('--x', node.x);
    token.style.setProperty('--y', node.y);
    token.classList.toggle('is-moving', Boolean(currentState.movingToNodeId));
  }

  function renderCyanLoop() {
    const visible = currentState.currentStage === 'cyanLoop' && currentState.cyanLoopSeen;
    cyanLoop.hidden = !visible;
    if (!visible) return;
    cyanLoopSituation.textContent = cyanFirstLoop.situation;
    cyanLoopQuestion.textContent = cyanFirstLoop.question;
    cyanLoopChoices.innerHTML = cyanFirstLoop.choices.map((choice) => {
      const selected = currentState.cyanLoopCompleted && (
        (currentState.cyanLoopResult === 'success' && choice.id === cyanFirstLoop.correctChoiceId)
        || (currentState.cyanLoopResult === 'failure' && choice.id !== cyanFirstLoop.correctChoiceId)
      );
      const classes = ['cyan-choice', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
      return `<button class="${classes}" type="button" data-cyan-choice="${choice.id}" ${currentState.cyanLoopCompleted ? 'disabled' : ''}>${choice.label}</button>`;
    }).join('');
  }

  function render() {
    const moving = Boolean(currentState.movingToNodeId);
    board.setAttribute('aria-busy', moving ? 'true' : 'false');
    board.classList.toggle('is-moving', moving);
    renderPaths();
    renderNodes();
    renderToken();
    renderCyanLoop();
    logText.textContent = currentState.log;
    achievement.hidden = !currentState.firstAchievementShown;
  }

  function clearMoveFallback() {
    if (!moveFallbackId) return;
    window.clearTimeout(moveFallbackId);
    moveFallbackId = null;
  }

  function finishMove() {
    if (completingMove || !currentState.movingToNodeId) return;
    completingMove = true;
    clearMoveFallback();
    currentState = completeMove(currentState);
    saveState(currentState);
    render();
    completingMove = false;
  }

  function scheduleMoveFallback() {
    clearMoveFallback();
    moveFallbackId = window.setTimeout(finishMove, MOVE_FALLBACK_MS);
  }

  nodesHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-node-id]');
    if (!button || currentState.movingToNodeId) return;
    const nextState = startMove(currentState, button.dataset.nodeId);
    if (nextState === currentState) return;
    currentState = nextState;
    saveState(currentState);
    render();
    scheduleMoveFallback();
  });

  token.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'left' && event.propertyName !== 'top') return;
    finishMove();
  });

  cyanLoopChoices.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cyan-choice]');
    if (!button) return;
    currentState = answerCyanLoop(currentState, button.dataset.cyanChoice);
    saveState(currentState);
    render();
  });

  resetButton.addEventListener('click', () => {
    clearMoveFallback();
    currentState = resetState();
    saveState(currentState);
    render();
  });

  render();
})();
```

- [ ] **Step 3: Run state tests after renderer changes**

Run:

```powershell
node app/pre-cyan-village/village-state.test.js
```

Expected: every line starts with `PASS`; process exits with code `0`.

- [ ] **Step 4: Commit markup and renderer**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village/index.html app/pre-cyan-village/village-render.js
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "feat: move token through village map"
```

Expected: commit succeeds.

## Task 4: Token and Cyan Loop Styling

**Files:**
- Modify: `app/pre-cyan-village/styles.css`
- Test: `app/pre-cyan-village/village-state.test.js`

- [ ] **Step 1: Replace styles with movement-aware UI**

Replace `app/pre-cyan-village/styles.css` with this complete file:

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
  --cyan-dark: #27748D;
  --shadow: rgba(28, 27, 24, 0.16);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif;
}

button {
  font: inherit;
}

.app-shell {
  width: min(100%, 430px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.village-header {
  display: grid;
  gap: 4px;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
}

h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: 0;
}

.village-board {
  position: relative;
  min-height: 500px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.88), rgba(242,239,233,0.72)),
    radial-gradient(circle at 18% 18%, rgba(142,116,74,0.11), transparent 24%),
    radial-gradient(circle at 76% 22%, rgba(99,180,210,0.10), transparent 24%);
  overflow: hidden;
}

.village-board.is-moving .village-node {
  cursor: wait;
}

.village-paths {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.village-path {
  stroke: rgba(142, 116, 74, 0.22);
  stroke-width: 1.2;
  stroke-linecap: round;
  transition: stroke 180ms ease, stroke-width 180ms ease;
}

.village-path.is-lit {
  stroke: rgba(142, 116, 74, 0.72);
}

.village-path.is-last-move {
  stroke: var(--cyan-dark);
  stroke-width: 1.8;
}

.village-node {
  position: absolute;
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  transform: translate(-50%, -50%);
  min-width: 58px;
  min-height: 44px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.92);
  color: var(--muted);
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.25;
  padding: 8px 9px;
  cursor: pointer;
  opacity: 0.34;
  filter: grayscale(0.45);
  transition: opacity 180ms ease, filter 180ms ease, transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.village-node.is-unlocked {
  opacity: 1;
  filter: none;
}

.village-node.is-visited {
  border-color: var(--accent);
}

.village-node.is-current {
  border-color: var(--text);
  box-shadow: 0 0 0 2px rgba(28, 27, 24, 0.08);
}

.village-node.is-moving-target {
  border-color: var(--cyan-dark);
  box-shadow: 0 0 0 2px rgba(99, 180, 210, 0.18);
}

.village-node.is-gate.is-unlocked {
  border-color: var(--cyan);
  color: var(--cyan-dark);
}

.village-node.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.village-node.is-hidden.is-unlocked {
  opacity: 0.78;
  pointer-events: auto;
}

.village-node:disabled {
  cursor: default;
}

.village-node:not(:disabled):hover {
  transform: translate(-50%, -52%);
  border-color: var(--accent);
}

.player-token {
  position: absolute;
  z-index: 5;
  left: calc(var(--x, 50) * 1%);
  top: calc(var(--y, 76) * 1%);
  width: 22px;
  height: 22px;
  border: 2px solid var(--surface);
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.92) 0 18%, transparent 19%),
    linear-gradient(145deg, var(--cyan), var(--cyan-dark));
  box-shadow: 0 8px 18px var(--shadow);
  transform: translate(-50%, -50%);
  transition: left 420ms cubic-bezier(.2,.8,.2,1), top 420ms cubic-bezier(.2,.8,.2,1), transform 180ms ease;
  pointer-events: none;
}

.player-token.is-moving {
  transform: translate(-50%, -62%) scale(1.04);
}

.village-log,
.achievement,
.cyan-loop {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  padding: 11px 12px;
}

.village-log p,
.achievement p,
.achievement h2,
.cyan-loop p,
.cyan-loop h2 {
  margin: 0;
}

.village-log {
  min-height: 42px;
  font-size: 13px;
  line-height: 1.5;
}

.achievement {
  background: rgba(142, 116, 74, 0.08);
}

.achievement-kicker,
.cyan-loop-kicker {
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
}

.achievement h2,
.cyan-loop h2 {
  margin-top: 2px;
  font-size: 17px;
}

.achievement p:last-child,
.cyan-loop p {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

.cyan-loop {
  display: grid;
  gap: 8px;
  border-color: rgba(99, 180, 210, 0.72);
  background: rgba(99, 180, 210, 0.08);
}

.cyan-loop[hidden] {
  display: none;
}

.cyan-loop-choices {
  display: grid;
  gap: 7px;
}

.cyan-choice {
  min-height: 40px;
  border: 1px solid rgba(99, 180, 210, 0.54);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text);
  padding: 9px 10px;
  text-align: left;
  line-height: 1.35;
  cursor: pointer;
}

.cyan-choice:hover:not(:disabled) {
  border-color: var(--cyan-dark);
}

.cyan-choice.is-selected {
  border-color: var(--cyan-dark);
  background: rgba(99, 180, 210, 0.18);
}

.cyan-choice:disabled {
  cursor: default;
}

.controls {
  display: flex;
  gap: 8px;
}

.controls button {
  min-height: 40px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  border-radius: 6px;
  padding: 9px 12px;
  cursor: pointer;
}

@media (max-width: 420px) {
  .app-shell {
    padding: 12px;
  }

  .village-board {
    min-height: 470px;
  }

  .village-node {
    min-width: 52px;
    font-size: 11px;
    padding: 7px 8px;
  }

  .player-token {
    width: 20px;
    height: 20px;
  }
}
```

- [ ] **Step 2: Run state tests after CSS changes**

Run:

```powershell
node app/pre-cyan-village/village-state.test.js
```

Expected: every line starts with `PASS`; process exits with code `0`.

- [ ] **Step 3: Commit styles**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village/styles.css
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "style: show pre-cyan token movement"
```

Expected: commit succeeds.

## Task 5: Static Contract and Browser Verification

**Files:**
- Create: `app/pre-cyan-village/static-contract.test.js`
- Test: `app/pre-cyan-village/static-contract.test.js`
- Test: `app/pre-cyan-village/village-state.test.js`

- [ ] **Step 1: Add static contract tests**

Create `app/pre-cyan-village/static-contract.test.js` with this complete file:

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const files = [
  'index.html',
  'styles.css',
  'village-data.js',
  'village-state.js',
  'village-render.js'
];

const source = files
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('token and Cyan loop hosts exist', () => {
  assert.match(source, /id="player-token"/);
  assert.match(source, /id="cyan-loop"/);
  assert.match(source, /data-cyan-choice/);
});

test('movement locking and fallback are wired', () => {
  assert.match(source, /aria-busy/);
  assert.match(source, /MOVE_FALLBACK_MS/);
  assert.match(source, /transitionend/);
  assert.match(source, /completingMove/);
});

test('first experience avoids banned instructional strings', () => {
  ['필수 기초 단어 놀이터', '이해함', '점수', '학습 완료'].forEach((text) => {
    assert.equal(source.includes(text), false, text);
  });
});
```

- [ ] **Step 2: Run all local tests**

Run:

```powershell
node app/pre-cyan-village/village-state.test.js
node app/pre-cyan-village/static-contract.test.js
```

Expected: all lines start with `PASS`; both commands exit with code `0`.

- [ ] **Step 3: Run whitespace check**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon diff --check
```

Expected: no output and exit code `0`.

- [ ] **Step 4: Open the static app manually for visual verification**

Open this file in a browser:

```text
D:\jhkSandBox\CODE\good-afternoon\app\pre-cyan-village\index.html
```

Verify this exact flow:

1. Initial load shows the token on `내 방`.
2. Click `편의점`; token moves before the log changes to `봉투값이 붙었다.`
3. While token is moving, click another node; it does not create a second visit.
4. Visit enough public places to unlock `Cyan 입구`.
5. Click `Cyan 입구`; token moves there, `첫 길` appears, and the Cyan loop appears.
6. Click `교통카드 잔액을 내고 이동 시간을 얻는다.`; log changes to `맞아. 뭔가를 내고, 길을 얻었다.`
7. Refresh; token remains at `Cyan 입구`, the achievement remains visible, and the Cyan loop state remains persisted.
8. Click `초기화`; token returns to `내 방` and Cyan state disappears.
9. Set browser viewport to `390 x 844`; token, nodes, log, achievement, and choices do not overlap.

- [ ] **Step 5: Commit verification tests**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village/static-contract.test.js
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "test: verify pre-cyan token contracts"
```

Expected: commit succeeds.

## Task 6: Final Verification and Documentation Touch

**Files:**
- Modify: `README.md`
- Test: `app/pre-cyan-village/village-state.test.js`
- Test: `app/pre-cyan-village/static-contract.test.js`

- [ ] **Step 1: Update README demo notes**

In `README.md`, update the Pre-Cyan demo description so it states that the demo now includes token movement and a first Cyan loop. Use this replacement paragraph wherever the Pre-Cyan demo is described:

```markdown
The active first slice is `app/pre-cyan-village/`: a static Pre-Cyan village demo where a player token moves between unlocked places, reaches the Cyan gate, and opens one minimal Cyan exchange judgment loop. It runs directly from `index.html`; no build step is required.
```

- [ ] **Step 2: Run all tests and static checks**

Run:

```powershell
node app/pre-cyan-village/village-state.test.js
node app/pre-cyan-village/static-contract.test.js
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon diff --check
```

Expected: both Node test commands print only `PASS` lines; `diff --check` prints nothing.

- [ ] **Step 3: Inspect final git status**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon status --short --branch
```

Expected: README is the only modified file before the documentation commit.

- [ ] **Step 4: Commit documentation**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add README.md
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "docs: describe pre-cyan cyan loop"
```

Expected: commit succeeds.

- [ ] **Step 5: Final status check**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon status --short --branch
```

Expected: `## main...origin/main [ahead N]` with no modified, staged, or untracked files.

## Self-Review

Spec coverage:

- Player token on Pre-Cyan map: Task 3 adds `#player-token`, Task 4 styles it.
- Node click moves token before state update: Task 1 adds `startMove` and `completeMove`; Task 3 wires them.
- Input locked while moving: Task 3 disables node buttons and sets `aria-busy`; Task 5 tests static wiring.
- Last path highlight: Task 3 adds `is-last-move`; Task 4 styles it.
- Cyan gate as destination: Task 1 handles `cyanGate` in movement completion; Task 3 removes the separate gate button.
- First achievement after gate arrival: Task 1 `enterGate`; Task 3 renders `achievement`.
- One Cyan minimal loop: Task 2 data, Task 1 `answerCyanLoop`, Task 3 renders choices.
- Existing localStorage migration: Task 1 `normalizeState` and migration test.
- Error handling for malformed storage, unknown nodes, locked nodes, moving state, transition fallback: Task 1 and Task 3.
- Accessibility: Task 3 keeps node buttons, marks token `aria-hidden`, sets `aria-busy`, and uses button choices.
- Mobile verification: Task 5 manual browser flow includes `390 x 844`.
- Banned strings: Task 5 static contract test scans app files.

Placeholder scan:

- No placeholder marker or undefined deferred work remains in this plan.
- Every code-changing step includes complete replacement content or exact replacement text.
- Commands include expected results.

Type consistency:

- State fields match the spec: `playerNodeId`, `movingToNodeId`, `lastMove`, `currentStage`, `cyanLoopSeen`, `cyanLoopCompleted`.
- Extra field `cyanLoopResult` is defined in Task 1 before Task 3 uses it.
- Function names are consistent: `startMove`, `completeMove`, `answerCyanLoop`.
- Data names are consistent: `cyanFirstLoop`, `correctChoiceId`, `choices`.
