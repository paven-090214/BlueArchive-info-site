# 재화 계산기 데이터 구조

## 목적

재화 계산기 UI와 계산 로직을 만들기 전에 재화 마스터와 학생별 성장 재화 연결 구조를 준비한다.

현재 단계에서는 실제 DB를 연결하지 않는다.  
`data/raw/rawItems.js`는 원본 재화 이름 후보로만 유지하고, 계산 로직에서 직접 사용하지 않는다.

## 재화 마스터

파일:

```text
data/items.js
```

`data/items.js`는 재화 마스터 데이터다.  
아직 모든 재화를 완성하지 않고, 계산 구조를 검증하기 위한 샘플 데이터를 먼저 둔다.

재화 구조:

```js
{
  id,
  name,
  type,
  grade,
  school,
  familyId,
  imageUrl,
  needsReview
}
```

필드 의미:

- `id`: 재화 고유 ID
- `name`: 화면 표시 이름
- `type`: 재화 종류
- `grade`: 등급
- `school`: 학원 재화일 경우 학원 slug, 아니면 `null`
- `familyId`: 같은 계열 재화를 묶는 ID
- `imageUrl`: 이미지 경로, 없으면 `null`
- `needsReview`: 검수 필요 여부

## Type

우선 다음 값을 사용한다.

```text
currency
pyroxene
report
bd
tech-note
artifact
equipment-blueprint
eleph
gift
unknown
```

## Grade

우선 다음 값을 사용한다.

```text
tier1
tier2
tier3
tier4
null
```

BD, 기술 노트, 활동 보고서처럼 기존 명칭이 있는 재화도 데이터 구조에서는 `tier1`부터 `tier4`로 통일한다.  
화면 표시용 등급명은 나중에 별도 매핑으로 처리한다.

## 오파츠 구조

오파츠는 `type: "artifact"`를 사용한다.

오파츠는 1등급부터 4등급까지 존재하며, 같은 오파츠 계열은 `familyId`로 묶는다.

오파츠 등급은 별 개수나 화면 표시 순서로 판단하지 않는다.  
아이템 이미지 파일명 suffix를 기준으로 판단한다.

파일명 구조:

```text
Item_Icon_Material_{familyName}_{tierIndex}.png
```

등급 매핑:

```text
_0 -> tier1
_1 -> tier2
_2 -> tier3
_3 -> tier4
```

`familyName`은 slug로 바꿔 `familyId`를 만든다.

예:

```text
Wolfsegg -> artifact-wolfsegg
WinniStone -> artifact-winni-stone
Voynich -> artifact-voynich
```

아이템 ID는 다음 형식을 사용한다.

```text
artifact-{familySlug}-tier1
artifact-{familySlug}-tier2
artifact-{familySlug}-tier3
artifact-{familySlug}-tier4
```

오파츠 후보 파일:

```text
data/ooparts-candidates.js
```

오파츠 후보 데이터는 아직 `data/items.js`에 병합하지 않는다.  
검수 후 나중에 재화 마스터로 병합한다.

후보 데이터 구조:

```js
{
  id: "artifact-wolfsegg-tier1",
  nameEn: null,
  nameKo: null,
  type: "artifact",
  grade: "tier1",
  school: null,
  familyId: "artifact-wolfsegg",
  imageUrl: null,
  sourceImagePath: "Item_Icon_Material_Wolfsegg_0.png",
  needsReview: true
}
```

한국어 이름은 추측하지 않고 `nameKo: null`로 둔다.  
영어 이름은 원본 HTML에서 안정적으로 추출할 수 있을 때만 `nameEn`에 넣는다.  
`_0`, `_1`, `_2`, `_3`이 모두 있으면 해당 family는 1~4티어가 모두 있는 것으로 판단한다.

실제 오파츠 이름은 아직 추측해서 넣지 않는다.  
확실하지 않은 값은 `null` 또는 `needsReview: true`로 둔다.

## 학원별 BD와 기술 노트

학원별 BD와 기술 노트는 `school`에 학원 slug를 넣는다.

예:

```text
millennium-bd-tier1
millennium-bd-tier2
millennium-tech-note-tier1
millennium-tech-note-tier2
```

같은 학원과 같은 재화 종류는 `familyId`로 묶는다.

예:

```js
{
  id: "millennium-tech-note-tier1",
  name: "밀레니엄 초급 기술 노트",
  type: "tech-note",
  grade: "tier1",
  school: "millennium",
  familyId: "millennium-tech-note",
  imageUrl: null,
  needsReview: true
}
```

## 학생별 성장 재화 연결

파일:

```text
data/student-growth-profiles.js
```

학생별로 어떤 성장 재화를 사용하는지 연결한다.  
이 파일은 요구량 테이블이 아니라, 학생과 재화 계열을 연결하는 데이터다.

구조:

```js
{
  studentId: 1,
  materialSchool: "millennium",
  elephItemId: null,
  artifactFamilyIds: ["artifact-sample-a", "artifact-sample-b"],
  equipmentSlotIds: ["hat", "bag", "watch"],
  needsReview: true
}
```

필드 의미:

- `studentId`: 학생 ID. 현재 프로젝트의 숫자 `id`를 유지한다.
- `materialSchool`: BD와 기술 노트에 사용할 학원 slug
- `elephItemId`: 학생 엘레프 아이템 ID. 확실하지 않으면 `null`
- `artifactFamilyIds`: 학생이 사용하는 오파츠 계열 ID 목록
- `equipmentSlotIds`: 학생 장비 슬롯 ID 목록
- `needsReview`: 검수 필요 여부

## 요구량 데이터 분리

요구량 데이터는 성장 재화 연결 데이터와 분리한다.

스킬 강화 요구량:

```text
data/skillMaterialRequirements.js
```

스킬 강화 재화 계산 규칙:

```text
docs/data-skill-material-calculator.md
```

스킬 강화 재화 계산 UI:

```text
docs/ui-skill-material-calculator.md
```

성급 및 전용무기 성급 요구량:

```text
data/starRankRequirements.js
```

성급 및 전용무기 성급 재화 계산 규칙:

```text
docs/data-star-rank-calculator.md
```

학생 레벨업 EXP 및 크레딧 계산 규칙:

```text
docs/data-character-level-calculator.md
```

## 아직 만들지 않는 요구량 데이터

다음 요구량 테이블은 아직 만들지 않는다.

- 장비 티어업 요구량
- 전용무기 레벨 요구량
