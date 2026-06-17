# 굿애프터눈 (Good Afternoon.) — 서비스 기획 및 통합 데모

## 📌 3줄 요약 (Project Summary)
1. **[서비스 정체성]** 제롬 파월의 FOMC 기자회견 밈에서 착안하여, 공부처럼 느끼지 않는 경제 개념 잠금해제(Duolingo + 마인크래프트 업적 시스템) 서비스의 기획 검증용 통합 목업입니다.
2. **[피드백 반영 (Easy to Learn)]** 경제 단어를 먼저 보여주지 않고, 모바일 세로 화면 기준의 **Pre-Cyan 첫 모험 마을**에서 내 방·편의점·버스정류장·알바처·은행 같은 장소를 만지며 적응하는 0단계를 새 구현 방향으로 확정했습니다.
3. **[데모 플레이]** 온보딩(초보자용 기초 퀴즈 분기) → 개념 지도(Pre-Cyan 및 CMYK 계층 구조) → 기준금리 4단계 인쇄 합성 시뮬레이터(LTV/금리 변동에 따른 파산 임계치 계산)의 핵심 흐름을 직접 조작하며 체감할 수 있습니다. *(※ 현재 데모의 개념 지도는 우선 핵심 기획 내용과 흐름을 담아둔 텍스트 뼈대 상태입니다. 향후 진짜 게임 지도 형태의 시각화 맵으로 발전할 계획입니다.)*

---

## 📂 프로젝트 주요 구성
- **app/pre-cyan-village/**: 새로 구현할 Pre-Cyan 첫 모험 마을 정적 앱. 기존 HTML 데모는 기획 검증용 시각 자료이며, 새 구현의 소스가 아닙니다.
- **[goodafternoon_integrated_demo.html](file:///D:/jhkSandBox/CODE/good-afternoon/goodafternoon_integrated_demo.html)**: 통합 기획 및 피드백이 반영된 프론트엔드 HTML5 인터랙티브 목업.
- **[PROJECT_CONTEXT.md](file:///D:/jhkSandBox/CODE/good-afternoon/PROJECT_CONTEXT.md)**: 서비스 정의, 수직/수평축 문제 로드맵, 온보딩 및 톤앤매너를 담은 서비스 메인 기획서.
- **[harness/30_mastery_spec.md](file:///D:/jhkSandBox/CODE/good-afternoon/harness/30_mastery_spec.md)**: "Hard to Master" 철학을 구체화한 CMYK 글로벌 티어 및 분석 리포트 데이터 스키마 상세 명세서.

---

## ⚡ 실행 및 체험 방법
현재 루트의 HTML 파일들은 오늘 열어볼 수 있는 기획 검증용 시각 자료입니다. 새 Pre-Cyan 첫 모험 마을은 다음 구현 단계에서 `app/pre-cyan-village/index.html` 경로에 독립적으로 만들 예정입니다.

1. 현재는 루트 HTML 데모 파일을 웹 브라우저(Chrome, Edge 등)로 직접 열어 기획 흐름을 확인합니다.
2. 새 구현이 추가된 뒤에는 `app/pre-cyan-village/index.html`에서 내 방, 공개 장소, 짧은 로그, 연결 노드 활성화 흐름을 확인합니다.
3. 기존 루트 HTML 데모는 온보딩, 개념 지도, 기준금리 챌린지의 기획 검증 흐름을 참고할 때만 사용합니다.
