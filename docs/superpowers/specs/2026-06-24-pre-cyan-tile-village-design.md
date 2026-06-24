# Pre-Cyan Tile Village Redesign

## Summary

Pre-Cyan 마을을 기존 자유 이동/반경 상호작용 구조에서 고쳐 쓰지 않고, 아이소메트릭 타일 월드 기반의 새 시스템으로 다시 설계한다. 기존 구현은 컨셉 참고 자료로만 사용한다. 유지할 것은 `내 방에서 시작해 작은 현실 동네를 둘러보고, 장소 선택의 결과가 길과 로그와 해금으로 돌아온다`는 경험이지, 현재의 좌표/저장/상호작용 구조가 아니다.

핵심 목표는 조작감이다. 사용자는 데스크톱 방향키와 모바일 D-pad로 한 칸씩 확실히 이동하고, 버튼을 누르고 있으면 타일 단위로 계속 이동한다. 마을은 아이소메트릭 다이아몬드 그리드로 보여 입체감을 살리되, 조작은 화면 기준 4방향으로 설계한다.

## Product Goals

- Pre-Cyan을 카드, 목록, 체크리스트가 아니라 직접 조작하는 첫 마을로 만든다.
- 아이소메트릭 타일 지도로 2D 화면 안에서 마을의 입체감을 만든다.
- 방향키와 모바일 D-pad가 같은 입력 모델을 쓰게 한다.
- 모바일 D-pad는 고정 버튼이지만, 누르고 있으면 조이스틱처럼 연속 이동한다.
- 장소 상호작용은 반경 감지가 아니라 현재 타일 또는 바라보는 앞 타일 기준으로 처리한다.
- 방문, 로그, 숨은 골목 발견, Cyan 입구 해금이 새 진행 상태에 남는다.
- Pre-Cyan의 핵심 루프인 `장소를 본다 → 짧은 상황을 만난다 → 행동을 선택한다 → 반응을 받는다 → 길/장소/힌트가 변한다`를 강화한다.

## Non-Goals

- 기존 `VillageState` 또는 기존 localStorage 값을 호환하지 않는다.
- 기존 `Player`, `DeviceHud`, `map-layout` 구조를 보존하기 위해 설계를 제한하지 않는다.
- `RoomScene` 전체를 같은 패스에서 새로 만들지 않는다.
- Cyan 티어, 메인 허브, 투자 브랜치 콘텐츠를 이번 범위에 넣지 않는다.
- 퀘스트 엔진, 인벤토리, 재화, NPC 대화 시스템을 만들지 않는다.
- Pre-Cyan에 점수, 정답/오답, 학습 완료, 경제 개념 설명 카드를 넣지 않는다.

## Chosen Direction

아이소메트릭 타일 마을을 새 소스 오브 트루스로 둔다. 화면 좌표는 저장하거나 직접 판정하지 않고, 항상 타일 좌표에서 계산한다.

조작은 화면 기준 4방향이다. 내부적으로는 아이소메트릭 방향을 쓰더라도, 사용자에게는 위, 오른쪽, 아래, 왼쪽 버튼을 누르면 화면에서 보이는 해당 방향의 다음 타일로 이동하는 것처럼 느껴져야 한다.

방향 입력 직후에는 목적 타일을 약하게 하이라이트한다. 이 피드백이 방향 체계를 설명하는 역할을 한다. 별도 튜토리얼 문장으로 `아이소메트릭 방향`을 설명하지 않는다.

## Tile World Model

타일 월드는 새 Pre-Cyan 시스템의 기준 데이터다.

```ts
type TileCoord = {
  col: number;
  row: number;
};

type Direction = 'screenUp' | 'screenRight' | 'screenDown' | 'screenLeft';

type TileKind =
  | 'path'
  | 'ground'
  | 'building'
  | 'threshold'
  | 'hidden'
  | 'blocked';

type VillageTile = {
  id: string;
  coord: TileCoord;
  kind: TileKind;
  walkable: boolean;
  elevation: number;
  zoneId: ZoneId;
  placeId?: PlaceId;
};
```

