# character-detail.html

## 공부 기준

이 문서는 학생 상세 페이지인 `character-detail.html`을 공부하기 위한 문서다.

기준 학생은 `케이`다.

```text
character-detail.html?id=kei
```

주의할 점:

- 현재 `data/students.js`에서 케이의 `id`는 숫자 `10`이 아니라 문자열 `"kei"`다.
- 그래서 URL도 `?id=10`이 아니라 `?id=kei`로 여는 것이 현재 데이터 기준에 맞다.
- 계산 UI는 학생 레벨, 성급, 전용무기 성급, 스킬 레벨을 입력값으로 사용한다.
- 계산 결과는 필요한 재화 영역에 카드 형태로 출력된다.

## 연결된 파일

### HTML / CSS

```text
character-detail.html
styles.css
```

### 데이터

```text
data/index.js
data/academies.js
data/students.js
data/characterExpTable.js
data/activityReports.js
data/skillMaterialRequirements.js
data/starRankRequirements.js
```

### 계산 함수

```text
utils/characterLevelCalculator.js
utils/skillMaterialCalculator.js
utils/starRankCalculator.js
```

## HTML 전체 구조

```text
body
├─ header.site-header
└─ main.page-shell.character-detail-shell
   ├─ section.character-detail-grid
   │  ├─ article.character-profile-panel
   │  │  ├─ 큰 학생 표시 영역
   │  │  └─ 이름 / 프로필 설명
   │  └─ article.character-info-panel
   │     ├─ 기본 정보 dl
   │     └─ 지형 적성 영역
   └─ section.character-detail-stack
      ├─ article.character-skill-panel
      │  └─ EX / 1스킬 / 2스킬 / 3스킬 카드
      ├─ article.student-level-panel
      │  ├─ 목표 학생 레벨 입력
      │  ├─ 목표 성급 선택
      │  ├─ 장비 티어 placeholder
      │  ├─ 애장품 placeholder
      │  └─ 필요한 재화 material-list
      ├─ article.character-stat-panel
      └─ article.character-weapon-panel
```

## script type="module"

학생 상세 페이지의 실제 동작은 아래 모듈 스크립트에서 처리한다.

```js
import { academies, students } from "./data/index.js";
import { calculateCharacterLevelMaterials } from "./utils/characterLevelCalculator.js";
import { calculateSkillMaterials, SKILL_LEVEL_RANGES } from "./utils/skillMaterialCalculator.js";
import { calculateStarRankEleph } from "./utils/starRankCalculator.js";
```

의미:

- `academies`, `students`: 화면에 표시할 학생 기본 정보와 학원 이름을 찾는다.
- `calculateCharacterLevelMaterials`: 목표 학생 레벨까지 필요한 보고서와 크레딧을 계산한다.
- `calculateSkillMaterials`: 스킬 레벨업에 필요한 BD, 기술 노트, 오파츠, 크레딧을 계산한다.
- `calculateStarRankEleph`: 성급과 전용무기 성급에 필요한 엘레프 수량을 계산한다.

## 학생 찾기 흐름

```js
const characterIdParam = new URLSearchParams(window.location.search).get("id");
```

URL에서 `id` 값을 가져온다.

케이 페이지라면:

```text
character-detail.html?id=kei
```

이므로:

```js
characterIdParam === "kei"
```

다음 코드에서 숫자로 바꿀 수 있으면 숫자로 바꾸고, 아니면 문자열 그대로 사용한다.

```js
const characterId = Number.isNaN(Number(characterIdParam))
  ? characterIdParam
  : Number(characterIdParam);
```

케이는 숫자가 아니므로:

```js
characterId === "kei"
```

그 다음 학생 배열에서 id가 같은 학생을 찾는다.

```js
const selectedStudent =
  students.find((student) => student.id === characterId) ||
  students.find((student) => student.id === 3) ||
  students[0];
```

케이 기준 결과:

```js
selectedStudent.id === "kei"
selectedStudent.name === "케이"
selectedStudent.baseStar === 3
```

만약 URL의 id에 해당하는 학생을 못 찾으면 id가 `3`인 학생을 fallback으로 사용하고, 그것도 없으면 첫 번째 학생을 사용한다.

