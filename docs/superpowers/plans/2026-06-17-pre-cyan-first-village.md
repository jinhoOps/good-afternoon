# Pre-Cyan First Village Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the planning direction and start a fresh static implementation of the Pre-Cyan first village without treating the existing demo HTML as production code.

**Architecture:** Existing root HTML files are reference artifacts only. The new implementation lives under `app/pre-cyan-village/` as a small Vanilla HTML/CSS/JS app with separated data, state, rendering, and styles. Documentation is updated first so the repository clearly distinguishes planning mockups from the new build path.

**Tech Stack:** Markdown, Vanilla HTML, CSS, JavaScript modules, browser `localStorage`, PowerShell verification commands.

---

## File Structure

- Modify `PROJECT_CONTEXT.md`: update Pre-Cyan from word-card lobby to first adventure village.
- Modify `README.md`: clarify that existing HTML files are visual planning artifacts and the new app lives under `app/pre-cyan-village/`.
- Modify `DESIGN.md`: align visual guidance with mobile-first game village, short logs, and achievement timing.
- Modify `harness/30_mastery_spec.md`: separate Pre-Cyan entry experience from K-tier mastery.
- Create `app/pre-cyan-village/index.html`: standalone mobile-first static app shell.
- Create `app/pre-cyan-village/styles.css`: village layout, node states, log, achievement, and mobile viewport rules.
- Create `app/pre-cyan-village/village-data.js`: node graph, logs, edges, and unlock metadata.
- Create `app/pre-cyan-village/village-state.js`: localStorage load/save/reset and unlock rules.
- Create `app/pre-cyan-village/village-render.js`: DOM rendering and event wiring.
- Do not modify `goodafternoon_integrated_demo.html` in this plan except to reference it from docs as a prior planning demo.
- Do not modify `goodafternoon_mathflat_edition.html`; it remains an assessment-style artifact outside this MVP.

## Task 1: Documentation Alignment

**Files:**
- Modify: `PROJECT_CONTEXT.md`
- Modify: `README.md`
- Modify: `DESIGN.md`
- Modify: `harness/30_mastery_spec.md`

- [ ] **Step 1: Inspect current references to the old Pre-Cyan concept**

Run:

```powershell
Select-String -Path PROJECT_CONTEXT.md,README.md,DESIGN.md,harness\30_mastery_spec.md -Pattern 'Pre-Cyan|대기실|단어|놀이터|학습|카드|마스터리|Easy to learn'
```

Expected: Output shows old-card-lobby references and any design guidance that conflicts with the approved first-village direction.

- [ ] **Step 2: Update `PROJECT_CONTEXT.md`**

Change the Pre-Cyan description in section `3.1 전체 구조` to this wording:

```markdown
  - 🐣 **Pre-Cyan 티어**: 첫 모험 마을 (0단계)
    - *대상: 경제라는 단어에 부담을 느끼거나, 경제활동 경험이 알바/용돈 수준인 입문자*
    - *성격: 단어 카드나 퀴즈가 아니라, 현실 동네를 닮은 게임 마을을 둘러보고 만져보며 적응하는 첫 지역*
    - *흐름: 내 방에서 시작해 편의점, 버스정류장, 알바처, 은행, 구독함, 복권방을 눌러본다. 사용자가 내 방을 포함해 공개 장소 4개를 방문하면 Cyan 입구가 열린다.*
    - *원칙: 장소 먼저, 개념 나중. 경제 용어와 업적은 첫 경험 전면에 두지 않는다.*
    - *숨김 요소: 복권방 뒤 어두운 골목은 발견한 사람만 나중에 투자 브랜치에서 일부 반응을 먼저 본다.*
```

Also update section `8.1 최우선 과제` so the Easy-to-learn item reads:

```markdown
- **Easy to learn 개선**: Pre-Cyan을 단어 카드 대기실이 아니라 모바일 세로 한 화면 기준의 첫 모험 마을로 재설계한다. 사용자는 설명을 읽기보다 장소를 만지고, 짧은 로그와 연결 노드 활성화를 통해 조작 방식을 익힌다.
```