불변 조건:

- 화면 좌표는 저장하지 않는다.
- 이동과 상호작용 판정은 타일 좌표만 사용한다.
- `walkable: false` 타일은 플레이어의 현재 타일이나 목표 타일이 될 수 없다.
- 맵 정의에 없는 좌표는 시작 타일로 복구한다.
- 아이소메트릭 화면 위치는 `TileCoord`에서 계산한다.

## Place And Interaction Model

장소는 단일 점이 아니라 타일 묶음이다.

```ts
type VillagePlace = {
  id: PlaceId;
  label: string;
  zoneId: ZoneId;
  footprint: TileCoord[];
  entryTiles: TileCoord[];
  interactionTiles: TileCoord[];
  visibleWhen?: ProgressCondition;
  unlockedWhen?: ProgressCondition;
};
```

상호작용은 현재 타일 또는 바라보는 앞 타일에서만 발생한다.

```ts
type InteractionTarget = {
  id: string;
  placeId: PlaceId;
  trigger: {
    fromTiles: TileCoord[];
    facing?: Direction[];
  };
  domainAction: HotspotId | 'returnHome' | 'enterCyanGate';
  availableWhen?: ProgressCondition;
  feedback: {
    log: string;
    visualCue: 'placePulse' | 'pathOpen' | 'traceGlow' | 'quiet';
  };
};
```

기존 radius 기반 hotspot 판정은 새 시스템에 들어오지 않는다. `E` 키와 모바일 상호작용 버튼은 같은 `InteractionTarget`을 실행한다.

## Player State

플레이어는 타일 상태 머신으로 관리한다.

```ts
type PlayerTileState = {
  current: TileCoord;
  facing: Direction;
  target: TileCoord | null;
  queuedDirection: Direction | null;
  movingSince: number | null;
};
```

동작 규칙:

- 짧은 입력은 한 칸 이동이다.
- 방향 입력을 누르고 있으면 타일 도착 직후 같은 방향 이동을 예약한다.
- 이동 중 새 방향을 누르면 `queuedDirection`으로 저장하고, 도착 후 이동 가능 여부를 다시 판정한다.
- 막힌 타일 입력은 위치를 바꾸지 않고 짧은 실패 피드백만 낸다.
- 플레이어의 시각 위치는 `current`, `target`, 이동 경과 시간에서 보간한다.

## Progress And Save State

진행 상태도 새로 작성한다. 기존 `VillageState`는 새 구조의 기준이 아니다.

```ts
type PreCyanProgressState = {
  visitedPlaceIds: PlaceId[];
  completedActions: RequiredAction[];
  seenReactionIds: string[];
  discoveredFlags: Record<string, boolean>;
  unlockedRouteIds: string[];
  cyanGateUnlocked: boolean;
  alleyHintDiscovered: boolean;
  outingHistory: OutingRecord[];
  lastLog: string;
  guideLine: string;
};

type PreCyanSaveStateV2 = {
  version: 2;
  player: {
    current: TileCoord;
    facing: Direction;
  };
  progress: PreCyanProgressState;
};
```

저장 규칙:

- 마지막 타일 위치와 바라보는 방향은 저장한다.
- 이동 중 상태인 `target`, `queuedDirection`, `movingSince`는 저장하지 않는다.
- 저장값이 깨져 있으면 새 게임 기본 상태로 시작한다.
- 이전 구현의 localStorage 값은 호환하지 않는다.

## Visual Feedback

피드백은 속도감보다 타일 단위 확정감을 우선한다.