## 케이 데이터

`data/students.js`의 케이 데이터는 현재 이런 성격이다.

```text
id: "kei"
name: "케이"
academySlug: "millennium"
baseStar: 3
role: "서포터"
position: "Back"
attackType: "신비"
defenseType: "탄력장갑"
```

학원 이름은 학생 데이터의 `academySlug`로 찾는다.

```js
const selectedAcademy = academies.find(
  (academy) => academy.slug === selectedStudent.academySlug,
);
```

케이는 `academySlug`가 `"millennium"`이므로 밀레니엄 학원 데이터를 찾는다.

## renderStudentDetail(student)

이 함수는 선택된 학생의 기본 정보를 화면에 출력한다.

```js
renderStudentDetail(selectedStudent);
```

주요 역할:

```text
1. 브라우저 제목을 학생 이름으로 변경한다.
2. 큰 표시 영역에 학생 이름을 넣는다.
3. 프로필 설명을 넣는다.
4. data-student-field 속성을 가진 dd 요소들에 학생 정보를 넣는다.
```

예:

```html
<dd data-student-field="attackType">폭발</dd>
```

여기에 케이 데이터가 들어가면:

```text
신비
```

가 표시된다.

핵심 코드는 이 부분이다.

```js
Object.entries(fieldValues).forEach(([field, value]) => {
  const target = document.querySelector(`[data-student-field="${field}"]`);

  if (target) {
    target.textContent = value;
  }
});
```

`fieldValues` 객체의 key와 HTML의 `data-student-field` 값이 연결된다.

## 계산에 쓰는 상태 변수

```js
let selectedBaseStar = getBaseStar(selectedStudent);
let selectedWeaponStar = getWeaponStar();
let targetStudentLevel = Number(studentLevelInput.value) || 1;
let targetBaseStar = selectedBaseStar;
let targetWeaponStar = selectedWeaponStar;
const initialStudentLevel = 1;
const initialBaseStar = getBaseStar(selectedStudent);
const initialWeaponStar = getWeaponStar();
```

케이 기준 초기값:

```text
selectedBaseStar = 3
selectedWeaponStar = 0
targetStudentLevel = 1
targetBaseStar = 3
targetWeaponStar = 0
initialStudentLevel = 1
initialBaseStar = 3
initialWeaponStar = 0
```

현재 구현에서는 유저의 실제 보유 상태를 저장하지 않는다.

그래서:

- 현재 학생 레벨은 항상 `1`로 본다.
- 현재 전용무기 성급은 항상 `0`으로 본다.
- 현재 기본 성급은 학생 데이터의 `baseStar`를 사용한다.

## 목표 학생 레벨 입력

학생 레벨은 number input과 range input이 같이 움직인다.

```js
function syncStudentLevel(value) {
  const normalizedLevel = Math.min(90, Math.max(1, Number(value) || 1));
  studentLevelInput.value = String(normalizedLevel);
  studentLevelRange.value = String(normalizedLevel);
  targetStudentLevel = normalizedLevel;
  renderRequiredMaterials();
}
```

흐름:

```text
1. 입력값을 숫자로 바꾼다.
2. 최소 1, 최대 90으로 제한한다.
3. number input과 range input 값을 같은 값으로 맞춘다.
4. targetStudentLevel을 갱신한다.
5. renderRequiredMaterials()를 다시 실행해서 필요한 재화를 갱신한다.
```

즉 목표 레벨을 바꿀 때마다 계산 결과가 다시 그려진다.

## 성급 / 전용무기 별 버튼

성급 선택 UI는 총 9칸이다.

```text
1~5번: 기본 성급
6~9번: 전용무기 1~4성
```

별 종류를 판단하는 함수:

```js
function getGrowthStarKind(slotNumber, baseStar, weaponStar) {
  if (slotNumber <= 5) {
    return slotNumber <= baseStar ? "student" : "blank";
  }

  return slotNumber - 5 <= weaponStar ? "weapon" : "blank";
}
```

케이가 기본 3성, 전용무기 0성이라면:

```text
1번 student
2번 student
3번 student
4번 blank
5번 blank
6번 blank
7번 blank
8번 blank
9번 blank
```

기본 성급 버튼을 누르면:

```js
targetBaseStar = slotNumber;
targetWeaponStar = 0;
```

전용무기 버튼을 누르면:

```js
targetBaseStar = 5;
targetWeaponStar = weaponRank;
```

즉 전용무기를 선택하면 기본 성급은 자동으로 5성 취급된다.

## setupSkillMaterialControls()

HTML에는 이미 스킬 카드와 현재 레벨 select가 있다.

`setupSkillMaterialControls()`는 여기에 목표 레벨 select를 추가한다.

```js
const skillTypes = ["ex", "normal", "passive", "sub"];
```

스킬 카드 순서와 skillType 연결:

```text
첫 번째 카드 -> ex
두 번째 카드 -> normal
세 번째 카드 -> passive
네 번째 카드 -> sub
```

스킬 레벨 범위:

```js
export const SKILL_LEVEL_RANGES = {
  ex: { min: 1, max: 5 },
  normal: { min: 1, max: 10 },
  passive: { min: 1, max: 10 },
  sub: { min: 1, max: 10 },
};
```

그래서:

- EX 스킬 목표 select는 `Lv. 1`부터 `Lv. 5`까지 만든다.
- 나머지 스킬 목표 select는 `Lv. 1`부터 `Lv. 10`까지 만든다.

목표 select를 만든 뒤에는 현재 select와 목표 select 양쪽에 이벤트를 붙인다.

```js
currentSelect.addEventListener("change", renderRequiredMaterials);
targetSelect.addEventListener("change", renderRequiredMaterials);
```

즉 스킬 레벨을 바꾸면 필요한 재화가 다시 계산된다.

## renderRequiredMaterials()

이 함수가 필요한 재화를 실제로 계산하고 화면에 출력하는 핵심 함수다.

전체 흐름:

```text
1. 학생 레벨업 재화를 계산한다.
2. 성급 / 전용무기 엘레프를 계산한다.
3. 스킬 레벨업 재화를 계산한다.
4. itemId 기준으로 재화를 합산한다.
5. 필요한 경우 케이의 엘레프를 추가한다.
6. 재화를 정렬한다.
7. 재화 카드 article 배열을 만든다.
8. 데이터가 없거나 필요한 재화가 없으면 안내 문구를 추가한다.
9. material-list의 기존 내용을 새 카드들로 교체한다.
```

코드 구조:

```js
const levelResult = calculateCharacterLevelMaterials(...);
const starResult = calculateStarRankEleph(...);
const skillResults = getSkillMaterialResults();
const materialMap = new Map();

mergeMaterials(materialMap, levelResult.materials);
skillResults.forEach((result) => mergeMaterials(materialMap, result.materials));
```

여기서 `materialMap`을 쓰는 이유는 같은 재화를 하나로 합치기 위해서다.

예:

```text
레벨업 크레딧 3,780
스킬 강화 크레딧 80,000
```

둘 다 `itemId`가 `"credit"`이면:

```text
크레딧 83,780
```

한 카드로 합쳐진다.

## 학생 레벨업 계산

호출:

```js
calculateCharacterLevelMaterials({
  currentLevel: initialStudentLevel,
  targetLevel: targetStudentLevel,
});
```

케이도 다른 학생과 같은 학생 레벨 EXP 테이블을 사용한다.

사용 데이터:

```text
data/characterExpTable.js
data/activityReports.js
```

계산 방식:

```text
필요 EXP = 목표 레벨 누적 EXP - 현재 레벨 누적 EXP
필요 크레딧 = 필요 EXP * 7
```

활동 보고서는 높은 EXP 보고서부터 최대한 사용한다.

보고서 종류:

```text
초급 활동 보고서: 50 EXP
일반 활동 보고서: 500 EXP
상급 활동 보고서: 2,000 EXP
최상급 활동 보고서: 10,000 EXP
```

예를 들어 목표 레벨을 10으로 바꾸면:

