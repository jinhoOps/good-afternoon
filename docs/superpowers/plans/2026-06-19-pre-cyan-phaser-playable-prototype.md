# Pre-Cyan Phaser Playable Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-Cyan 첫 경험에 Phaser 기반 2D 플레이어블 프로토타입을 추가하고, 검증 통과 후 DOM 런타임을 제거할 수 있는 전환 경로를 만든다.

**Architecture:** 기존 `src/pre-cyan-village/domain/`의 상태, 저장, 외출 규칙은 유지하고 `src/pre-cyan-village/game/` 아래 Phaser 런타임과 도메인 어댑터를 새로 둔다. 개발 중에는 DOM 런타임을 기본 진입점으로 유지하고 `?runtime=phaser`로 Phaser를 실행한다. Phaser가 방 시작, 마을 진입, 3회 상호작용, 자동 귀가, 저장/복구, 모바일/배포 검증을 통과하면 기본 진입점을 Phaser로 바꾸고 DOM 제거는 별도 정리 커밋으로 수행한다.

**Tech Stack:** Vite 6, TypeScript 5.8, Node test runner via `tsx --test`, Phaser 3.x, Playwright

---

## File Structure

- Modify: `package.json`
  - `phaser` 런타임 의존성을 추가한다.
- Modify: `src/pre-cyan-village/index.html`
  - 기존 DOM 호스트를 유지하고 Phaser 캔버스 호스트와 `data-runtime` 표식을 추가한다.
- Modify: `src/pre-cyan-village/main.ts`
  - URL 플래그로 DOM 런타임과 Phaser 런타임을 분기한다.
- Modify: `src/pre-cyan-village/styles.css`
  - Phaser 캔버스 호스트, 모바일 조작 UI, DOM/Phaser 표시 전환 스타일을 추가한다.
- Create: `src/pre-cyan-village/game/main-game.ts`
  - Phaser `Game` 생성과 파괴를 담당한다.
- Create: `src/pre-cyan-village/game/adapters/outing-session.ts`
  - Phaser 씬이 `startOuting`, `selectHotspot`, `recordMoneyFeverClick`을 직접 알지 않도록 감싼다.
- Create: `src/pre-cyan-village/game/adapters/storage-adapter.ts`
  - 안전한 localStorage 접근, 로드, 저장을 한곳에 모은다.
- Create: `src/pre-cyan-village/game/config/map-layout.ts`
  - 방/마을 좌표, 충돌 박스, 상호작용 반경, 표시 라벨을 Phaser와 테스트가 함께 쓰는 순수 데이터로 둔다.
- Create: `src/pre-cyan-village/game/objects/Player.ts`
  - 키보드와 모바일 방향 입력을 받아 플레이어를 이동시킨다.
- Create: `src/pre-cyan-village/game/objects/InteractionPrompt.ts`
  - 근처 상호작용 힌트 라벨을 표시한다.
- Create: `src/pre-cyan-village/game/objects/DeviceHud.ts`
  - 짧은 단말 로그와 모바일 버튼을 표시한다.
- Create: `src/pre-cyan-village/game/objects/PathGlow.ts`
  - 3번째 핵심 상호작용 후 귀가 경로 연출을 표시한다.
- Create: `src/pre-cyan-village/game/scenes/RoomScene.ts`
  - 방, 문, 기록 흔적, 마을 전환을 담당한다.
- Create: `src/pre-cyan-village/game/scenes/VillageScene.ts`
  - 마을, 장소 접근, 명시적 상호작용, 자동 귀가를 담당한다.
- Create: `src/pre-cyan-village/assets/*.svg`
  - 플레이어, 방, 은행, 편의점, 정류장, 게시판, 복권방, Cyan 흔적 등 최소 SVG 자산을 둔다.
- Create: `src/pre-cyan-village/tests/game-adapter.test.ts`
  - Phaser 없이 외출 어댑터 상태 전이를 검증한다.
- Create: `src/pre-cyan-village/tests/game-layout.test.ts`
  - Phaser 없이 좌표/상호작용 반경/핵심 장소 매핑을 검증한다.
- Modify: `src/pre-cyan-village/tests/static-contract.test.ts`
  - Phaser 호스트, 런타임 플래그, 금지 문자열, GitHub Pages base 계약을 검증한다.
- Create: `src/pre-cyan-village/tests/phaser-smoke.spec.ts`
  - Playwright 브라우저 스모크 절차를 문서화된 실행 파일로 둔다.
- Modify: `README.md`
  - 개발 중 DOM 기본값과 `?runtime=phaser` 실행 방법, 전환 조건을 기록한다.

## Task 1: Phaser Dependency And Runtime Flag

**Files:**
- Modify: `package.json`
- Modify: `src/pre-cyan-village/index.html`
- Modify: `src/pre-cyan-village/main.ts`
- Modify: `src/pre-cyan-village/tests/static-contract.test.ts`

- [ ] **Step 1: Install Phaser**

Run:

```bash
npm install phaser@^3.90.0
```

Expected: `package.json` and `package-lock.json` include `phaser`.

- [ ] **Step 2: Write the failing static contract test**

Append this test to `src/pre-cyan-village/tests/static-contract.test.ts`:

```typescript
test('Vite entry can host DOM and Phaser runtimes during migration', () => {
  const indexHtml = readVillageFile('index.html');
  const mainSource = readVillageFile('main.ts');

  assert.ok(indexHtml.includes('id="phaser-game"'));
  assert.ok(indexHtml.includes('data-runtime="dom"'));
  assert.match(mainSource, /URLSearchParams/);
  assert.match(mainSource, /runtime=phaser|runtimeSearch/);
  assert.match(mainSource, /startPreCyanGame/);
  assert.match(mainSource, /wireEvents/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
npm test -- src/pre-cyan-village/tests/static-contract.test.ts
```

Expected: FAIL because `phaser-game` and `startPreCyanGame` do not exist.

- [ ] **Step 4: Add Phaser host without removing DOM host**

Update `src/pre-cyan-village/index.html` so the body keeps the existing DOM markup and adds this canvas host immediately before `<script type="module" src="./main.ts"></script>`:

```html
  <section class="game-shell" id="phaser-shell" data-runtime="dom" hidden>
    <div class="game-host" id="phaser-game" aria-label="Pre-Cyan playable prototype"></div>
  </section>

  <script type="module" src="./main.ts"></script>
```

- [ ] **Step 5: Split main runtime by URL flag**

Replace `src/pre-cyan-village/main.ts` with:

```typescript
import './styles.css';
import { createInitialState, loadState, saveState } from './domain/state';
import { wireEvents } from './view/events';
import { queryAppElements, renderApp } from './view/render';
import { startPreCyanGame } from './game/main-game';
import type { StorageLike } from '../shared/storage/local-storage';

function getSafeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function runtimeSearch(): 'dom' | 'phaser' {
  const params = new URLSearchParams(window.location.search);
  return params.get('runtime') === 'phaser' ? 'phaser' : 'dom';
}

const storage = getSafeStorage();
const initialState = storage ? loadState(storage) : createInitialState();

if (storage) {
  saveState(storage, initialState);
}

if (runtimeSearch() === 'phaser') {
  document.documentElement.dataset.runtime = 'phaser';
  const shell = document.querySelector<HTMLElement>('#phaser-shell');
  const host = document.querySelector<HTMLElement>('#phaser-game');
  if (!shell || !host) throw new Error('Missing Phaser game host');
  shell.hidden = false;
  shell.dataset.runtime = 'phaser';
  startPreCyanGame({ host, storage, initialState });
} else {
  document.documentElement.dataset.runtime = 'dom';
  const elements = queryAppElements();
  renderApp(elements, initialState);
  wireEvents(elements, initialState, storage);
}
```

- [ ] **Step 6: Create a temporary game entry that compiles**

Create `src/pre-cyan-village/game/main-game.ts`:

```typescript
import type { VillageState } from '../../shared/types/village';
import type { StorageLike } from '../../shared/storage/local-storage';

export type PreCyanGameOptions = {
  host: HTMLElement;
  storage: StorageLike | null;
  initialState: VillageState;
};

export type PreCyanGameHandle = {
  destroy(): void;
};

export function startPreCyanGame(options: PreCyanGameOptions): PreCyanGameHandle {
  options.host.textContent = options.initialState.log;
  return {
    destroy() {
      options.host.replaceChildren();
    }
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run:

```bash
npm test -- src/pre-cyan-village/tests/static-contract.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/pre-cyan-village/index.html src/pre-cyan-village/main.ts src/pre-cyan-village/game/main-game.ts src/pre-cyan-village/tests/static-contract.test.ts
git commit -m "feat: add phaser runtime flag"
```

## Task 2: Outing Session Adapter

**Files:**
- Create: `src/pre-cyan-village/game/adapters/outing-session.ts`
- Create: `src/pre-cyan-village/game/adapters/storage-adapter.ts`
- Create: `src/pre-cyan-village/tests/game-adapter.test.ts`

- [ ] **Step 1: Write the failing adapter tests**

Create `src/pre-cyan-village/tests/game-adapter.test.ts`:

```typescript
import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialState } from '../domain/state';
import { createOutingSession } from '../game/adapters/outing-session';
import { createMemoryStorage, loadGameState, saveGameState } from '../game/adapters/storage-adapter';
import { STORAGE_KEY } from '../domain/state';
import type { HotspotId } from '../../shared/types/village';

test('outing session starts from the room and enters the village board state', () => {
  const session = createOutingSession(createInitialState(), null);
  const started = session.start();

  assert.equal(started.screen, 'villageBoard');
  assert.equal(started.currentOutingId, 'settling');
  assert.deepEqual(started.currentOutingSelections, []);
});

test('outing session records three core interactions and returns to the room', () => {
  const session = createOutingSession(createInitialState(), null);
  session.start();

  for (const hotspotId of ['bankCounter', 'storeFront', 'busStop'] as HotspotId[]) {
    session.interact(hotspotId, 1000);
  }

  const state = session.getState();
  assert.equal(state.screen, 'room');
  assert.equal(state.outingHistory.length, 1);
  assert.deepEqual(state.outingHistory[0].selections, ['bankCounter', 'storeFront', 'busStop']);
  assert.equal(state.roomFeatures.firstRecord, true);
});

test('outing session ignores duplicate hotspot interactions', () => {
  const session = createOutingSession(createInitialState(), null);
  session.start();
  session.interact('bankCounter', 1000);
  const unchanged = session.interact('bankCounter', 1001);

  assert.equal(unchanged.currentOutingSelections.length, 1);
  assert.deepEqual(unchanged.currentOutingSelections, ['bankCounter']);
});

