# TypeScript Vite Isometric Foundation Design

## Summary

Pre-Cyan 데모를 Vite + TypeScript 기반 앱 구조로 전환한다. 목표는 단순히 `.js`를 `.ts`로 바꾸는 것이 아니라, 앞으로 Good Afternoon이 문명, 체스, 모노폴리, 롤러코스터 타이쿤처럼 지도 위 기물이 움직이는 보드게임형 경험으로 커질 수 있는 기반을 만드는 것이다.

이번 spec은 `src/`와 `public/` 중심의 새 앱 루트, `dist/` 비커밋 산출물, GitHub Pages workflow 갱신, 그리고 domain/rules/movement/view 경계 분리를 정의한다. 기존 `app/` 구조는 점진 폐기 대상으로 본다.

## User Experience Goal

사용자는 기능상으로 현재 Pre-Cyan 마을 데모와 같은 흐름을 경험해야 한다.

1. 토큰은 내 방에서 시작한다.
2. 편의점 또는 버스정류장 같은 열린 목적지를 선택한다.
3. 토큰이 이동하고, 도착 후 로그와 방문 상태가 갱신된다.
4. 공개 장소 기준을 충족하면 Cyan 입구가 목적지가 된다.
5. Cyan 입구에 도착하면 첫 업적과 Cyan 교환 판단 루프가 열린다.
6. 새로고침과 초기화 동작은 현재 구현과 동일하게 유지된다.

이번 전환은 사용자에게 새로운 루프를 추가하는 작업이 아니다. 사용자는 같은 기능을 보되, 내부 구조는 TypeScript와 확장 가능한 보드 구조로 바뀐다.

## Scope

### In Scope

- Vite + TypeScript 개발 환경 도입
- `src/`와 `public/` 중심 앱 루트 구성
- `dist/`를 빌드 산출물로 사용하고 커밋하지 않는 정책 확정
- `.github/workflows/deploy.yml`을 `dist/` 배포 workflow로 수정
- 기존 Pre-Cyan 데모를 TypeScript 모듈 구조로 이전
- 기존 `app/pre-cyan-village` 직접 실행 경로를 더 이상 기준으로 삼지 않음
- state, rules, movement, view, events 경계 분리
- 현 Pre-Cyan state migration과 localStorage 호환성 유지
- 현재 state test와 static contract test를 TypeScript/Vite 구조에 맞게 이전
- 향후 isometric 마름모 맵을 수용할 좌표 타입과 변환 경계 설계

### Out of Scope

- 완전한 isometric 그래픽 리디자인
- Canvas, WebGL, Three.js, 타일 엔진 도입
- 실제 3D 렌더링
- Cyan 전체 티어 구현
- Hub, Branch, Mastery 구현
- 다중 토큰, 턴 시스템, 주사위, 액션 포인트 구현
- 서버 저장소 또는 사용자 계정

## Architecture

새 기본 구조는 다음과 같다.

```text
src/
  pre-cyan-village/
    index.html
    main.ts
    styles.css
    domain/
      data.ts
      state.ts
      rules.ts
      movement.ts
    view/
      render.ts
      board-view.ts
      loop-view.ts
      events.ts
    tests/
      state.test.ts
      movement.test.ts
      static-contract.test.ts

  shared/
    types/
      graph.ts
      village.ts
    storage/
      local-storage.ts
    map/
      paths.ts
      isometric.ts

public/
  assets/

dist/
```

`src/`가 유일한 개발 소스다. `public/`은 이미지, 폰트, 파비콘 같은 정적 자산만 담당한다. `dist/`는 `npm run build`의 결과이며 `.gitignore`에 남긴다. `app/`는 점진 폐기 대상으로 두고, 전환 후 실행 기준은 `npm run dev`와 `npm run build`다.

## Module Boundaries

### Domain Data

`src/pre-cyan-village/domain/data.ts`

- Pre-Cyan 노드 데이터
- edge 데이터
- 첫 Cyan 루프 데이터
- 문구와 좌표 데이터

이 파일은 상태를 변경하지 않는다. 데이터 구조는 타입을 통해 검증한다.

### State

`src/pre-cyan-village/domain/state.ts`

- `createInitialState`
- `normalizeState`
- `loadState`
- `saveState`
- `resetState`
- 저장 스키마 migration