```text
Lv.1 누적 EXP = 0
Lv.10 누적 EXP = 540
필요 EXP = 540
필요 크레딧 = 540 * 7 = 3,780
```

## 스킬 재화 계산

스킬 계산은 `getSkillMaterialResults()`가 현재 화면의 select 값을 읽어서 실행한다.

```js
return calculateSkillMaterials({
  studentId: selectedStudent.id,
  skillType,
  currentLevel: currentSelect.value,
  targetLevel: targetSelect?.value ?? currentSelect.value,
});
```

케이 기준:

```js
studentId: "kei"
```

`calculateSkillMaterials()`는 `data/skillMaterialRequirements.js`에서 아래 조건에 맞는 행만 찾는다.

```js
row.studentId === studentId
row.skillType === skillType
row.fromLevel >= normalizedCurrentLevel
row.toLevel <= normalizedTargetLevel
```

예:

```text
케이 EX 현재 Lv.1, 목표 Lv.3
```

그러면 조건에 맞는 행은:

```text
studentId가 "kei"
skillType이 "ex"
fromLevel이 1 이상
toLevel이 3 이하
```

즉 보통:

```text
1 -> 2 행
2 -> 3 행
```

이 선택된다.

그 행들의 `materials` 배열을 돌면서 `itemId` 기준으로 합산한다.

## 오파츠 계산

오파츠만 별도로 계산하는 함수가 있는 것은 아니다.

오파츠는 `data/skillMaterialRequirements.js` 안의 스킬 재화 목록에 포함되어 있고, 스킬 재화 계산 과정에서 같이 합산된다.

예:

```js
{
  itemId: "phaistos_disc_piece",
  itemName: "Phaistos Disc Piece",
  quantity: 18,
  needsReview: true
}
```

이런 데이터가 스킬 요구 재화 행에 들어 있으면, `calculateSkillMaterials()`가 다른 재화와 똑같이 처리한다.

정리하면:

```text
스킬 레벨 select 변경
-> getSkillMaterialResults()
-> calculateSkillMaterials()
-> skillMaterialRequirements에서 케이 행 찾기
-> BD / 기술 노트 / 오파츠 / 크레딧을 itemId 기준으로 합산
-> renderRequiredMaterials()에서 전체 재화와 다시 합산
-> 화면에 카드로 출력
```

## 성급 / 전용무기 엘레프 계산

호출:

```js
calculateStarRankEleph({
  currentBaseStar: initialBaseStar,
  currentWeaponStar: initialWeaponStar,
  targetBaseStar,
  targetWeaponStar,
});
```

케이 기준 현재값:

```text
currentBaseStar = 3
currentWeaponStar = 0
```

성급 순서:

```text
base-1
base-2
base-3
base-4
base-5
weapon-1
weapon-2
weapon-3
weapon-4
```

`data/starRankRequirements.js`에 있는 수량:

```text
3성 -> 4성: 100
4성 -> 5성: 120
5성 -> 전용무기 1성: 0
전용무기 1성 -> 전용무기 2성: 120
전용무기 2성 -> 전용무기 3성: 180
전용무기 3성 -> 전용무기 4성: 200
```

예:

```text
케이 3성 -> 5성
필요 엘레프 = 100 + 120 = 220
```

예:

```text
케이 3성 -> 전용무기 2성
필요 엘레프 = 100 + 120 + 0 + 120 = 340
```

엘레프 결과는 아직 안정적인 itemId 데이터가 없어서 임시 id를 만든다.

```js
itemId: `${selectedStudent.id}-eleph`
itemName: `${selectedStudent.name}의 엘레프`
needsReview: true
```

케이 기준:

```text
itemId: "kei-eleph"
itemName: "케이의 엘레프"
검수 필요 표시
```

## mergeMaterials(materialMap, materials)

이 함수는 재화를 합치는 역할이다.

```js
const existing = materialMap.get(material.itemId);
```

이미 같은 `itemId`가 있으면:

```js
existing.quantity += material.quantity;
existing.needsReview = existing.needsReview || Boolean(material.needsReview);
```

즉:

- 수량은 더한다.
- 하나라도 `needsReview: true`이면 최종 카드도 검수 필요가 된다.