- 방향 입력 직후 목적 타일에 약한 크림/브론즈 하이라이트를 표시한다.
- 이동 중 캐릭터는 타일 중심에서 타일 중심으로 미끄러지듯 이동한다.
- 도착 시 캐릭터가 아주 작게 눌렸다 돌아오는 느낌을 준다.
- 상호작용 가능한 타일에 도착하면 장소 오브젝트가 짧게 밝아진다.
- 앞 타일에 상호작용 대상이 있으면 작은 `E` 또는 버튼 힌트만 표시한다.
- 막힌 방향 입력은 막힌 타일 가장자리에 짧은 피드백을 준다.
- 길이 열릴 때는 숫자 보상보다 경로선, 장소 빛, 단말 로그로 보여준다.

## Controls

PC:

- 이동: 방향키 우선, 필요하면 WASD 지원
- 상호작용: `E`

모바일:

- 이동: 화면 하단 고정 D-pad
- 상호작용: 별도 버튼
- 방향 버튼 홀드 시 타일 단위 연속 이동

조작 원칙:

- 아이소메트릭 맵은 유지한다.
- 입력은 화면 기준 4방향으로 제공한다.
- 첫 10초 안에 사용자가 방향 체계를 읽을 수 없으면 실패로 본다.
- 방향 설명 텍스트보다 목적 타일 하이라이트로 학습시킨다.

## Scope

첫 구현 범위는 `VillageScene`의 새 타일 시스템이다.

포함:

- 아이소메트릭 타일 맵 정의
- 타일 좌표와 화면 좌표 변환
- 플레이어 타일 이동 상태 머신
- 키보드/D-pad 공통 입력 intent
- 현재/앞 타일 상호작용 판정
- 새 Pre-Cyan 저장 상태
- 기존 장소 컨셉 재배치
- 공개 장소 4곳 방문 후 Cyan 입구 해금
- 복권방 뒤 어두운 골목을 숨은 투자 씨앗으로 유지

제외:

- `RoomScene` 전면 재작성
- Cyan 이후 전환 화면
- 새 경제 콘텐츠
- 기존 저장값 호환
- root HTML 데모 또는 `app/` 경로 반영

## Architecture

예상 구조:

```text
src/pre-cyan-village/
  domain/
    tile-progress.ts
    tile-save-state.ts
  game/
    controls/
      input-intent.ts
    tile/
      iso-projection.ts
      tile-map.ts
      tile-movement.ts
      tile-interactions.ts
    scenes/
      VillageScene.ts
    objects/
      TilePlayer.ts
      TileHint.ts
      DeviceHud.ts
```

`tile/` 모듈은 Phaser 없이 테스트 가능해야 한다. `VillageScene`은 타일 월드를 렌더링하고, 입력 intent를 이동 상태 머신에 전달하고, 상호작용 결과를 진행 상태에 반영한다.

## Testing And UAT

순수 로직 테스트:

- 타일 좌표와 아이소메트릭 화면 좌표 변환이 일관적인지 확인한다.
- 방향 입력으로 다음 타일이 정확히 계산되는지 확인한다.
- 막힌 타일, 건물 타일, 숨은 타일로 이동하지 않는지 확인한다.
- 홀드 입력이 타일 단위 연속 이동으로 처리되는지 확인한다.
- 이동 중 새 입력이 `queuedDirection`으로 예약되는지 확인한다.
- 현재 타일/앞 타일 기준으로만 상호작용 대상이 잡히는지 확인한다.
- 장소 점유 타일, 입구 타일, 상호작용 타일이 모순되지 않는지 확인한다.

저장 상태 테스트:

- `PreCyanSaveStateV2` 기본값이 정상 생성되는지 확인한다.
- 마지막 타일 위치와 바라보는 방향이 저장/복구되는지 확인한다.
- 방문 장소, 열린 길, 본 반응, 숨은 골목 발견, Cyan 입구 해금이 진행 상태에 남는지 확인한다.
- 저장값에 맵에 없는 좌표가 있으면 시작 타일로 복구되는지 확인한다.
- 저장값이 완전히 깨져 있으면 새 게임 기본 상태로 시작하는지 확인한다.