state 모듈은 DOM을 모른다. localStorage 접근은 `shared/storage/local-storage.ts` helper를 통해 수행한다.

### Rules

`src/pre-cyan-village/domain/rules.ts`

- 노드 해금 규칙
- 방문 처리
- Cyan 입구 해금 기준
- Cyan 루프 정답/오답 판정

규칙은 “게임 상태가 어떻게 바뀌는가”를 담당한다. 이동 가능성이나 화면 렌더링은 담당하지 않는다.

### Movement

`src/pre-cyan-village/domain/movement.ts`

- 이동 시작 가능 여부
- 이동 완료 처리의 순수 상태 계산
- 직전 이동 `lastMove`
- 경로 강조를 위한 edge 판정
- 자유 이동과 인접 이동의 정책 경계

이번 구현은 현재처럼 열린 목적지로 자유 이동할 수 있는 정책을 유지한다. 다만 이 정책은 `movement.ts`에 격리한다. 나중에 문명식 타일 이동, 체스식 유효 이동, 모노폴리식 경로 이동, 액션 포인트 제한을 넣을 때 이 모듈을 확장한다.

### View

`src/pre-cyan-village/view/`

- `render.ts`: 전체 렌더 orchestration
- `board-view.ts`: 노드, edge, token, lastMove path 렌더링
- `loop-view.ts`: Cyan 루프 패널 렌더링
- `events.ts`: click, transitionend, fallback timeout, reset wiring

view는 state/rules/movement API를 호출하지만, localStorage를 직접 파싱하지 않는다.

## Isometric Map Foundation

이번 전환에서 완성된 isometric 그래픽을 만들지는 않는다. 대신 좌표 모델을 확장 가능한 형태로 바꾼다.

기존 노드의 `x`, `y` percent 좌표는 즉시 폐기하지 않고, 전환 중 compatibility field로 유지할 수 있다. 새 구조에서는 `grid` 좌표를 도입한다.

```ts
type GridPosition = {
  q: number;
  r: number;
  elevation?: number;
};

type ScreenPosition = {
  x: number;
  y: number;
};

type MapNode = {
  id: NodeId;
  label: string;
  grid: GridPosition;
  kind: 'home' | 'place' | 'gate' | 'hidden';
};
```

`shared/map/isometric.ts`는 grid 좌표를 screen 좌표로 변환한다.

```ts
function projectIso(position: GridPosition): ScreenPosition {
  return {
    x: (position.q - position.r) * TILE_WIDTH / 2,
    y: (position.q + position.r) * TILE_HEIGHT / 2 - (position.elevation ?? 0)
  };
}
```

초기 구현은 DOM/CSS 기반 마름모 배치를 목표로 한다. 나중에 Canvas, SVG tile layer, WebGL, Three.js로 옮기더라도 domain state와 movement rules를 크게 바꾸지 않는 것이 목표다.

## Build And Deployment

### Local Scripts

