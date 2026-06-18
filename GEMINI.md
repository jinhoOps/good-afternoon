# 🧠 GEMINI Global Harness: The Map

이 문서는 굿애프터눈 프로젝트의 개발 및 기획 수행을 위한 전역 가이드라인과 규칙들을 정리한 인덱스 파일입니다.

## 🗺️ Harness Index
- [🤖 Common Agent Instructions](file:///D:/jhkSandBox/CODE/good-afternoon/AGENTS.md): Gemini 외 에이전트까지 공통으로 따르는 작업 지침
- [🎯 Mission & Philosophy](file:///D:/jhkSandBox/CODE/good-afternoon/harness/00_mission.md): 에이전트의 역할과 철학
- [🛡️ Integrity & Efficiency](file:///D:/jhkSandBox/CODE/good-afternoon/harness/01_integrity.md): 시스템 무결성 보호 및 효율적 자원 관리
- [🏗️ Domain SOPs](file:///D:/jhkSandBox/CODE/good-afternoon/harness/10_sops.md): 웹 프론트엔드 목업 제작 및 기획 검증 절차
- [✅ Validation & DoD](file:///D:/jhkSandBox/CODE/good-afternoon/harness/20_validation.md): 완료 정의(DoD) 및 검증 루프
- [🔑 Mastery Layer Specification](file:///D:/jhkSandBox/CODE/good-afternoon/harness/30_mastery_spec.md): 마스터리 레이어 기획 및 설계 세부 사항

## 🛡️ Global Invariants (핵심 불변량)
1. **Language**: 모든 응답, 주석, 가이드는 **한국어(존댓말)**와 **UTF-8**을 사용합니다.
2. **Workflow**: 모든 작업은 **Research -> Strategy (Plan) -> Execution -> Validation** 루프를 강제합니다.
3. **Boring Tech**: 에이전트 성공률을 높이기 위해 훈련 데이터가 풍부한 기술(Vanilla HTML/JS/CSS)을 우선 선택합니다.
4. **No Sprawl**: `GEMINI.md`는 인덱스 역할을 유지하며, 상세 규칙은 반드시 `harness/` 하위로 분리합니다.
5. **Common Agent Guide**: 도구와 모델에 상관없이 적용되는 작업 지침은 `AGENTS.md`를 먼저 확인합니다.