브라우저 스모크:

- 새 `VillageScene`이 타일 맵을 기준으로 렌더링된다.
- 플레이어가 시작 타일에 배치된다.
- 키보드와 모바일 D-pad가 같은 입력 모델을 쓴다.
- 상호작용 버튼과 `E` 키가 같은 타깃을 실행한다.
- 장소 반응 후 로그, 시각 피드백, 진행 상태가 함께 바뀐다.

수동 UAT:

- 데스크톱에서 방향키 짧은 입력은 한 칸 이동이다.
- 데스크톱에서 방향키 홀드는 타일 단위 연속 이동이다.
- 모바일 390x844에서 D-pad 홀드는 조이스틱처럼 이어진다.
- D-pad와 상호작용 버튼은 지도와 로그를 가리지 않는다.
- 막힌 타일 입력은 짧은 실패 피드백만 주고 위치를 바꾸지 않는다.
- 공개 장소 4곳 방문 후 Cyan 입구가 열린다.
- 복권방 뒤 어두운 골목은 숨은 씨앗으로 남는다.
- `필수 기초 단어 놀이터`, `이해함`, `점수`, `학습 완료` 표현이 없다.

## Transition Risks

### Scope Growth

타일 맵, 입력, 저장, 상호작용, 렌더링을 한 번에 바꾸므로 작업이 커질 수 있다.

대응:

- 첫 구현은 `VillageScene`에 한정한다.
- `RoomScene`, Cyan 이후 화면, 새 콘텐츠는 제외한다.
- 목표는 기존 장소 컨셉을 새 타일 마을에서 다시 플레이 가능하게 만드는 것이다.

### Isometric Control Confusion

아이소메트릭은 화면의 입체감이 좋지만 조작 방향이 헷갈릴 수 있다.

대응:

- 아이소메트릭 맵은 유지한다.
- 조작은 화면 기준 4방향으로 설계한다.
- 입력 직후 목적 타일을 하이라이트한다.
- 첫 10초 안에 방향 체계를 읽을 수 있는지 UAT에서 확인한다.

### Over-Engineered Data Model

새로 작성한다는 이유로 조건식과 퀘스트 구조가 과해질 수 있다.

대응:

- 1차 모델은 타일, 장소, 상호작용, 플레이어, 진행 상태만 둔다.
- 조건은 `visibleWhen`, `unlockedWhen` 수준으로 제한한다.
- 마스터리, 브랜치, 경제 개념 판단은 넣지 않는다.

### Loss Of Pre-Cyan Identity

시스템을 새로 쓰면서 마을 컨셉이 흐려질 수 있다.

대응:

- 장소 목록과 해금 흐름은 `PROJECT_CONTEXT.md`를 기준으로 유지한다.
- 공개 장소 4곳 방문 후 Cyan 입구가 열리는 구조를 유지한다.
- 복권방 뒤 어두운 골목은 숨은 투자 씨앗으로 유지한다.
- 철 티어 이전에 `Good Afternoon.` 이름 의미를 설명하지 않는다.

## Completion Criteria

- `VillageScene`이 아이소메트릭 타일 월드로 동작한다.
- 방향키와 모바일 D-pad가 같은 화면 기준 4방향 입력 모델을 쓴다.
- D-pad 홀드가 타일 단위 연속 이동으로 작동한다.
- 상호작용은 현재 타일 또는 바라보는 앞 타일 기준으로만 실행된다.
- 새 `PreCyanSaveStateV2`가 위치, 방향, 방문, 해금, 로그를 저장한다.
- 공개 장소 4곳 방문 후 Cyan 입구가 열린다.
- 복권방 뒤 어두운 골목은 숨은 씨앗으로 남는다.
- 모바일 390x844에서 조작 UI, 지도, 로그가 겹치지 않는다.
- 금지 표현이 런타임에 없다.
- `npm test`와 `npm run build`가 통과한다.