`package.json`은 최소한 다음 scripts를 제공한다.

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "node --test"
  }
}
```

테스트 러너는 우선 Node 내장 test runner를 사용한다. 필요할 때만 Vitest 도입을 검토한다.

### GitHub Pages

`.github/workflows/deploy.yml`은 더 이상 `app/pre-cyan-village`를 직접 업로드하지 않는다.

새 workflow는 다음 순서를 따른다.

1. checkout
2. Node setup
3. `npm ci`
4. `npm run build`
5. Pages configure
6. `dist/` upload
7. deploy

`dist/`는 생성물이므로 커밋하지 않는다.

## Compatibility And Migration

현재 localStorage key는 유지한다.

```text
goodafternoon.preCyanVillage.v1
```

기존 저장 데이터는 TypeScript 전환 후에도 복구되어야 한다.

유지해야 하는 migration 사례:

- 새 필드가 없는 old state
- `playerNodeId`가 없는 old state
- `movingToNodeId`가 남아 있는 깨진 state
- `firstAchievementShown`과 `cyanGateUnlocked`가 true인 old Cyan gate 진입 state
- `currentStage: 'preCyan'`이 old gate state에 같이 남아 있는 경우

전환 후에도 다음이 성립해야 한다.

- old gate state는 `playerNodeId: 'cyanGate'`, `currentStage: 'cyanLoop'`, `cyanLoopSeen: true`로 승격된다.
- reset은 `room` 위치, 초기 목적지, `preCyan` stage로 돌아간다.
- 저장 데이터 파싱 실패는 초기 상태로 복구된다.

## Testing Strategy

기존 테스트 의도는 유지하되 TypeScript 구조에 맞춰 이전한다.

### State Tests

`src/pre-cyan-village/tests/state.test.ts`

검증 항목:

- 초기 상태
- old state migration
- old Cyan gate migration
- 이동 시작/완료
- locked/unknown/current/in-flight 이동 guard
- room + 공개 목적지 3개 방문 후 Cyan gate 해금
- Cyan loop success/failure
- reset state

### Movement Tests

`src/pre-cyan-village/tests/movement.test.ts`

검증 항목:

- directed edge path 판정
- reverse edge path 판정
- edge 없는 자유 이동 direct path fallback
- future policy hook: 자유 이동과 인접 이동 정책이 한 곳에 격리되어 있는지

### Static Contract Tests

`src/pre-cyan-village/tests/static-contract.test.ts`

검증 항목:

- token host
- Cyan loop host
- movement fallback wiring
- `aria-busy`
- banned first-experience strings
- `dist/`가 source of truth가 아니라 build output인지
- deploy workflow가 `dist/`를 upload하는지

### Browser Smoke

구현 완료 후 Playwright 또는 사용 가능한 브라우저 자동화로 다음을 확인한다.

- `npm run build` 성공
- `npm run preview` 또는 Vite dev server에서 앱 로드
- 390x844 viewport에서 token visible
- 편의점, 버스정류장, 알바처 이동
- Cyan gate unlock
- Cyan loop answer
- reload persistence
- reset
- console/page error 없음

## Documentation Updates

다음 문서를 갱신한다.

- `README.md`
  - 실행 방법을 `npm install`, `npm run dev`, `npm run build`, `npm run preview` 기준으로 수정
  - `app/` 직접 실행 안내 제거
- `docs/ROADMAP.md`
  - 기술 기준을 Vanilla JS에서 Vite + TypeScript로 갱신
  - `app/` 점진 폐기와 `src/` 확장 구조를 반영
- `AGENTS.md`
  - 구현 시 `src/`를 source of truth로 삼고 `dist/`를 커밋하지 않는 규칙 추가

## Non-Goals And Constraints

- 이번 spec은 보드게임 시스템 전체를 만들지 않는다.
- 이번 spec은 isometric 그래픽 완성을 목표로 하지 않는다.
- 이번 spec은 기존 Pre-Cyan 사용자 흐름을 깨지 않는다.
- 이번 spec은 TS 전환 중 기능을 새로 늘리지 않는다.
- `dist/`는 커밋하지 않는다.
- `app/`는 새 구현의 기준이 아니다.

## Verification Criteria

완료 후 다음이 모두 참이어야 한다.

1. `npm ci` 또는 clean install이 성공한다.
2. `npm run build`가 성공한다.
3. `npm test`가 성공한다.
4. `dist/`가 생성되지만 git status에 추적되지 않는다.
5. `.github/workflows/deploy.yml`이 `dist/`를 upload한다.
6. `src/pre-cyan-village`가 Pre-Cyan의 source of truth다.
7. `app/pre-cyan-village` 직접 실행 안내가 문서에서 제거된다.
8. 기존 Pre-Cyan 기능이 브라우저 smoke에서 그대로 동작한다.
9. old localStorage migration 사례가 테스트로 고정된다.
10. movement path 판정이 directed, reverse, direct free move를 모두 다룬다.
11. isometric 좌표 변환 helper가 타입과 테스트로 존재한다.
12. banned first-experience strings가 runtime source에 없다.

## Open Decisions Resolved

- Vite + TypeScript를 도입한다.
- `src/`와 `public/` 중심으로 전환한다.
- `dist/`는 생성물이며 커밋하지 않는다.
- `app/`는 점진 폐기한다.
- GitHub Pages는 `dist/`를 배포한다.
- isometric 마름모 맵은 이번에 완성하지 않고 좌표/렌더 경계를 먼저 만든다.
- 보드게임식 확장은 `rules`, `movement`, `board-view`, `events` 경계를 통해 준비한다.