- [ ] **Step 3: Update `README.md`**

Replace the `3줄 요약` Pre-Cyan bullet with:

```markdown
2. **[피드백 반영 (Easy to Learn)]** 경제 단어를 먼저 보여주지 않고, 모바일 세로 화면 기준의 **Pre-Cyan 첫 모험 마을**에서 내 방·편의점·버스정류장·알바처·은행 같은 장소를 만지며 적응하는 0단계를 새 구현 방향으로 확정했습니다.
```

Add this note under `프로젝트 주요 구성`:

```markdown
- **app/pre-cyan-village/**: 새로 구현할 Pre-Cyan 첫 모험 마을 정적 앱. 기존 HTML 데모는 기획 검증용 시각 자료이며, 새 구현의 소스가 아닙니다.
```

Replace the old demo instruction that treats the integrated HTML as the main product with:

```markdown
현재 루트의 HTML 파일들은 기획 검증용 시각 자료입니다. 새 Pre-Cyan 첫 모험 마을은 `app/pre-cyan-village/index.html`에서 독립적으로 구현합니다.
```

- [ ] **Step 4: Update `DESIGN.md`**

Add this subsection near the beginning of the design guidance before component-level rules:

```markdown
## Pre-Cyan First Village Direction

Pre-Cyan은 학습 카드 묶음이 아니라 첫 모험 마을이다. 화면은 모바일 세로 한 화면을 1차 기준으로 하며, 현실 동네의 장소를 게임 업적 보드처럼 연결한다.

Design rules:
- 장소 먼저, 개념 나중.
- 짧은 로그 중심. 긴 설명, 학습 완료 문구, 점수형 보상은 첫 경험 전면에 두지 않는다.
- 업적은 Pre-Cyan 클리어 직후 처음 보여준다.
- 복권방은 공개 장소, 복권방 뒤 어두운 골목은 숨은 투자 씨앗으로 둔다.
- 카드 그리드 UI는 Pre-Cyan 첫 경험의 기본형으로 사용하지 않는다.
- 기존 HTML 데모의 표현은 참고 자료로만 보고, 새 구현은 `app/pre-cyan-village/`에서 시작한다.
```

If an older `Do` or `Don't` rule explicitly recommends card-grid learning for Pre-Cyan, replace it with:

```markdown
- Do use a node-and-path village map for Pre-Cyan.
- Don't present Pre-Cyan as a vocabulary card checklist.
```

- [ ] **Step 5: Update `harness/30_mastery_spec.md`**

Add this clarification near the top of the document:

```markdown
## Scope Clarification: Pre-Cyan vs K Tier

Pre-Cyan is the entry experience. Its job is to reduce friction and help a first-time user adapt through a mobile-first village map. It does not teach mastery and does not expose score, progress, or achievement systems before the user clears the first region.

K tier is the mastery experience. Its job is depth: synthesis, delayed feedback, diagnostics, and harder judgment. Do not move K-tier complexity into Pre-Cyan.
```

- [ ] **Step 6: Verify documentation no longer describes Pre-Cyan as the primary word-card lobby**

Run:

```powershell
Select-String -Path PROJECT_CONTEXT.md,README.md,DESIGN.md,harness\30_mastery_spec.md -Pattern '필수 기초 단어 놀이터|단어 카드 대기실|이해함'
```

Expected: No matches in `PROJECT_CONTEXT.md`, `README.md`, `DESIGN.md`, or `harness/30_mastery_spec.md`.

- [ ] **Step 7: Commit documentation alignment**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add PROJECT_CONTEXT.md README.md DESIGN.md harness/30_mastery_spec.md
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "docs: align pre-cyan first village direction"
```

Expected: Commit succeeds with only documentation files.

## Task 2: Scaffold Fresh Pre-Cyan App

**Files:**
- Create: `app/pre-cyan-village/index.html`
- Create: `app/pre-cyan-village/styles.css`
- Create: `app/pre-cyan-village/village-data.js`
- Create: `app/pre-cyan-village/village-state.js`
- Create: `app/pre-cyan-village/village-render.js`

- [ ] **Step 1: Create the app directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path app\pre-cyan-village | Out-Null
```

