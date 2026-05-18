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
실제 계산 결과와 유저 보유 재화 저장은 이 파일의 안정 `id`를 기준으로 연결한다.

초기 구조 검증용 샘플 item이 일부 남아 있지만, 샘플 item은 실제 계산 결과나 유저 보유 재화 저장에 사용하지 않는다.

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

## 샘플 item 정리

현재 `data/items.js`에는 초기 구조 검증용 샘플 item이 남아 있다.

```text
artifact-sample-a-tier1
artifact-sample-a-tier2
artifact-sample-a-tier3
artifact-sample-a-tier4
artifact-sample-b-tier1
artifact-sample-b-tier2
artifact-sample-b-tier3
artifact-sample-b-tier4
equipment-hat-blueprint-t2
student-eleph-1
gift-sample
unknown-resource-sample
```

규칙:

- 샘플 item은 계산 결과의 `itemId`로 사용하지 않는다.
- 샘플 item은 유저 보유 재화 저장의 `itemId`로 사용하지 않는다.
- 실제 데이터가 준비되면 안정 ID를 새로 정하고, 샘플 item과 연결하지 않는다.
- 삭제는 참조 여부를 확인한 뒤 별도 정리 작업으로 진행한다.

장기적으로는 샘플 item을 `data/items.js`에서 제거하거나, 예제 전용 문서/테스트 데이터로 분리한다.

## 재화 연결 원칙

모든 재화 연결은 `itemId` 기준으로 한다.

```text
계산 결과 itemId = data/items.js id = 유저 보유 재화 itemId
```

예:

```js
// 계산 결과
{ itemId: "millennium_bd_t0", quantity: 12 }

// data/items.js
{ id: "millennium_bd_t0", name: "밀레니엄 초급 전술교육 BD" }

// 유저 보유 재화 저장
{ itemId: "millennium_bd_t0", quantity: 120 }
```

유저 보유 재화 저장에는 이름, 이미지 경로, 타입, 등급을 저장하지 않는다.

저장하는 값:

```js
{ itemId: "credit", quantity: 1000000 }
```

저장하지 않는 값:

```js
{
  itemName: "크레딧",
  imageUrl: "./images/items/common/credit.png",
  quantity: 1000000
}
```

이름, 이미지, 타입, 등급, 학원, 계열 정보는 `data/items.js`에서 조회한다.

계산 함수는 가능하면 다음 정보만 반환한다.

```js
{
  itemId,
  quantity,
  needsReview
}
```

`itemName`은 아직 `data/items.js`에 없는 임시 데이터의 fallback으로만 허용한다.  
`imageUrl`은 계산 결과에 넣지 않고 `data/items.js`의 `imageUrl`을 사용한다.

## itemId 확장 규칙

새 재화를 추가할 때는 기존 계산 데이터와 유저 저장 안정성을 우선한다.  
이미 계산 데이터에서 쓰고 있는 `itemId`가 있다면 그 값을 우선 유지하고 `data/items.js`를 맞춘다.

공통 재화:

```text
credit
secret-tech-note
```

활동 보고서:

```text
activity_report_t0
activity_report_t1
activity_report_t2
activity_report_t3
```

BD:

```text
{school}_bd_t0
{school}_bd_t1
{school}_bd_t2
{school}_bd_t3
```

기술 노트:

```text
{school}_note_t0
{school}_note_t1
{school}_note_t2
{school}_note_t3
```

오파츠:

```text
artifact-{familySlug}-tier1
artifact-{familySlug}-tier2
artifact-{familySlug}-tier3
artifact-{familySlug}-tier4
```

학생 엘레프:

```text
{studentSlug}-eleph
```

이미지 파일명은 `itemId`와 반드시 같을 필요는 없다.  
원본 파일명을 유지해도 되며, 실제 연결은 `data/items.js`의 `imageUrl`에 명시한다.

## grade 규칙

`grade`는 정렬과 필터를 위한 분류값이다.  
`id` 문자열과 반드시 같은 표기일 필요는 없다.

