# 굿애프터눈 (Good Afternoon.)

굿애프터눈은 공부처럼 느껴지지 않는 경제 개념 잠금해제 서비스입니다. 제롬 파월의 FOMC 기자회견 인사말 밈에서 이름을 가져왔지만, 그 의미는 온보딩에서 설명하지 않고 철 티어 이스터에그에서 회수합니다.

핵심 철학은 **Easy to learn, Hard to master**입니다. Pre-Cyan은 경제 단어에 부담이 있는 사용자가 현실 동네를 닮은 첫 모험 마을에서 적응하도록 만들고, 이후 Cyan 이상 티어와 마스터리 레이어가 깊이를 담당합니다.

## 현재 구현 상태

현재 활성 첫 슬라이스는 `app/pre-cyan-village/`입니다. 플레이어 토큰이 열린 장소 사이를 이동하고, Cyan 입구에 도달한 뒤, 최소 단위의 Cyan 교환 판단 루프 하나를 여는 정적 Pre-Cyan 마을 데모입니다. `index.html`에서 바로 실행되며 빌드 단계는 필요하지 않습니다.

- **루트 HTML 데모**: 기획 검증용 시각 자료입니다. 온보딩, 개념 지도, 기준금리 챌린지 흐름을 참고할 때만 사용합니다.
- **개발 로드맵**: `docs/ROADMAP.md`에 다음 구현 순서와 완료 기준을 정리했습니다.
- **디자인 기준**: `DESIGN.md`의 Good Afternoon 우선 섹션을 기준으로 판단합니다.

## 실행 방법

Pre-Cyan 첫 모험 마을:

1. `app/pre-cyan-village/index.html`을 Chrome 또는 Edge에서 직접 엽니다.
2. 내 방을 누른 뒤 편의점, 버스정류장, 알바처, 은행, 구독함, 복권방을 탐색하며 토큰 이동을 확인합니다.
3. 열린 장소를 지나 Cyan 입구에 도달합니다.
4. Cyan 입구에서 첫 Cyan 교환 판단 루프가 열리는지 확인합니다.

기획 검증용 데모:

- `goodafternoon_integrated_demo.html`: 온보딩, 개념 지도, 기준금리 챌린지 통합 목업
- `goodafternoon_mathflat_edition.html`: 별도 평가형 실험 목업

## 문서 지도

- `PROJECT_CONTEXT.md`: 서비스 정의, 확정 구조, 기획 불변량
- `docs/ROADMAP.md`: 개발 로드맵과 다음 구현 순서
- `DESIGN.md`: Good Afternoon 디자인 기준과 참고 분석
- `harness/30_mastery_spec.md`: Hard to Master 마스터리 레이어 상세 명세
- `AGENTS.md`: 에이전트와 개발자가 따라야 할 작업 지침
- `GEMINI.md`: Gemini용 harness 인덱스

## 다음 개발 순서

1. Pre-Cyan에서 Cyan 입구 이후의 임시 전환 화면을 추가합니다.
2. Cyan 티어의 최소 플레이 루프를 만듭니다.
3. 전체 진행 상태 저장 스키마를 설계합니다.
4. 메인 허브 지도 초안을 만듭니다.
5. 투자 브랜치의 첫 씨앗을 Pre-Cyan 어두운 골목 발견 상태와 연결합니다.

## 개발 원칙

- Vanilla HTML, CSS, JavaScript를 우선합니다.
- 빌드 도구 없이 브라우저에서 직접 열 수 있는 정적 앱 단위를 유지합니다.
- “학습”, “공부”, “점수” 뉘앙스를 첫 경험 전면에 두지 않습니다.
- 철 티어 이전에는 `Good Afternoon.` 이름의 의미를 직접 설명하지 않습니다.
- 변경 후에는 정적 문자열 스캔, 브라우저 스모크 테스트, 모바일 뷰포트 점검을 수행합니다.