test('game storage adapter saves, loads, and recovers corrupt data', () => {
  const storage = createMemoryStorage();
  const initial = createInitialState();
  const saved = saveGameState(storage, initial);

  assert.equal(saved.screen, 'room');
  assert.ok(storage.getItem(STORAGE_KEY));

  storage.setItem(STORAGE_KEY, '{"screen":"villageBoard","currentOutingId":"missing"}');
  const recovered = loadGameState(storage);
  assert.equal(recovered.screen, 'room');
  assert.equal(recovered.currentOutingId, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/pre-cyan-village/tests/game-adapter.test.ts
```

Expected: FAIL because `outing-session.ts` and `storage-adapter.ts` do not exist.

- [ ] **Step 3: Implement storage adapter**

Create `src/pre-cyan-village/game/adapters/storage-adapter.ts`:

```typescript
import { createInitialState, loadState, saveState } from '../../domain/state';
import type { StorageLike } from '../../../shared/storage/local-storage';
import type { VillageState } from '../../../shared/types/village';

export function createMemoryStorage(seed: Record<string, string> = {}): StorageLike {
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

export function loadGameState(storage: StorageLike | null): VillageState {
  return storage ? loadState(storage) : createInitialState();
}

export function saveGameState(storage: StorageLike | null, state: VillageState): VillageState {
  return storage ? saveState(storage, state) : state;
}
```

- [ ] **Step 4: Implement outing session adapter**

Create `src/pre-cyan-village/game/adapters/outing-session.ts`:

```typescript
import { recordMoneyFeverClick, selectHotspot, startOuting } from '../../domain/state';
import { saveGameState } from './storage-adapter';
import type { StorageLike } from '../../../shared/storage/local-storage';
import type { HotspotId, VillageState } from '../../../shared/types/village';

function isFinanceHotspot(hotspotId: HotspotId): boolean {
  return hotspotId === 'bankAtm' || hotspotId === 'bankCounter';
}

export type OutingSession = {
  getState(): VillageState;
  replaceState(nextState: VillageState): VillageState;
  start(): VillageState;
  interact(hotspotId: HotspotId, nowMs: number): VillageState;
};

export function createOutingSession(initialState: VillageState, storage: StorageLike | null): OutingSession {
  let currentState = initialState;

  function commit(nextState: VillageState): VillageState {
    currentState = saveGameState(storage, nextState);
    return currentState;
  }

  return {
    getState() {
      return currentState;
    },
    replaceState(nextState: VillageState) {
      return commit(nextState);
    },
    start() {
      return commit(startOuting(currentState));
    },
    interact(hotspotId: HotspotId, nowMs: number) {
      const sourceState = isFinanceHotspot(hotspotId)
        ? recordMoneyFeverClick(currentState, nowMs)
        : currentState;
      return commit(selectHotspot(sourceState, hotspotId));
    }
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
npm test -- src/pre-cyan-village/tests/game-adapter.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pre-cyan-village/game/adapters src/pre-cyan-village/tests/game-adapter.test.ts
git commit -m "feat: add pre-cyan game session adapter"
```

## Task 3: Game Layout Contract

**Files:**
- Create: `src/pre-cyan-village/game/config/map-layout.ts`
- Create: `src/pre-cyan-village/tests/game-layout.test.ts`

- [ ] **Step 1: Write the failing layout tests**

Create `src/pre-cyan-village/tests/game-layout.test.ts`:

```typescript
import assert from 'node:assert/strict';
import test from 'node:test';
import { villageHotspots, roomDoor, findNearestHotspot, findNearestDoor, coreHotspotIds } from '../game/config/map-layout';

test('room door uses explicit interaction radius', () => {
  assert.equal(roomDoor.id, 'door');
  assert.equal(findNearestDoor({ x: roomDoor.x, y: roomDoor.y })?.id, 'door');
  assert.equal(findNearestDoor({ x: roomDoor.x + roomDoor.radius + 10, y: roomDoor.y }), null);
});

test('village exposes three current core hotspots and background seeds', () => {
  assert.deepEqual(coreHotspotIds, ['bankCounter', 'storeFront', 'busStop', 'mailbox']);
  assert.ok(villageHotspots.some((hotspot) => hotspot.kind === 'background' && hotspot.id === 'lottery'));
  assert.ok(villageHotspots.some((hotspot) => hotspot.kind === 'background' && hotspot.id === 'darkAlley'));
  assert.ok(villageHotspots.some((hotspot) => hotspot.kind === 'background' && hotspot.id === 'cyanTraceSeed'));
});

test('nearest hotspot only returns a target inside its radius', () => {
  const bank = villageHotspots.find((hotspot) => hotspot.id === 'bankCounter');
  assert.ok(bank);
  assert.equal(findNearestHotspot({ x: bank.x, y: bank.y })?.id, 'bankCounter');
  assert.equal(findNearestHotspot({ x: 20, y: 20 }), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/pre-cyan-village/tests/game-layout.test.ts
```

Expected: FAIL because `map-layout.ts` does not exist.

- [ ] **Step 3: Implement layout data and nearest-target helpers**

Create `src/pre-cyan-village/game/config/map-layout.ts`:

```typescript
import type { HotspotId } from '../../../shared/types/village';

export type Point = { x: number; y: number };

export type DoorTarget = {
  id: 'door';
  x: number;
  y: number;
  radius: number;
  label: string;
};

export type VillageHotspot = {
  id: HotspotId | 'lottery' | 'darkAlley' | 'cyanTraceSeed';
  domainId: HotspotId | null;
  kind: 'core' | 'background';
  x: number;
  y: number;
  radius: number;
  label: string;
  assetKey: string;
};

export const roomSize = { width: 720, height: 480 };
export const villageSize = { width: 960, height: 640 };

export const roomDoor: DoorTarget = {
  id: 'door',
  x: 610,
  y: 250,
  radius: 72,
  label: '문'
};

export const coreHotspotIds: HotspotId[] = ['bankCounter', 'storeFront', 'busStop', 'mailbox'];

export const villageHotspots: VillageHotspot[] = [
  { id: 'bankCounter', domainId: 'bankCounter', kind: 'core', x: 720, y: 250, radius: 76, label: '은행', assetKey: 'bank' },
  { id: 'storeFront', domainId: 'storeFront', kind: 'core', x: 455, y: 340, radius: 76, label: '편의점', assetKey: 'store' },
  { id: 'busStop', domainId: 'busStop', kind: 'core', x: 245, y: 420, radius: 76, label: '정류장', assetKey: 'bus-stop' },
  { id: 'mailbox', domainId: 'mailbox', kind: 'core', x: 180, y: 220, radius: 68, label: '우편함', assetKey: 'board' },
  { id: 'lottery', domainId: null, kind: 'background', x: 795, y: 430, radius: 66, label: '반짝이는 간판', assetKey: 'lottery' },
  { id: 'darkAlley', domainId: null, kind: 'background', x: 875, y: 505, radius: 64, label: '어두운 틈', assetKey: 'dark-alley' },
  { id: 'cyanTraceSeed', domainId: null, kind: 'background', x: 845, y: 155, radius: 64, label: '희미한 빛', assetKey: 'cyan-trace' }
];

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findNearestDoor(point: Point): DoorTarget | null {
  return distance(point, roomDoor) <= roomDoor.radius ? roomDoor : null;
}

export function findNearestHotspot(point: Point): VillageHotspot | null {
  const candidates = villageHotspots
    .filter((hotspot) => distance(point, hotspot) <= hotspot.radius)
    .sort((a, b) => distance(point, a) - distance(point, b));
  return candidates[0] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/pre-cyan-village/tests/game-layout.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pre-cyan-village/game/config/map-layout.ts src/pre-cyan-village/tests/game-layout.test.ts
git commit -m "feat: add pre-cyan game layout contract"
```

## Task 4: Minimal SVG Assets

**Files:**
- Create: `src/pre-cyan-village/assets/player.svg`
- Create: `src/pre-cyan-village/assets/room.svg`
- Create: `src/pre-cyan-village/assets/bank.svg`
- Create: `src/pre-cyan-village/assets/store.svg`
- Create: `src/pre-cyan-village/assets/bus-stop.svg`
- Create: `src/pre-cyan-village/assets/board.svg`
- Create: `src/pre-cyan-village/assets/lottery.svg`
- Create: `src/pre-cyan-village/assets/dark-alley.svg`
- Create: `src/pre-cyan-village/assets/cyan-trace.svg`
- Modify: `src/pre-cyan-village/tests/static-contract.test.ts`

- [ ] **Step 1: Write the failing asset contract test**

Append this test to `src/pre-cyan-village/tests/static-contract.test.ts`:

```typescript
test('Phaser prototype SVG assets exist in the Vite source tree', () => {
  const assetNames = [
    'player.svg',
    'room.svg',
    'bank.svg',
    'store.svg',
    'bus-stop.svg',
    'board.svg',
    'lottery.svg',
    'dark-alley.svg',
    'cyan-trace.svg'
  ];

  for (const assetName of assetNames) {
    assert.equal(existsSync(join(villageDir, 'assets', assetName)), true, assetName);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/pre-cyan-village/tests/static-contract.test.ts
```

Expected: FAIL because the asset files do not exist.

- [ ] **Step 3: Create SVG assets**

Create each file with compact SVGs. Use this complete pattern and change the file-specific label/color exactly as listed below:

`src/pre-cyan-village/assets/player.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <ellipse cx="24" cy="58" rx="15" ry="4" fill="#000000" opacity=".18"/>
  <path d="M24 6c9 0 16 8 16 18 0 13-7 28-16 28S8 37 8 24C8 14 15 6 24 6Z" fill="#6F8F72"/>
  <circle cx="24" cy="20" r="10" fill="#F2D0A7"/>
  <path d="M15 20c4-10 14-10 18 0-4-3-12-3-18 0Z" fill="#2B2A26"/>
</svg>
```

`src/pre-cyan-village/assets/room.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150">
  <rect x="8" y="8" width="204" height="134" rx="8" fill="#F5EAD8" stroke="#8E744A" stroke-width="4"/>
  <path d="M20 110h180" stroke="#D3B77C" stroke-width="6"/>
  <rect x="158" y="45" width="34" height="66" rx="3" fill="#6B5A3E"/>
  <rect x="42" y="52" width="54" height="35" rx="5" fill="#FFF8E8" stroke="#C9A85F" stroke-width="3"/>
</svg>
```

`src/pre-cyan-village/assets/bank.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
  <path d="M18 48 80 14l62 34Z" fill="#8E744A"/>
  <rect x="30" y="48" width="100" height="48" fill="#F3E7CF" stroke="#5B4A32" stroke-width="4"/>
  <path d="M42 90h76M48 56v32M80 56v32M112 56v32" stroke="#5B4A32" stroke-width="6"/>
</svg>
```

`src/pre-cyan-village/assets/store.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
  <rect x="26" y="42" width="108" height="56" rx="6" fill="#FFF8E8" stroke="#63533A" stroke-width="4"/>
  <path d="M28 42h104l-8-22H36Z" fill="#B75C4A"/>
  <path d="M40 42v-22M60 42v-22M80 42v-22M100 42v-22M120 42v-22" stroke="#FFF2D2" stroke-width="5"/>
  <rect x="62" y="64" width="36" height="34" fill="#6F8F72"/>
</svg>
```

`src/pre-cyan-village/assets/bus-stop.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
  <path d="M42 96V36h72v60" fill="none" stroke="#42566B" stroke-width="8"/>
  <rect x="34" y="28" width="88" height="20" rx="4" fill="#8E744A"/>
  <rect x="54" y="56" width="48" height="28" rx="3" fill="#D8E6EA"/>
  <path d="M30 100h100" stroke="#5B4A32" stroke-width="5"/>
</svg>
```

`src/pre-cyan-village/assets/board.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120">
  <rect x="30" y="26" width="80" height="58" rx="5" fill="#F6EBD8" stroke="#7A6545" stroke-width="5"/>
  <path d="M46 44h48M46 58h34M46 72h42" stroke="#8E744A" stroke-width="5"/>
  <path d="M50 84v22M90 84v22" stroke="#5B4A32" stroke-width="6"/>
</svg>
```

`src/pre-cyan-village/assets/lottery.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
  <rect x="30" y="38" width="100" height="58" rx="5" fill="#382E3F" stroke="#C8A96E" stroke-width="4"/>
  <path d="M42 30h76l10 18H32Z" fill="#C8A96E"/>
  <circle cx="58" cy="66" r="7" fill="#F8E28A"/>
  <circle cx="80" cy="66" r="7" fill="#F8E28A"/>
  <circle cx="102" cy="66" r="7" fill="#F8E28A"/>
</svg>
```

`src/pre-cyan-village/assets/dark-alley.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120">
  <path d="M26 104 50 18h40l24 86Z" fill="#171514"/>
  <path d="M54 24h32l14 74H40Z" fill="#26221F"/>
  <path d="M70 38v48" stroke="#496C70" stroke-width="5" opacity=".45"/>
</svg>
```

`src/pre-cyan-village/assets/cyan-trace.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120">
  <ellipse cx="70" cy="62" rx="42" ry="18" fill="#8AD7E8" opacity=".2"/>
  <path d="M38 76c16-34 48-34 64 0" fill="none" stroke="#76C9D8" stroke-width="7" opacity=".75"/>
  <path d="M70 32v56" stroke="#DDF8FC" stroke-width="4" opacity=".7"/>
</svg>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/pre-cyan-village/tests/static-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pre-cyan-village/assets src/pre-cyan-village/tests/static-contract.test.ts
git commit -m "feat: add pre-cyan prototype assets"
```

## Task 5: Phaser Objects And Scenes

**Files:**
- Modify: `src/pre-cyan-village/game/main-game.ts`
- Create: `src/pre-cyan-village/game/objects/Player.ts`
- Create: `src/pre-cyan-village/game/objects/InteractionPrompt.ts`
- Create: `src/pre-cyan-village/game/objects/DeviceHud.ts`
- Create: `src/pre-cyan-village/game/objects/PathGlow.ts`
- Create: `src/pre-cyan-village/game/scenes/RoomScene.ts`
- Create: `src/pre-cyan-village/game/scenes/VillageScene.ts`
- Modify: `src/pre-cyan-village/styles.css`

- [ ] **Step 1: Replace placeholder game entry with Phaser boot**

Replace `src/pre-cyan-village/game/main-game.ts` with:

```typescript
import Phaser from 'phaser';
import { createOutingSession } from './adapters/outing-session';
import { RoomScene } from './scenes/RoomScene';
import { VillageScene } from './scenes/VillageScene';
import type { VillageState } from '../../shared/types/village';
import type { StorageLike } from '../../shared/storage/local-storage';

export type PreCyanGameOptions = {
  host: HTMLElement;
  storage: StorageLike | null;
  initialState: VillageState;
};

export type PreCyanGameHandle = {
  destroy(): void;
};

export function startPreCyanGame(options: PreCyanGameOptions): PreCyanGameHandle {
  const session = createOutingSession(options.initialState, options.storage);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.host,
    backgroundColor: '#FAF9F5',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 640
    },
    scene: [RoomScene, VillageScene],
    physics: {
      default: 'arcade',
      arcade: { debug: false }
    },
    dom: { createContainer: true }
  });

  game.registry.set('outingSession', session);
  game.registry.set('storage', options.storage);

  return {
    destroy() {
      game.destroy(true);
    }
  };
}
```

- [ ] **Step 2: Add player object**

Create `src/pre-cyan-village/game/objects/Player.ts`:

```typescript
import Phaser from 'phaser';

export type MoveIntent = { x: number; y: number };

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private mobileIntent: MoveIntent = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDepth(20);
    this.setScale(0.85);
  }

  createInput(): void {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasd = this.scene.input.keyboard!.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  }

  setMobileIntent(intent: MoveIntent): void {
    this.mobileIntent = intent;
  }

  updateMovement(speed = 170): void {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const x = (left ? -1 : 0) + (right ? 1 : 0) + this.mobileIntent.x;
    const y = (up ? -1 : 0) + (down ? 1 : 0) + this.mobileIntent.y;
    const vector = new Phaser.Math.Vector2(x, y);

    if (vector.lengthSq() > 0) {
      vector.normalize().scale(speed);
    }

    this.setVelocity(vector.x, vector.y);
  }
}
```

- [ ] **Step 3: Add prompt, HUD, and path glow objects**

Create `src/pre-cyan-village/game/objects/InteractionPrompt.ts`:

```typescript
import Phaser from 'phaser';

export class InteractionPrompt {
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.label = scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#1C1B18',
      backgroundColor: '#FFF8E8',
      padding: { x: 10, y: 6 }
    }).setDepth(50).setVisible(false);
  }

  show(x: number, y: number, text: string): void {
    this.label.setText(text);
    this.label.setPosition(x - this.label.width / 2, y - 76);
    this.label.setVisible(true);
  }

  hide(): void {
    this.label.setVisible(false);
  }
}
```

Create `src/pre-cyan-village/game/objects/DeviceHud.ts`:

```typescript
import Phaser from 'phaser';

export class DeviceHud {
  private log: Phaser.GameObjects.Text;
  private actionButton: Phaser.GameObjects.Text;
  private directionPad: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onInteract: () => void, onMove: (x: number, y: number) => void) {
    this.log = scene.add.text(24, 22, '문은 열려 있어.', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#1C1B18',
      backgroundColor: '#FFF8E8',
      padding: { x: 12, y: 8 },
      wordWrap: { width: 560 }
    }).setDepth(100).setScrollFactor(0);

    this.actionButton = scene.add.text(820, 540, 'E', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '28px',
      color: '#1C1B18',
      backgroundColor: '#D5B46A',
      padding: { x: 20, y: 14 }
    }).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });
    this.actionButton.on('pointerdown', onInteract);

    const buttons = [
      this.button(scene, 62, 0, '↑', () => onMove(0, -1), () => onMove(0, 0)),
      this.button(scene, 62, 92, '↓', () => onMove(0, 1), () => onMove(0, 0)),
      this.button(scene, 0, 46, '←', () => onMove(-1, 0), () => onMove(0, 0)),
      this.button(scene, 124, 46, '→', () => onMove(1, 0), () => onMove(0, 0))
    ];
    this.directionPad = scene.add.container(34, 466, buttons).setDepth(100).setScrollFactor(0);
  }

  setLog(text: string): void {
    this.log.setText(text);
  }

  private button(scene: Phaser.Scene, x: number, y: number, text: string, down: () => void, up: () => void): Phaser.GameObjects.Text {
    const button = scene.add.text(x, y, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#1C1B18',
      backgroundColor: '#FFF8E8',
      padding: { x: 14, y: 10 }
    }).setInteractive({ useHandCursor: true });
    button.on('pointerdown', down);
    button.on('pointerup', up);
    button.on('pointerout', up);
    return button;
  }
}
```

Create `src/pre-cyan-village/game/objects/PathGlow.ts`:

```typescript
import Phaser from 'phaser';