```text
tier1
tier2
tier3
tier4
tier5
tier6
tier7
tier8
tier9
tier10
null
```

예:

```js
{
  id: "millennium_bd_t0",
  grade: "tier1"
}
```

`t0`부터 `t3`은 각각 `tier1`부터 `tier4`에 대응한다.

장비 설계도는 장비 티어에 맞춰 `tier2`부터 `tier10`까지 사용할 수 있다.

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
equipment-enhancement
eleph
gift
unknown
```

공통 재화 이미지:

```js
{
  id: "credit",
  name: "크레딧",
  type: "currency",
  grade: null,
  school: null,
  familyId: "currency-credit",
  imageUrl: "./images/items/common/credit.png",
  needsReview: false
}
```

```js
{
  id: "secret-tech-note",
  name: "비의서",
  type: "tech-note",
  grade: null,
  school: null,
  familyId: "secret-tech-note",
  imageUrl: "./images/items/common/Item_Icon_SkillBook_Ultimate.png",
  needsReview: false
}
```

유저 보유 재화 저장은 공통 재화도 이미지 경로가 아니라 `itemId` 기준으로 한다.

```js
{ itemId: "credit", quantity: 1000000 }
{ itemId: "secret-tech-note", quantity: 3 }
```

비의서의 안정 ID는 `secret-tech-note`를 사용한다.  
스킬 요구량 데이터에서도 `secret_tech_sheet` 같은 원본형 ID를 쓰지 않고 `secret-tech-note`로 통일한다.

활동 보고서는 레벨 계산 데이터와 유저 저장 기준을 맞추기 위해 다음 안정 ID를 사용한다.

```text
activity_report_t0
activity_report_t1
activity_report_t2
activity_report_t3
```

`data/items.js`에서도 같은 ID를 사용하고, `grade` 필드는 `tier1`부터 `tier4`로 분류한다.

장비 강화석은 `type: "equipment-enhancement"`를 사용한다.

```text
equipment-enhancement-stone-basic
equipment-enhancement-stone-normal
equipment-enhancement-stone-advanced
equipment-enhancement-stone-superior
```

각 강화석은 `data/equipment-enhancement-items.js`의 EXP 값과 같은 안정 ID를 사용한다.

강화석 이미지:

```text
equipment-enhancement-stone-basic -> ./images/items/equipment-enhancement-stones/equipment_icon_exp_0.webp
equipment-enhancement-stone-normal -> ./images/items/equipment-enhancement-stones/equipment_icon_exp_1.webp
equipment-enhancement-stone-advanced -> ./images/items/equipment-enhancement-stones/equipment_icon_exp_2.webp
equipment-enhancement-stone-superior -> ./images/items/equipment-enhancement-stones/equipment_icon_exp_3.webp
```

## Grade

우선 다음 값을 사용한다.

```text
tier1
tier2
tier3
tier4
tier5
tier6
tier7
tier8
tier9
tier10
null
```

BD, 기술 노트, 활동 보고서처럼 기존 명칭이 있는 재화는 데이터 구조에서 `tier1`부터 `tier4`로 통일한다.  
장비 설계도는 장비 티어에 맞춰 `tier2`부터 `tier10`까지 사용한다.  
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

오파츠 후보 데이터는 전체 병합 전까지 후보/검수용으로 유지한다.  
다만 실제 계산 데이터에 등장하고 유저 보유 재화 저장 대상이 되는 오파츠는 `data/items.js`에 우선 등록한다.
후보 데이터의 `imageUrl`은 `sourceImagePath`를 기준으로 실제 이미지 경로를 연결한다.

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
  imageUrl: "./images/Ooparts - Ooparts_files/Item_Icon_Material_Wolfsegg_0.png",
  sourceImagePath: "Item_Icon_Material_Wolfsegg_0.png",
  needsReview: true
}
```