같은 `itemId`가 없으면 새로 넣는다.

```js
materialMap.set(material.itemId, { ...material, needsReview: Boolean(material.needsReview) });
```

## sortMaterials(materials)

재화 카드를 보여주기 전에 정렬한다.

```js
if (left.itemId === "credit") {
  return 1;
}

if (right.itemId === "credit") {
  return -1;
}

return left.itemName.localeCompare(right.itemName, "ko");
```

의미:

- 크레딧은 항상 뒤쪽으로 보낸다.
- 나머지는 이름 기준으로 정렬한다.

## createMaterialCard(material)

재화 하나를 화면에 보이는 카드 하나로 만든다.

결과 구조:

```text
article.material-card
├─ div.material-image-placeholder
└─ div
   ├─ div.material-title-row
   │  ├─ h3 재화 이름
   │  └─ span.material-review-badge 검수 필요
   └─ p 필요 수량 N
```

`needsReview`가 true이면 검수 필요 badge를 붙인다.

수량은 `formatNumber()`로 천 단위 쉼표가 들어간다.

```js
new Intl.NumberFormat("ko-KR").format(value)
```

예:

```text
80000 -> 80,000
```

## getMaterialInitial(name)

현재는 실제 재화 이미지를 쓰지 않고 placeholder 글자를 표시한다.

```text
크레딧 포함 -> C
BD 포함 -> BD
보고서 포함 -> EXP
노트 포함 -> 노
엘레프 포함 -> 엘
그 외 -> 첫 글자
```

그래서 오파츠 이름이 영어라면 첫 글자가 표시된다.

예:

```text
Phaistos Disc Piece -> P
Broken Phaistos Disc -> B
```

## 마지막 실행 순서

스크립트 마지막에는 초기 화면을 만들기 위한 함수들이 실행된다.

```js
setupSkillMaterialControls();
syncStudentLevel(1);
renderGrowthStars();
renderWeaponStarDisplay();
renderRequiredMaterials();
```

흐름:

```text
1. 스킬 카드에 현재/목표 레벨 select를 준비한다.
2. 학생 레벨을 1로 맞추고 재화 계산을 한 번 실행한다.
3. 성급 별 버튼을 그린다.
4. 전용무기 별 표시를 갱신한다.
5. 필요한 재화를 다시 계산해서 화면에 출력한다.
```

`syncStudentLevel(1)` 안에서도 `renderRequiredMaterials()`가 실행되므로, 초기 로딩 때 계산 함수가 한 번 이상 실행된다.

## 케이 페이지를 따라 읽는 순서

처음 공부할 때는 아래 순서로 보면 된다.

```text
1. character-detail.html?id=kei 로 접속한다고 가정한다.
2. URL에서 id 값을 읽는 부분을 본다.
3. selectedStudent가 어떻게 케이 객체가 되는지 본다.
4. renderStudentDetail(selectedStudent)가 기본 정보를 어떻게 넣는지 본다.
5. 초기 상태 변수들이 케이 기준으로 어떤 값이 되는지 적어본다.
6. setupSkillMaterialControls()가 스킬 카드에 목표 select를 추가하는 과정을 본다.
7. 목표 레벨을 바꾸면 syncStudentLevel()이 실행되는 흐름을 본다.
8. 별을 누르면 targetBaseStar, targetWeaponStar가 어떻게 바뀌는지 본다.
9. renderRequiredMaterials() 안에서 세 계산 결과가 합쳐지는 과정을 본다.
10. 마지막에 materialList.replaceChildren(...cards)로 화면이 교체되는 것을 확인한다.
```

## 핵심 요약

```text
selectedStudent
  -> 화면 기본 정보 출력
  -> 계산에 사용할 studentId 제공

targetStudentLevel
  -> 학생 레벨업 재화 계산

targetBaseStar / targetWeaponStar
  -> 엘레프 계산

스킬 현재/목표 select
  -> 스킬 재화 계산

levelResult + skillResults + starResult
  -> itemId 기준 합산
  -> material card 생성
  -> material-list에 출력
```