export class PathGlow {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(8).setVisible(false);
  }

  showHomePath(): void {
    this.graphics.clear();
    this.graphics.lineStyle(8, 0xC8A96E, 0.7);
    this.graphics.beginPath();
    this.graphics.moveTo(720, 250);
    this.graphics.lineTo(455, 340);
    this.graphics.lineTo(245, 420);
    this.graphics.lineTo(180, 220);
    this.graphics.strokePath();
    this.graphics.setVisible(true);
  }
}
```

- [ ] **Step 4: Add RoomScene**

Create `src/pre-cyan-village/game/scenes/RoomScene.ts`:

```typescript
import Phaser from 'phaser';
import { findNearestDoor, roomDoor, roomSize } from '../config/map-layout';
import { DeviceHud } from '../objects/DeviceHud';
import { InteractionPrompt } from '../objects/InteractionPrompt';
import { Player } from '../objects/Player';
import type { OutingSession } from '../adapters/outing-session';

export class RoomScene extends Phaser.Scene {
  private player!: Player;
  private prompt!: InteractionPrompt;
  private hud!: DeviceHud;
  private interactKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('RoomScene');
  }

  preload(): void {
    this.load.svg('player', new URL('../../assets/player.svg', import.meta.url).toString());
    this.load.svg('room', new URL('../../assets/room.svg', import.meta.url).toString());
  }

  create(): void {
    this.physics.world.setBounds(0, 0, roomSize.width, roomSize.height);
    this.add.rectangle(roomSize.width / 2, roomSize.height / 2, roomSize.width, roomSize.height, 0xFAF9F5);
    this.add.image(360, 240, 'room').setScale(2.4).setDepth(1);
    this.add.rectangle(roomDoor.x, roomDoor.y, 52, 96, 0x6B5A3E, 0.25).setDepth(2);

    const session = this.registry.get('outingSession') as OutingSession;
    const state = session.getState();
    if (state.roomFeatures.firstRecord) {
      this.add.text(74, 84, '방금 일은 적어뒀어.', { fontSize: '18px', color: '#1C1B18' }).setDepth(3);
    }

    this.player = new Player(this, 170, 270);
    this.player.createInput();
    this.prompt = new InteractionPrompt(this);
    this.hud = new DeviceHud(this, () => this.useDoor(), (x, y) => this.player.setMobileIntent({ x, y }));
    this.hud.setLog(state.log);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(): void {
    this.player.updateMovement();
    const door = findNearestDoor({ x: this.player.x, y: this.player.y });
    if (door) {
      this.prompt.show(door.x, door.y, 'E');
    } else {
      this.prompt.hide();
    }
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.useDoor();
    }
  }

  private useDoor(): void {
    if (!findNearestDoor({ x: this.player.x, y: this.player.y })) return;
    const session = this.registry.get('outingSession') as OutingSession;
    session.start();
    this.cameras.main.fadeOut(220, 250, 249, 245);
    this.time.delayedCall(240, () => this.scene.start('VillageScene'));
  }
}
```

- [ ] **Step 5: Add VillageScene**

Create `src/pre-cyan-village/game/scenes/VillageScene.ts`:

```typescript
import Phaser from 'phaser';
import { findNearestHotspot, villageHotspots, villageSize } from '../config/map-layout';
import { DeviceHud } from '../objects/DeviceHud';
import { InteractionPrompt } from '../objects/InteractionPrompt';
import { PathGlow } from '../objects/PathGlow';
import { Player } from '../objects/Player';
import type { OutingSession } from '../adapters/outing-session';