한국어 이름은 추측하지 않고 `nameKo: null`로 둔다.  
영어 이름은 원본 HTML에서 안정적으로 추출할 수 있을 때만 `nameEn`에 넣는다.  
`_0`, `_1`, `_2`, `_3`이 모두 있으면 해당 family는 1~4티어가 모두 있는 것으로 판단한다.

실제 오파츠 이름은 아직 추측해서 넣지 않는다.  
확실하지 않은 값은 `null` 또는 `needsReview: true`로 둔다.

현재 `data/items.js`에 우선 등록한 오파츠:

```text
artifact-phaistos-tier1
artifact-phaistos-tier2
artifact-phaistos-tier3
artifact-phaistos-tier4
artifact-rocket-tier1
artifact-rocket-tier2
artifact-rocket-tier3
```

이 항목들은 케이 스킬 재화 계산에 실제로 등장하므로 유저 보유 재화 저장에서도 같은 `itemId`를 사용한다.  
한국어 이름은 아직 검수하지 않았으므로 `needsReview: true`를 유지한다.

## 학원별 BD와 기술 노트

학원별 BD와 기술 노트는 `school`에 학원 slug를 넣는다.

현재 계산 데이터(`data/skillMaterialRequirements.js`)에서 실제로 사용하는 안정 itemId는 언더스코어 형식이다.

```text
{school}_bd_t0
{school}_bd_t1
{school}_bd_t2
{school}_bd_t3
{school}_note_t0
{school}_note_t1
{school}_note_t2
{school}_note_t3
```

`t0`부터 `t3`은 화면/문서의 `tier1`부터 `tier4`에 대응한다.

예:

```text
millennium_bd_t0
millennium_bd_t1
millennium_note_t0
millennium_note_t1
```

같은 학원과 같은 재화 종류는 `familyId`로 묶는다.

예:

```js
{
  id: "millennium_note_t0",
  name: "밀레니엄 초급 기술 노트",
  type: "tech-note",
  grade: "tier1",
  school: "millennium",
  familyId: "millennium-tech-note",
  imageUrl: "./images/items/academy-materials/Item_Icon_SkillBook_Millennium_0.png",
  needsReview: false
}
```

BD 이미지 파일명은 원본 파일명 규칙을 유지한다.

```text
images/items/academy-materials/Item_Icon_Material_ExSkill_{SchoolName}_{tierIndex}.png
```

기술 노트 이미지 파일명도 원본 파일명 규칙을 유지한다.

```text
images/items/academy-materials/Item_Icon_SkillBook_{SchoolName}_{tierIndex}.png
```

즉 `itemId`와 파일명이 반드시 같을 필요는 없다.  
유저 보유 재화와 계산 결과는 안정 `itemId`를 사용하고, 실제 이미지 파일 경로는 `data/items.js`의 `imageUrl`이 명시적으로 연결한다.

이 방식이 현재 프로젝트에 더 적합한 이유:

- 이미 `images/items/academy-materials/`에 전체 학원 이미지가 원본 파일명으로 들어와 있다.
- 파일명을 대량 변경하지 않아도 된다.
- 원본 이미지 출처와 파일명 추적이 쉽다.
- 유저 저장 데이터는 여전히 `itemId`만 사용하므로 이미지 파일명 변경의 영향을 받지 않는다.

현재 단계별 작업 계획:

```text
1. data/skillMaterialRequirements.js에서 실제 사용하는 BD/기술 노트 itemId 목록 확정
2. images/items/academy-materials/의 원본 파일명과 school/tier 매핑 확인
3. data/items.js의 기존 하이픈 예시 item을 실제 itemId 기준으로 교체 또는 보강
4. 학생 상세에서 itemId 기준 이미지 표시 확인
5. 문서와 TODO에서 실제 ID 규칙으로 정리
```

현재 계산 데이터에서 쓰는 BD/기술 노트는 밀레니엄 계열뿐이다.

```text
millennium_bd_t0
millennium_bd_t1
millennium_bd_t2
millennium_bd_t3
millennium_note_t0
millennium_note_t1
millennium_note_t2
millennium_note_t3
```

