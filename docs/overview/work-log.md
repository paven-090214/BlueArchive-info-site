# Work Log

## 2차 JavaScript 감사 종료

- 핵심 수정: 성급/전용무기, 학생 레벨 EXP, 스킬, 장비 계산에서 누락 데이터가 정상 계산처럼 보이지 않도록 `needsReview`, 누락 목록, 완료 여부 필드를 보강했다.
- P3 처리: 미호출 후보인 `setOwnedGiftQuantities()`, `calculateMissingMaterials()`, `itemTypes`, `itemGrades`는 삭제하지 않고 향후 용도 주석만 남겼다. pickup 후보 추출의 이름 기반 매핑은 후보 생성 단계 한정 규칙으로 문서화했다.
- 보류: `fixedPoint` 선물 표시 방식 분리, pickup 추출 스크립트 구조 리팩토링, 확실하지 않은 unused 삭제.
- 주의 파일: `character-detail.html`, `styles.css`, `docs/ui/ui-chracter-detail.md`는 이전 UI 변경과 감사 변경이 섞여 있을 수 있다. `sources/`는 untracked raw/source 성격이라 별도 판단 필요.
- 다음 추천: HTML inline script/UI 흐름 감사 또는 data consistency 감사로 넘어가기.