export class VillageScene extends Phaser.Scene {
  private player!: Player;
  private prompt!: InteractionPrompt;
  private hud!: DeviceHud;
  private pathGlow!: PathGlow;
  private interactKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('VillageScene');
  }

  preload(): void {
    for (const name of ['bank', 'store', 'bus-stop', 'board', 'lottery', 'dark-alley', 'cyan-trace']) {
      this.load.svg(name, new URL(`../../assets/${name}.svg`, import.meta.url).toString());
    }
  }

  create(): void {
    this.physics.world.setBounds(0, 0, villageSize.width, villageSize.height);
    this.add.rectangle(villageSize.width / 2, villageSize.height / 2, villageSize.width, villageSize.height, 0xFAF9F5);
    this.add.graphics()
      .lineStyle(6, 0xD6C18B, 0.6)
      .strokePoints([{ x: 150, y: 220 }, { x: 455, y: 340 }, { x: 720, y: 250 }, { x: 845, y: 155 }], false)
      .strokePoints([{ x: 455, y: 340 }, { x: 245, y: 420 }, { x: 180, y: 220 }], false);

    for (const hotspot of villageHotspots) {
      this.add.image(hotspot.x, hotspot.y, hotspot.assetKey).setScale(hotspot.kind === 'core' ? 1 : 0.9).setDepth(5);
      this.add.text(hotspot.x - 34, hotspot.y + 48, hotspot.label, { fontSize: '16px', color: '#1C1B18' }).setDepth(6);
    }

    this.player = new Player(this, 150, 220);
    this.player.createInput();
    this.prompt = new InteractionPrompt(this);
    this.pathGlow = new PathGlow(this);
    this.hud = new DeviceHud(this, () => this.interact(), (x, y) => this.player.setMobileIntent({ x, y }));
    this.hud.setLog((this.registry.get('outingSession') as OutingSession).getState().guideLine);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(): void {
    this.player.updateMovement();
    const hotspot = findNearestHotspot({ x: this.player.x, y: this.player.y });
    if (hotspot) {
      this.prompt.show(hotspot.x, hotspot.y, hotspot.kind === 'core' ? 'E' : hotspot.label);
    } else {
      this.prompt.hide();
    }
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.interact();
    }
  }

  private interact(): void {
    const hotspot = findNearestHotspot({ x: this.player.x, y: this.player.y });
    if (!hotspot) return;
    const session = this.registry.get('outingSession') as OutingSession;
    if (!hotspot.domainId) {
      this.hud.setLog(hotspot.id === 'darkAlley' ? '길이라고 부르기엔 아직 어둡다.' : '빛만 살짝 남았다.');
      return;
    }

    const nextState = session.interact(hotspot.domainId, Date.now());
    this.hud.setLog(nextState.pendingReaction?.log ?? nextState.log);

    if (nextState.screen === 'room') {
      this.pathGlow.showHomePath();
      this.time.delayedCall(650, () => {
        this.cameras.main.fadeOut(220, 250, 249, 245);
        this.time.delayedCall(240, () => this.scene.start('RoomScene'));
      });
    }
  }
}
```

- [ ] **Step 6: Add Phaser styles**

Append to `src/pre-cyan-village/styles.css`:

```css
.game-shell {
  min-height: 100svh;
  background: #faf9f5;
  color: #1c1b18;
}