Expected: `app/pre-cyan-village/` exists.

- [ ] **Step 2: Create `index.html`**

Create `app/pre-cyan-village/index.html` with:

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

    <section class="village-board" aria-label="Pre-Cyan 첫 모험 마을">
      <svg class="village-paths" viewBox="0 0 100 100" aria-hidden="true" focusable="false"></svg>
      <div class="village-nodes" id="village-nodes"></div>
    </section>

    <section class="village-log" aria-live="polite">
      <p id="village-log-text">나가기 전에 하나만 챙기면 된다.</p>
    </section>

    <section class="achievement" id="achievement" hidden>
      <p class="achievement-kicker">기록</p>
      <h2>첫 길</h2>
      <p>마을 밖으로 나갈 준비가 됐다.</p>
    </section>

    <footer class="controls">
      <button type="button" id="enter-gate" hidden>들어가기</button>
      <button type="button" id="reset-state">초기화</button>
    </footer>
  </main>

  <script type="module" src="./village-render.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create empty module files with valid exports**

Create `app/pre-cyan-village/village-data.js` with:

```javascript
export const villageNodes = {};
export const villageEdges = [];
```

Create `app/pre-cyan-village/village-state.js` with:

```javascript
export function createInitialState() {
  return {};
}
```

Create `app/pre-cyan-village/village-render.js` with:

```javascript
import { villageNodes, villageEdges } from './village-data.js';
import { createInitialState } from './village-state.js';

const state = createInitialState();

console.info('Pre-Cyan village ready', {
  nodeCount: Object.keys(villageNodes).length,
  edgeCount: villageEdges.length,
  state
});
```

- [ ] **Step 4: Verify the shell opens as a static file**

Open `app/pre-cyan-village/index.html` in a browser.

Expected:

```text
1. The page loads.
2. The title reads Good Afternoon.
3. The console logs "Pre-Cyan village ready".
4. There are no module import errors.
```

- [ ] **Step 5: Commit scaffold**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "feat: scaffold pre-cyan village app"
```

Expected: Commit succeeds.

## Task 3: Implement Village Data And State Rules

**Files:**
- Modify: `app/pre-cyan-village/village-data.js`
- Modify: `app/pre-cyan-village/village-state.js`

- [ ] **Step 1: Replace `village-data.js` with the approved graph**

Use:

```javascript
export const villageNodes = {
  room: { id: 'room', label: '내 방', log: '카드를 챙겼다.', x: 50, y: 76, unlocks: ['store', 'bus'], startsUnlocked: true },
  store: { id: 'store', label: '편의점', log: '봉투값이 붙었다.', x: 28, y: 55, unlocks: ['work', 'subscriptions', 'lottery'] },
  bus: { id: 'bus', label: '버스정류장', log: '잔액이 부족하다.', x: 70, y: 56, unlocks: ['bank'] },
  work: { id: 'work', label: '알바처', log: '입금액이 예상보다 작다.', x: 24, y: 34, unlocks: ['bank'] },
  subscriptions: { id: 'subscriptions', label: '구독함', log: '이번 달에도 빠졌다.', x: 52, y: 35, unlocks: [] },
  bank: { id: 'bank', label: '은행', log: '숫자가 조금 늘었다.', x: 78, y: 34, unlocks: [] },
  lottery: { id: 'lottery', label: '복권방', log: '같은 번호가 또 걸려 있다.', x: 18, y: 18, unlocks: [] },
  alley: { id: 'alley', label: '어두운 골목', log: '불이 잠깐 켜졌다.', x: 9, y: 9, unlocks: [], hidden: true },
  cyanGate: { id: 'cyanGate', label: 'Cyan 입구', log: '길이 열렸다.', x: 82, y: 14, unlocks: [], gate: true }
};

