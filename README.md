# Good Afternoon. — 오후의 작은 가게

경제를 쉽게 접하는 **짧은 턴제 장사 웹 게임**입니다. 레모네이드 가게에서 물량과 가격을 정하고, 손님과 남은 음료를 보며 다음 영업의 판단을 바꿉니다.

현재는 다섯 번의 오후를 처음부터 끝까지 플레이할 수 있습니다. 이전 마을 구현을 교체했으며, 실행 소스는 `src/market-game/`입니다.

**[배포된 게임 플레이하기](https://jinhoops.github.io/good-afternoon/)** — `main`에 푸시하면 GitHub Actions가 빌드해 GitHub Pages에 배포합니다.

## 플레이

1. 장터 소식에서 날씨, 손님, 재료값을 살펴봅니다.
2. 가진 6,000원 안에서 음료를 준비합니다. 첫날에는 물량만 고릅니다.
3. 가게를 열면 손님이 구매하거나 돌아갑니다. 다음 날부터 가격도 정합니다.
4. 손님에게 받은 돈과 준비·대여에 쓴 돈, 다음 날로 보관한 음료를 확인합니다.
5. 같은 날을 다시 해보거나 다음 오후로 넘어갑니다. 다섯 번의 영업 동안 가게 준비금 15,000원을 모아봅니다.
6. 완주 뒤 새 장터를 열면 감사 인사와 개발 중 안내가 스크롤됩니다. 기록으로 돌아가거나 같은 장터를 다시 시작할 수 있습니다.

날씨와 손님, 재료비는 날마다 달라집니다. 셋째·넷째 날에는 하루 600원에 최대 4잔을 다음 영업까지 보관할 수 있습니다. 보관함을 쓰지 않거나 판매 기한이 지난 음료는 정리합니다. 내일의 재료값과 손님 단서를 보고 보관을 결정합니다. 현금과 이익은 구분해 보여주며, 설명은 영업 뒤 선택해서 열어볼 수 있습니다.

## 실행과 검증

Node.js와 npm이 필요합니다.

```sh
npm install
npm run dev
```

터미널에 표시된 주소의 `/good-afternoon/`을 엽니다. 기본 주소는 `http://127.0.0.1:5173/good-afternoon/`이며, 해당 포트가 사용 중이면 Vite가 다음 포트를 안내합니다.

```sh
npm test
npm run build
npm run preview -- --port 4173
```

다른 터미널에서 브라우저 검증을 실행합니다. Chromium 설치는 최초 한 번 필요합니다.

```sh
npx playwright install chromium
npm run test:smoke
```

`MARKET_TEST_URL`로 대상 주소를, `MARKET_SCREENSHOTS`로 캡처 경로를 지정할 수 있습니다. 기본 캡처 경로는 `/tmp/good-afternoon-market-qa`입니다.

검증에는 다섯 번의 영업, 수익 계산, 같은 날 재시도, 새로고침 복구, 보관·기한·대여 유불리, 감사 스크롤의 중지·동작 감소·기록 보존·재시작, 기존 저장의 이어하기, 손상된 저장값, 저장 불가 환경, PC와 모바일 390×844 화면이 포함됩니다. 자동 검증은 실제 사용자의 재미나 경제 이해를 입증하지 않습니다.

## 구현 구조

- `content.ts`: 날마다 달라지는 손님·재료비·상황과 짧은 경제 설명
- `domain.ts`: 준비, 영업 정산, 다음 날, 재시도의 게임 규칙
- `storage.ts`: 영업 기록을 재계산하는 저장 복구
- `view.ts`, `main.ts`, `styles.css`: 장면, 조작, 손님 반응, 반응형 화면
- `cooler-view.ts`, `cooler.css`: 보관 선택, 보관함 장면, 현금과 이익의 구분
- `credits.ts`, `credits.css`: 반복 진입 시 감사 스크롤과 개발 중 안내
- [배경 이미지와 제작 기록](src/market-game/assets/README.md)

Vite + TypeScript와 HTML/CSS/SVG를 사용합니다. 게임 이미지도 로컬 파일이며 외부 폰트 요청은 없습니다. 기록은 현재 브라우저에 자동 저장합니다. `dist/`는 빌드 출력물이므로 커밋하지 않습니다.

## 현재 기획

- [프로젝트 기준](PROJECT_CONTEXT.md): 장르, 목표, 구현 범위와 아직 검증하지 않은 부분
- [게임 규칙과 재미 검토](docs/design/weekend-market.md): 다섯 오후의 설계와 검증 기준
- [첫 장터 이후의 설계](docs/design/after-first-market.md): 감사 스크롤과 후속 장터·가게 성장·장기 판단
- [로드맵](docs/ROADMAP.md): 다음 플레이테스트와 숙련 확장 순서
- [디자인 기준](DESIGN.md): 화면, 조작, 톤
- [작업 지침](AGENTS.md): 이 프로젝트의 Superpowers 비활성화 포함

[장르 비교](docs/design/2026-09-09-economics-game-directions.md), [이전 안의 재미 검토](docs/design/2026-09-09-game-fun-review.md), [교체 전 서비스 기획](docs/archive/2026-09-09-before-market-context.md)은 결정 과정을 보존한 자료입니다. `docs/superpowers/`, `harness/`, 루트 HTML 데모의 마을·문항·티어 구조는 현재 게임의 필수 조건이 아닙니다.