이 8개는 `data/items.js`에 실제 itemId와 imageUrl로 연결한다.  
다른 학원 item은 해당 학생의 스킬 요구량 데이터가 추가될 때 확장한다.

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
  studentSlug: "kei",
  materialSchool: "millennium",
  elephItemId: null,
  artifactFamilyIds: ["artifact-sample-a", "artifact-sample-b"],
  equipment: {
    slot1: "hat",
    slot2: "bag",
    slot3: "watch",
  },
  needsReview: true
}
```

필드 의미:

- `studentSlug`: 학생 slug. 현재 학생 상세 URL과 학생 장비 데이터 연결 기준이다.
- `materialSchool`: BD와 기술 노트에 사용할 학원 slug
- `elephItemId`: 학생 엘레프 아이템 ID. 확실하지 않으면 `null`
- `artifactFamilyIds`: 학생이 사용하는 오파츠 계열 ID 목록
- `equipment`: 학생이 사용하는 장비 종류. `slot1`, `slot2`, `slot3`에 장비 내부 ID를 저장한다.
- `needsReview`: 검수 필요 여부

## 학생별 엘레프 이미지 매핑

학생별 엘레프는 유저 보유 재화 저장과 성급 계산 결과 표시에서 같은 안정 `itemId`를 사용한다.

기본 itemId 규칙:

```text
{studentSlug}-eleph
```

예:

```text
kei-eleph
maki-eleph
noa-eleph
```

엘레프 이미지 파일명은 학생 이름으로 자동 추측하지 않는다.  
이미지 파일명이 `CH0064.png` 또는 `Item_Icon_SecretStone_Maki.png`처럼 되어 있어도 학생별 item에 실제 파일명을 명시적으로 연결한다.

`data/items.js`의 엘레프 item 예:

```js
{
  id: "kei-eleph",
  name: "케이의 엘레프",
  type: "eleph",
  grade: null,
  school: null,
  studentId: 10,
  familyId: "student-eleph",
  imageUrl: "./images/items/eleph/CH0064.png",
  needsReview: false
}
```

확실하지 않은 매핑은 다음처럼 둔다.

```js
{
  id: "kei-eleph",
  name: "케이의 엘레프",
  type: "eleph",
  studentId: 10,
  imageUrl: null,
  needsReview: true
}
```

유저 보유 재화 저장은 이미지 경로나 학생 이름이 아니라 `itemId` 기준으로 한다.

```js
{
  itemId: "kei-eleph",
  quantity: 120
}
```

엘레프 이미지 후보 검수용 데이터:

```text
data/eleph-image-candidates.js
```

이 파일은 최종 재화 마스터가 아니라, 현재 학생별 엘레프 itemId와 원본 이미지 후보 파일을 검수하기 위한 중간 데이터다.  
후보 파일은 `data/items.js`의 `imageUrl`로 바로 사용하지 않는다.

흐름:

```text
1. data/eleph-image-candidates.js에서 학생별 후보 파일 검수
2. 확정된 이미지 파일을 실제 서비스 이미지 폴더로 복사 또는 이동
3. data/items.js의 해당 엘레프 item imageUrl에 실제 경로 연결
4. needsReview를 false로 변경
```

확정된 엘레프 이미지는 다음 경로 규칙을 사용한다.

```text
images/items/eleph/{itemId}.png
```

예:

```text
images/items/eleph/aru-eleph.png
images/items/eleph/hifumi-eleph.png
```

## 요구량 데이터 분리

요구량 데이터는 성장 재화 연결 데이터와 분리한다.

스킬 강화 요구량:

```text
data/skillMaterialRequirements.js
```

스킬 강화 요구량의 `studentId`는 URL slug가 아니라 `students.js`의 숫자 `id`를 사용한다.  
예: 케이는 `slug: "kei"`로 상세 페이지에 접근하지만, 스킬 재화 요구량은 `studentId: 10`으로 연결한다.
스킬 강화 요구량에서 오파츠 재화는 `data/ooparts-candidates.js`의 `id`를 `itemId`로 사용한다.

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