.game-host {
  width: 100vw;
  height: 100svh;
  overflow: hidden;
  touch-action: none;
}

.game-host canvas {
  display: block;
  max-width: 100%;
  max-height: 100svh;
}

html[data-runtime="phaser"] .app-shell {
  display: none;
}
```

- [ ] **Step 7: Run build and tests**

Run:

```bash
npm test
npm run build
```

Expected: both PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pre-cyan-village/game src/pre-cyan-village/styles.css
git commit -m "feat: add pre-cyan phaser scenes"
```

## Task 6: Browser Smoke Verification

**Files:**
- Create: `src/pre-cyan-village/tests/phaser-smoke.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Add smoke script**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "tsx --test \"src/**/*.test.ts\"",
    "test:smoke": "tsx src/pre-cyan-village/tests/phaser-smoke.spec.ts"
  }
}
```

- [ ] **Step 2: Create Playwright smoke file**

Create `src/pre-cyan-village/tests/phaser-smoke.spec.ts`:

```typescript
import { chromium } from 'playwright';

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const failed: string[] = [];
  const consoleErrors: string[] = [];

  page.on('requestfailed', (request) => failed.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('http://127.0.0.1:4173/good-afternoon/?runtime=phaser', {
    waitUntil: 'networkidle',
    timeout: 30_000
  });

  await page.waitForSelector('#phaser-game canvas', { timeout: 10_000 });
  const result = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#phaser-game canvas');
    const context = canvas?.getContext('2d');
    const sample = context && canvas ? context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data : null;
    return {
      canvasExists: Boolean(canvas),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      sample: sample ? Array.from(sample) : [],
      runtime: document.documentElement.dataset.runtime
    };
  });

  if (!result.canvasExists) throw new Error('Phaser canvas missing');
  if (result.runtime !== 'phaser') throw new Error(`Unexpected runtime ${result.runtime}`);
  if (result.overflow > 0) throw new Error(`Mobile horizontal overflow ${result.overflow}`);
  if (failed.length > 0) throw new Error(`Failed requests: ${failed.join(', ')}`);
  if (consoleErrors.length > 0) throw new Error(`Console errors: ${consoleErrors.join(', ')}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 3: Run production smoke**

