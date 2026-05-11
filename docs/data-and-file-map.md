# 데이터와 파일 지도

## 목적

이 문서는 프로젝트 안의 파일들이 어떤 역할을 하는지 빠르게 찾기 위한 지도다.

## 화면 파일

| 파일 | 역할 |
| --- | --- |
| `index.html` | 메인 화면, 학원 목록, 현재 픽업, 이벤트, 이동 카드 |
| `characters.html` | 학생 목록, 필터, 학생 카드 |
| `character-detail.html` | 학생 상세 화면, 성장 설정, 재화 계산 |
| `academy-detail.html` | 학원 상세 화면, 동아리 목록, 지도 |
| `pickup-history.html` | 과거 픽업 기록 |
| `bond-calculator.html` | 인연랭크 계산기 |

## 스타일 파일

| 파일 | 역할 |
| --- | --- |
| `styles.css` | 전체 화면 공통 스타일과 페이지별 스타일 |

현재 별도 CSS 파일을 나누지 않고 `styles.css` 하나에 모아둔다.

## 대표 데이터 파일

| 파일 | 역할 |
| --- | --- |
| `data/index.js` | 주요 데이터를 한 번에 export하는 진입점 |
| `data/students.js` | 학생 기본 정보 |
| `data/academies.js` | 학원 정보 |
| `data/clubs.js` | 동아리 정보 |
| `data/pickups.json` | 최종 픽업 기록 데이터 |
| `data/gifts.js` | 인연랭크 계산용 선물 데이터 |
| `data/character-gift-preferences.js` | 학생별 선호 선물 |

## 재화 계산 데이터

| 파일 | 역할 |
| --- | --- |
| `data/skillMaterialRequirements.js` | 학생별 스킬 강화 요구량 |
| `data/characterExpTable.js` | 학생 레벨별 누적 EXP와 다음 레벨 필요 EXP |
| `data/activityReports.js` | 활동 보고서별 EXP |
| `data/starRankRequirements.js` | 성급/전용무기 성급 공통 엘레프 요구량 |
| `data/items.js` | 재화 마스터 샘플 |
| `data/student-growth-profiles.js` | 학생별 성장 재화 연결 샘플 |

## 계산 함수

| 파일 | 역할 |
| --- | --- |
| `utils/skillMaterialCalculator.js` | 스킬 강화 재화 계산 |
| `utils/characterLevelCalculator.js` | 학생 레벨업 EXP, 활동 보고서, 크레딧 계산 |
| `utils/starRankCalculator.js` | 성급/전용무기 성급 엘레프 계산 |

## 스킬 재화 수집/변환 관련 파일

| 파일 | 역할 |
| --- | --- |
| `tools/export_growth_material_raw.py` | 원본 성장 재화 데이터 추출 |
| `tools/convert_skill_requirements_to_js.py` | 스킬 요구량 데이터를 JS로 변환 |
| `tools/test_calculate_skill_materials.py` | 계산 검증용 테스트 스크립트 |
| `data/skill_material_raw.csv` | 원본 또는 중간 CSV |
| `data/skill_material_requirements.csv` | 스킬 요구량 CSV |
| `data/skill_material_requirements_mapped.csv` | 매핑 반영 요구량 CSV |
| `data/skill_items_mapping.csv` | 아이템 이름과 itemId 매핑 |
| `data/skill_items_unique.csv` | 스킬 재화 고유 목록 |
| `data/skill_material_rows_preview.csv` | 검수용 미리보기 |

CSV 파일들은 데이터 파이프라인의 중간 산출물 성격이 강하다.  
커밋 여부는 재현성과 검수 필요성에 따라 결정한다.

## Raw/source 파일

| 경로 | 역할 |
| --- | --- |
| `sources/` | 외부에서 저장한 원본 HTML 등 |
| `data/raw/rawItems.js` | 원본 재화 이름 후보 |

Raw/source 파일은 계산 로직에서 직접 사용하지 않는다.  
계산에 필요하면 `data/` 아래 안정 데이터로 변환한 뒤 사용한다.

## 임시/커밋 주의 파일

일반적으로 커밋하지 않는 것이 좋은 파일:

```text
.vscode/
data/debug_html/
BlueArchive-info-site/
```

`BlueArchive-info-site/`는 중첩 Git 저장소로 들어온 폴더라 커밋에 포함하지 않는다.

## 파일을 찾는 요령

학생 기본 정보가 이상하다:

```text
data/students.js
```

학생 상세 화면이 이상하다:

```text
character-detail.html
styles.css
```

스킬 재화 수량이 이상하다:

```text
data/skillMaterialRequirements.js
utils/skillMaterialCalculator.js
```

레벨업 크레딧이나 보고서 수량이 이상하다:

```text
data/characterExpTable.js
data/activityReports.js
utils/characterLevelCalculator.js
```

성급/전용무기 엘레프 수량이 이상하다:

```text
data/starRankRequirements.js
utils/starRankCalculator.js
```