export const villageEdges = [
  ['room', 'store'],
  ['room', 'bus'],
  ['store', 'work'],
  ['store', 'subscriptions'],
  ['store', 'lottery'],
  ['bus', 'bank'],
  ['work', 'bank'],
  ['bank', 'cyanGate'],
  ['lottery', 'alley']
];
```

- [ ] **Step 2: Replace `village-state.js` with state helpers**

Use:

```javascript
import { villageNodes } from './village-data.js';

export const STORAGE_KEY = 'goodafternoon.preCyanVillage.v1';

export function createInitialState() {
  return {
    unlocked: ['room'],
    visited: [],
    log: '나가기 전에 하나만 챙기면 된다.',
    cyanGateUnlocked: false,
    lotterySeen: false,
    backAlleyDiscovered: false,
    backAlleyEntered: false,
    firstAchievementShown: false
  };
}

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();
    const parsed = JSON.parse(saved);
    return {
      ...createInitialState(),
      ...parsed,
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : ['room'],
      visited: Array.isArray(parsed.visited) ? parsed.visited : []
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return createInitialState();
}

export function isNodeUnlocked(state, id) {
  if (id === 'cyanGate') return state.cyanGateUnlocked;
  if (id === 'alley') return state.backAlleyDiscovered;
  return state.unlocked.includes(id);
}

export function countVisitedPublicPlaces(state) {
  return state.visited.filter((id) => {
    const node = villageNodes[id];
    return node && !node.hidden && !node.gate;
  }).length;
}

export function visitNode(state, id) {
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

export function enterGate(state) {
  if (!state.cyanGateUnlocked) return state;
  return {
    ...state,
    log: villageNodes.cyanGate.log,
    firstAchievementShown: true
  };
}
```

- [ ] **Step 3: Commit data and state**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village/village-data.js app/pre-cyan-village/village-state.js
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "feat: define pre-cyan village graph state"
```

Expected: Commit succeeds.

## Task 4: Implement Rendering And Styling

**Files:**
- Modify: `app/pre-cyan-village/village-render.js`
- Modify: `app/pre-cyan-village/styles.css`

- [ ] **Step 1: Replace `village-render.js`**

Use:

```javascript
import { villageEdges, villageNodes } from './village-data.js';
import { enterGate, isNodeUnlocked, loadState, resetState, saveState, visitNode } from './village-state.js';

const nodesHost = document.querySelector('#village-nodes');
const pathsHost = document.querySelector('.village-paths');
const logText = document.querySelector('#village-log-text');
const achievement = document.querySelector('#achievement');
const enterButton = document.querySelector('#enter-gate');
const resetButton = document.querySelector('#reset-state');

let currentState = loadState();

function renderPaths() {
  pathsHost.innerHTML = villageEdges.map(([from, to]) => {
    const fromNode = villageNodes[from];
    const toNode = villageNodes[to];
    const isLit = isNodeUnlocked(currentState, from) && isNodeUnlocked(currentState, to);
    return `<line class="village-path ${isLit ? 'is-lit' : ''}" x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}"></line>`;
  }).join('');
}

function renderNodes() {
  nodesHost.innerHTML = Object.values(villageNodes).map((node) => {
    const unlocked = isNodeUnlocked(currentState, node.id);
    const visited = currentState.visited.includes(node.id);
    const hidden = node.hidden && !currentState.backAlleyDiscovered;
    const classes = ['village-node', unlocked ? 'is-unlocked' : '', visited ? 'is-visited' : '', hidden ? 'is-hidden' : ''].filter(Boolean).join(' ');
    return `<button class="${classes}" type="button" style="--x:${node.x};--y:${node.y}" data-node-id="${node.id}" ${unlocked ? '' : 'disabled'}>${node.label}</button>`;
  }).join('');
}