Run in one terminal:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Run in another terminal:

```bash
npm run test:smoke
```

Expected: smoke exits with code 0, no request failures, no console errors, no horizontal overflow.

- [ ] **Step 4: Commit**

```bash
git add package.json src/pre-cyan-village/tests/phaser-smoke.spec.ts
git commit -m "test: add phaser browser smoke"
```

## Task 7: Documentation And Migration Gate

**Files:**
- Modify: `README.md`
- Create: `docs/superpowers/specs/2026-06-19-pre-cyan-phaser-dom-removal-gate.md`

- [ ] **Step 1: Update README with runtime instructions**

Add this section to `README.md` near the development command section:

```markdown
## Pre-Cyan Runtime Migration

During Phaser prototype development, the DOM runtime remains the default entry path:

- DOM default: `http://127.0.0.1:5173/good-afternoon/`
- Phaser prototype: `http://127.0.0.1:5173/good-afternoon/?runtime=phaser`

The DOM runtime is a temporary development fallback. Remove it after the Phaser runtime satisfies these checks:

- room start works
- door interaction enters the village
- three core hotspot interactions return to the room
- state persists after reload
- corrupt saved state recovers to a safe room state
- mobile 390x844 has no horizontal overflow
- production preview under `/good-afternoon/` has no asset 404 or console errors
- banned first-experience strings are absent from runtime source
```

- [ ] **Step 2: Create DOM removal gate spec**

Create `docs/superpowers/specs/2026-06-19-pre-cyan-phaser-dom-removal-gate.md`:

```markdown
# Pre-Cyan Phaser DOM Removal Gate

## Decision

DOM Pre-Cyan remains only while the Phaser runtime is being made replacement-ready. It is not a long-term parallel product path.

## Removal Criteria

- `npm test` passes.
- `npm run build` passes.
- `npm run test:smoke` passes against `npm run preview -- --host 127.0.0.1 --port 4173`.
- Manual desktop check confirms:
  - player starts in the room
  - `E` near the door enters the village
  - three current core hotspots return the player to the room
  - the room shows a record hint after return
- Manual mobile 390x844 check confirms:
  - no horizontal scroll
  - direction pad and interaction button are reachable
  - HUD text does not overlap core controls

## Removal Work

After the criteria pass, create a separate implementation plan that:

- switches Phaser from `?runtime=phaser` to default runtime
- removes DOM-only `view/` files
- removes DOM-only host markup from `index.html`
- updates static contract tests to assert Phaser as the default
- keeps `domain/` and `game/adapters/` intact
```

- [ ] **Step 3: Run docs/static verification**

Run:

```bash
npm test -- src/pre-cyan-village/tests/static-contract.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/superpowers/specs/2026-06-19-pre-cyan-phaser-dom-removal-gate.md
git commit -m "docs: define phaser migration gate"
```

## Task 8: Final Verification

**Files:**
- No file edits

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS across state, movement, static contract, game adapter, and game layout tests.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and `dist/` generated locally.

- [ ] **Step 3: Run Phaser smoke**

Run:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

Then run:

```bash
npm run test:smoke
```

Expected: PASS with no console errors, no failed asset requests, no mobile overflow.

- [ ] **Step 4: Search banned strings in runtime source**

Run:

```bash
rg "필수 기초 단어 놀이터|이해함|점수|학습 완료" src/pre-cyan-village
```

Expected: no matches.

- [ ] **Step 5: Confirm worktree state**

Run:

```bash
git status --short
```

Expected: only intentional files are modified or untracked. `dist/` must not be staged.

## Self-Review

- Spec coverage:
  - Phaser 3.x runtime: Task 1 and Task 5.
  - DOM runtime kept during development: Task 1 and Task 7.
  - DOM removal after replacement-ready prototype: Task 7.
  - Existing domain reuse: Task 2.
  - Room and Village scene loop: Task 5.
  - Direct movement and explicit interaction: Task 5.
  - Minimal SVG assets: Task 4.
  - GitHub Pages base path and production smoke: Task 6 and Task 8.
  - Mobile 390x844 overflow check: Task 6 and Task 8.
  - Banned first-experience strings: existing static contract plus Task 8.
- Placeholder scan:
  - No forbidden placeholder markers or unspecified edge handling text is present.
- Type consistency:
  - `OutingSession`, `PreCyanGameOptions`, `VillageHotspot`, `DoorTarget`, `coreHotspotIds`, `findNearestHotspot`, and `findNearestDoor` names are defined before use.
  - Hotspot IDs match current `src/shared/types/village.ts` and `src/pre-cyan-village/domain/data.ts`.