function render() {
  renderPaths();
  renderNodes();
  logText.textContent = currentState.log;
  achievement.hidden = !currentState.firstAchievementShown;
  enterButton.hidden = !currentState.cyanGateUnlocked || currentState.firstAchievementShown;
}

nodesHost.addEventListener('click', (event) => {
  const button = event.target.closest('[data-node-id]');
  if (!button) return;
  currentState = visitNode(currentState, button.dataset.nodeId);
  saveState(currentState);
  render();
});

enterButton.addEventListener('click', () => {
  currentState = enterGate(currentState);
  saveState(currentState);
  render();
});

resetButton.addEventListener('click', () => {
  currentState = resetState();
  render();
});

render();
```

- [ ] **Step 2: Replace `styles.css`**

Use:

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
}

.village-path.is-lit {
  stroke: rgba(142, 116, 74, 0.72);
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
  transition: opacity 180ms ease, filter 180ms ease, transform 180ms ease, border-color 180ms ease;
}

.village-node.is-unlocked {
  opacity: 1;
  filter: none;
}

.village-node.is-visited {
  border-color: var(--accent);
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

.village-log,
.achievement {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  padding: 11px 12px;
}

.village-log p,
.achievement p,
.achievement h2 {
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

.achievement-kicker {
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
}

.achievement h2 {
  margin-top: 2px;
  font-size: 17px;
}

.achievement p:last-child {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
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

#enter-gate {
  border-color: var(--cyan);
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
}
```

- [ ] **Step 3: Commit rendering and styles**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "feat: render pre-cyan first village"
```

Expected: Commit succeeds.

## Task 5: Verification

**Files:**
- Modify if needed: `app/pre-cyan-village/*.js`
- Modify if needed: `app/pre-cyan-village/styles.css`

- [ ] **Step 1: Static string verification**

Run:

```powershell
Select-String -Path app\pre-cyan-village\* -Pattern '필수 기초 단어 놀이터|이해함|점수|학습 완료'
```

Expected: No matches.

- [ ] **Step 2: Browser smoke test**

Open `app/pre-cyan-village/index.html` in a browser and verify:

```text
1. 내 방만 활성화되어 있다.
2. 내 방 클릭 후 편의점과 버스정류장이 활성화된다.
3. 내 방을 포함해 공개 장소 4개 방문 후 Cyan 입구가 열린다.
4. Cyan 입구를 누른 뒤에야 첫 업적이 보인다.
5. 복권방 방문 후 은행 방문 또는 편의점 재방문 시 어두운 골목이 보인다.
6. 새로고침 후 방문 상태가 유지된다.
7. 초기화 버튼으로 상태가 초기화된다.
```

- [ ] **Step 3: Mobile viewport check**

Use browser responsive mode at `390x844` and verify:

```text
1. 마을 지도가 한 화면 안에서 주요 노드를 보여준다.
2. 로그와 버튼이 화면 하단에서 겹치지 않는다.
3. 노드 라벨이 버튼 밖으로 튀어나오지 않는다.
4. 가로 스크롤이 생기지 않는다.
```

- [ ] **Step 4: Final git status check**

Run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon status --short
```

Expected: Only intended files are modified. No `.superpowers/` files appear because `.gitignore` excludes them.

- [ ] **Step 5: Commit verification fixes**

If verification required fixes, run:

```powershell
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon add app/pre-cyan-village
git -c safe.directory=D:/jhkSandBox/CODE/good-afternoon commit -m "fix: polish pre-cyan village verification issues"
```

Expected: Commit succeeds only if there were fixes. If there were no fixes, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers documentation cleanup, fresh implementation under `app/pre-cyan-village/`, mobile-first village UI, hidden lottery alley, localStorage state, achievement timing, and verification criteria.
- Placeholder scan: No `TBD`, `TODO`, or unbounded implementation steps remain.
- Type consistency: State fields match the approved spec: `unlocked`, `visited`, `cyanGateUnlocked`, `lotterySeen`, `backAlleyDiscovered`, `backAlleyEntered`, and `firstAchievementShown`.

