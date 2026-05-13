# characters.html 설명

`characters.html`은 학생 목록 페이지입니다.

현재 역할:

- 학생 이름 검색
- 학원/동아리/성급/공격 타입/방어 타입/역할 필터
- 조건에 맞는 학생 카드 표시
- 학생 카드를 클릭하면 `character-detail.html?id=...`로 이동

현재는 실제 DB 없이 `data/`의 정적 JavaScript 데이터를 사용합니다.

## 연결된 파일

### CSS

- `./styles.css`

주요 CSS class:

- `characters-shell`
- `characters-layout`
- `character-filter-panel`
- `character-filter-form`
- `characters-panel`
- `characters-list`
- `student-list-card`
- `student-list-portrait`
- `student-list-card-content`
- `type-badge`
- `star-icon-list`

### Data

- `data/index.js`
- `data/academies.js`
- `data/clubs.js`
- `data/students.js`

`characters.html`은 다음 데이터를 가져옵니다.

```js
import { academies, clubs, students } from "./data/index.js";
```

의미:

```text
academies: 학원 목록
clubs: 동아리 목록
students: 학생 목록
```

`data/index.js`는 각 데이터 파일을 다시 export하는 진입점입니다.

```js
export { academies } from "./academies.js";
export { clubs } from "./clubs.js";
export { students } from "./students.js";
```

## HTML 전체 구조

문서는 크게 세 영역입니다.

```text
body
├─ header.site-header
└─ main.page-shell.characters-shell
   └─ div.characters-layout
      ├─ aside.character-filter-panel
      │  ├─ 학생 이름 검색 input
      │  └─ form.character-filter-form
      │     ├─ 학원 select
      │     ├─ 동아리 select
      │     ├─ 성급 select
      │     ├─ 공격 타입 select
      │     ├─ 방어 타입 select
      │     └─ 역할 select
      └─ section.characters-panel
         └─ div#characters-list
```

## header 영역

상단에는 로고와 통합검색 형태의 input이 있습니다.

```html
<div class="student-search" role="search" aria-label="통합검색">
  <label class="search-label" for="site-search-input">통합검색</label>
  <input id="site-search-input" class="student-search-input" type="search" />
</div>
```

주의:

- 이 페이지 상단의 `site-search-input`은 현재 별도 JavaScript 검색 이벤트가 연결되어 있지 않습니다.
- 실제 학생 목록 검색은 아래 필터 패널의 `#character-name-search`가 담당합니다.

## 필터 영역

학생 목록 필터는 왼쪽 `aside.character-filter-panel`에 있습니다.

학생 이름 검색:

```html
<input id="character-name-search" class="character-search-input" type="search" />
```

필터 form:

```html
<form class="character-filter-form" id="character-filter-form">
```

주요 select:

```text
#academy-filter
#club-filter
#rarity-filter
#attack-filter
#defense-filter
#role-filter
```

초기 HTML에는 대부분 `전체` option만 있습니다.

예:

```html
<select id="academy-filter" name="academy">
  <option value="">전체</option>
</select>
```

이후 JavaScript가 데이터에서 값을 읽어 option을 추가합니다.

## 학생 목록 영역

학생 카드가 들어가는 위치입니다.

```html
<div id="characters-list" class="characters-list"></div>
```

JavaScript 연결:

```js
const charactersList = document.querySelector("#characters-list");
```

`charactersList`는 배열이 아니라 학생 카드들이 들어갈 부모 `div` 요소입니다.

## JavaScript 실행 흐름

페이지 하단의 `<script type="module">`이 실행됩니다.

흐름:

```text
1. data/index.js에서 academies, clubs, students를 가져온다.
2. 필요한 HTML 요소들을 querySelector로 찾는다.
3. 학원 이름과 동아리 이름을 찾는 helper 함수를 준비한다.
4. 학생 카드 생성 함수를 준비한다.
5. 별 아이콘, 타입 배지, 상세 정보 생성 함수를 준비한다.
6. 필터 select option을 추가하는 함수를 준비한다.
7. renderCharacters 함수로 현재 조건에 맞는 학생을 화면에 표시한다.
8. 필터와 검색 input에 이벤트를 등록한다.
9. 마지막에 renderCharacters()를 호출해 초기 학생 목록을 표시한다.
```

함수 정의와 실행은 구분해야 합니다.

- `function createCharacterCard(student) { ... }`: 학생 카드 만드는 방법을 준비
- `createCharacterCard(student)`: 학생 카드 DOM을 실제로 생성
- `renderCharacters()`: 현재 필터 조건으로 학생 목록을 다시 그림

## 주요 변수

### charactersList

```js
const charactersList = document.querySelector("#characters-list");
```

학생 카드들이 들어갈 부모 요소입니다.

### filterForm

```js
const filterForm = document.querySelector("#character-filter-form");
```

학원, 동아리, 성급, 타입, 역할 select들을 감싸는 form입니다.

`change` 이벤트를 등록해서 select 값이 바뀌면 학생 목록을 다시 렌더링합니다.

### academyFilter

```js
const academyFilter = document.querySelector("#academy-filter");
```

학원 선택 select입니다.

선택값은 학원 이름이 아니라 `academy.slug`입니다.

예:

```text
gehenna
trinity
millennium
```

### clubFilter

```js
const clubFilter = document.querySelector("#club-filter");
```

동아리 선택 select입니다.

선택값은 동아리 이름이 아니라 `club.id`입니다.

예:

```text
problem-solver-68
seminar
supplementary-lessons
```

### rarityFilter

```js
const rarityFilter = document.querySelector("#rarity-filter");
```

기본 성급 필터입니다.

HTML에 1성, 2성, 3성 option이 직접 들어 있습니다.

### attackFilter, defenseFilter, roleFilter

```js
const attackFilter = document.querySelector("#attack-filter");
const defenseFilter = document.querySelector("#defense-filter");
const roleFilter = document.querySelector("#role-filter");
```

공격 타입, 방어 타입, 역할 필터입니다.

초기 HTML에는 `전체`만 있고, JavaScript가 `students` 데이터에서 중복을 제거해 option을 추가합니다.

### nameSearchInput

```js
const nameSearchInput = document.querySelector("#character-name-search");
```

학생 이름 검색 input입니다.

사용자가 글자를 입력할 때마다 `renderCharacters()`가 실행됩니다.

## 주요 함수

### getAcademyName(slug)

```js
function getAcademyName(slug) {
  return academies.find((academy) => academy.slug === slug)?.shortName || "임시 학원";
}
```

학생의 `academySlug`를 받아 학원 짧은 이름을 반환합니다.

예:

```js
getAcademyName("millennium");
// "밀레니엄"
```

동작:

```text
academies 배열에서 slug가 같은 학원을 찾는다.
찾으면 shortName을 반환한다.
못 찾으면 "임시 학원"을 반환한다.
```

`?.`는 optional chaining입니다.

```js
academies.find(...)? .shortName
```

학원을 못 찾았을 때 오류를 내지 않고 `undefined`를 반환하게 해줍니다.

### getClubName(clubId)

```js
function getClubName(clubId) {
  return clubs.find((club) => club.id === clubId)?.name || "임시 동아리";
}
```

학생의 `clubId`를 받아 동아리 이름을 반환합니다.

예:

```js
getClubName("seminar");
// "세미나"
```

## 학생 카드 생성

### createCharacterCard(student)

```js
function createCharacterCard(student) {
```

매개변수 `student`에는 학생 객체 하나가 들어갑니다.

예:

```js
{
  id: 1,
  name: "노아",
  academySlug: "millennium",
  clubId: "seminar",
  rarity: 3,
  role: "서포터",
  attackType: "신비",
  defenseType: "특수장갑",
}
```

이 함수는 학생 하나를 클릭 가능한 카드 DOM으로 만듭니다.

### 카드 링크

```js
const link = document.createElement("a");
link.className = "student-list-card";
link.href = `character-detail.html?id=${student.id}`;
```

학생 카드 전체를 `<a>` 태그로 만듭니다.

클릭하면 학생 상세 페이지로 이동합니다.

예:

```text
character-detail.html?id=1
```

### 학생 이미지 영역

```js
const portrait = document.createElement("div");
portrait.className = `student-list-portrait ${student.portraitClass || "aru"}`;
portrait.textContent = student.name;
```

현재는 실제 이미지 태그가 아니라 `div` placeholder를 사용합니다.

`student.portraitClass`가 있으면 그 값을 class로 사용하고, 없으면 `"aru"`를 기본 class로 사용합니다.

```js
student.portraitClass || "aru"
```

뜻:

```text
portraitClass가 있으면 사용하고,
없으면 "aru"를 사용한다.
```

### 이름, 성급, 학원/동아리

```js
const name = document.createElement("h3");
const starRank = getStudentStarRank(student);
const rarity = renderStarIcons(starRank, "student", `기본 성급 ${starRank}성`);
```

학생 이름은 `h3`에 들어갑니다.

기본 성급은 `renderStarIcons`로 별 이미지 목록을 만듭니다.

```js
club.textContent = `${getAcademyName(student.academySlug)} · ${getClubName(student.clubId)}`;
```

학생 카드에는 학원과 동아리 이름이 같이 표시됩니다.

예:

```text
밀레니엄 · 세미나
```

### 상세 정보 dl

```js
const detailList = document.createElement("dl");
detailList.className = "student-id-detail-list";
```

`dl`은 설명 목록을 만들 때 사용하는 HTML 태그입니다.

이 안에는 `dt`, `dd`가 들어갑니다.

```text
dt: 항목 이름
dd: 항목 값
```

예:

```html
<dl>
  <div>
    <dt>역할</dt>
    <dd>서포터</dd>
  </div>
  <div>
    <dt>공격 타입</dt>
    <dd><span>신비</span></dd>
  </div>
</dl>
```

현재 카드에서는 다음 정보를 표시합니다.

- 역할
- 공격 타입
- 방어 타입

## 성급 관련 함수

### getStudentStarRank(student)

```js
function getStudentStarRank(student) {
  return Number(student.starRank ?? student.rarity ?? 0);
}
```

학생 기본 성급 숫자를 반환합니다.

우선순위:

```text
student.starRank
→ student.rarity
→ 0
```

`??`는 nullish coalescing 연산자입니다.

왼쪽 값이 `null` 또는 `undefined`일 때만 오른쪽 값을 사용합니다.

예:

```js
student.starRank ?? student.rarity
```

뜻:

```text
student.starRank가 null/undefined가 아니면 그것을 사용
없으면 student.rarity 사용
```

### getWeaponStarRank(student)

```js
function getWeaponStarRank(student) {
  return student.weaponStarRank == null ? null : Number(student.weaponStarRank);
}
```

전용무기 성급 값을 반환합니다.

현재 `data/students.js`에는 `weaponStar`가 들어 있는 데이터도 있지만, 이 함수는 `weaponStarRank`를 봅니다.

따라서 `weaponStarRank`가 없는 학생은 `null`로 처리되어 목록 카드에 전용무기 별이 표시되지 않습니다.

### renderStarIcons(count, kind, ariaLabel)

```js
function renderStarIcons(count, kind, ariaLabel) {
  const list = document.createElement("span");
  list.className = `star-icon-list ${kind}-star-icon-list`;
  list.setAttribute("aria-label", ariaLabel);

  for (let index = 0; index < count; index += 1) {
    list.append(createStarIcon(kind, index));
  }

  return list;
}
```

별 아이콘 목록을 만드는 함수입니다.

`count`가 3이면 별 이미지 3개를 만듭니다.

`kind`는 별 종류입니다.

```text
student: 기본 성급 별
weapon: 전용무기 성급 별
```

### createStarIcon(kind, index)

```js
function createStarIcon(kind, index) {
  const image = document.createElement("img");
  image.className = `star-icon ${kind}-star-icon`;
  image.src = kind === "weapon" ? BLUE_STAR_ICON_URL : STAR_ICON_URL;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  image.dataset.starIndex = String(index + 1);
  return image;
}
```

별 이미지 하나를 만듭니다.

`kind`가 `"weapon"`이면 파란 별 이미지를 쓰고, 아니면 일반 별 이미지를 씁니다.

```js
image.dataset.starIndex = String(index + 1);
```

`data-star-index` 속성을 추가합니다.

예:

```html
<img data-star-index="1" />
```

현재 화면 기능보다는 스타일링이나 디버깅에 활용할 수 있는 정보입니다.

## 상세 정보 생성 함수

### createTextDetail(label, value)

```js
function createTextDetail(label, value) {
  const item = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  item.append(term, description);
  return item;
}
```

일반 텍스트 상세 정보를 만듭니다.

예:

```js
createTextDetail("역할", "서포터");
```

결과:

```html
<div>
  <dt>역할</dt>
  <dd>서포터</dd>
</div>
```

### createBadgeDetail(label, value, type)

```js
function createBadgeDetail(label, value, type) {
```

공격 타입, 방어 타입처럼 배지로 보여줄 정보를 만듭니다.

```js
badge.className = `type-badge ${type}-${getTypeClass(value)}`;
badge.textContent = value;
```

예:

```js
createBadgeDetail("공격 타입", "신비", "attack");
```

결과 class:

```text
type-badge attack-blue
```

### getTypeClass(value)

```js
function getTypeClass(value) {
  const typeMap = {
    폭발: "red",
    경장갑: "red",
    관통: "yellow",
    중장갑: "yellow",
    신비: "blue",
    특수장갑: "blue",
    진동: "purple",
    탄력장갑: "purple",
  };

  return typeMap[value] || "neutral";
}
```

공격/방어 타입 값을 CSS 색상 이름으로 바꿉니다.

예:

```text
폭발 → red
관통 → yellow
신비 → blue
진동 → purple
```

매칭되는 값이 없으면 `"neutral"`을 반환합니다.

## 필터 option 생성

### addOptions(select, values)

```js
function addOptions(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}
```

select 요소에 option들을 추가하는 공통 함수입니다.

예:

```js
addOptions(attackFilter, ["폭발", "관통", "신비"]);
```

결과:

```html
<option value="폭발">폭발</option>
<option value="관통">관통</option>
<option value="신비">신비</option>
```

### addAcademyOptions()

```js
function addAcademyOptions() {
  academies.forEach((academy) => {
    const option = document.createElement("option");
    option.value = academy.slug;
    option.textContent = academy.shortName;
    academyFilter.append(option);
  });
}
```

학원 필터 select에 학원 option을 추가합니다.

중요:

- `option.value`는 `academy.slug`
- `option.textContent`는 `academy.shortName`

즉 화면에는 `"게헨나"`가 보이지만 실제 선택값은 `"gehenna"`입니다.

### addClubOptions(academySlug = "")

```js
function addClubOptions(academySlug = "") {
```

동아리 필터 select에 동아리 option을 추가합니다.

학원이 선택되어 있으면 해당 학원의 동아리만 보여줍니다.

```js
const filteredClubs = academySlug
  ? clubs.filter((club) => club.academySlug === academySlug)
  : clubs;
```

뜻:

```text
academySlug 값이 있으면 그 학원의 동아리만 사용
academySlug 값이 없으면 전체 동아리 사용
```

기존 option을 지우고 `전체` option부터 다시 넣습니다.

```js
clubFilter.replaceChildren(new Option("전체", ""));
```

그리고 필터링된 동아리를 option으로 추가합니다.

```js
filteredClubs.forEach((club) => {
  const option = document.createElement("option");
  option.value = club.id;
  option.textContent = club.name;
  clubFilter.append(option);
});
```

마지막으로 이전에 선택한 동아리가 새 option 목록에도 있으면 유지합니다.

```js
if ([...clubFilter.options].some((option) => option.value === selectedClubValue)) {
  clubFilter.value = selectedClubValue;
}
```

## 학생 목록 렌더링

### renderCharacters()

```js
function renderCharacters() {
```

현재 검색어와 필터 조건을 기준으로 학생 목록을 다시 그리는 함수입니다.

먼저 현재 필터 값을 모읍니다.

```js
const filterValues = {
  nameKeyword: nameSearchInput.value.trim(),
  academySlug: academyFilter.value,
  clubId: clubFilter.value,
  rarity: rarityFilter.value,
  attackType: attackFilter.value,
  defenseType: defenseFilter.value,
  role: roleFilter.value,
};
```

그 다음 `students` 배열에서 조건에 맞는 학생만 고릅니다.

```js
const filteredStudents = students.filter((student) => {
  return (
    (!filterValues.nameKeyword || student.name.includes(filterValues.nameKeyword)) &&
    (!filterValues.academySlug || student.academySlug === filterValues.academySlug) &&
    (!filterValues.clubId || student.clubId === filterValues.clubId) &&
    (!filterValues.rarity || String(getStudentStarRank(student)) === filterValues.rarity) &&
    (!filterValues.attackType || student.attackType === filterValues.attackType) &&
    (!filterValues.defenseType || student.defenseType === filterValues.defenseType) &&
    (!filterValues.role || student.role === filterValues.role)
  );
});
```

핵심 패턴:

```js
!filterValues.academySlug || student.academySlug === filterValues.academySlug
```

뜻:

```text
학원 필터가 비어 있으면 통과
학원 필터가 있으면 학생의 academySlug와 같을 때만 통과
```

모든 조건이 `&&`로 연결되어 있으므로, 선택된 모든 필터를 만족해야 학생이 남습니다.

검색 결과가 없으면 안내 문구를 표시합니다.

```js
if (filteredStudents.length === 0) {
  const emptyMessage = document.createElement("p");
  emptyMessage.className = "search-empty";
  emptyMessage.textContent = "조건에 맞는 학생이 없습니다.";
  charactersList.replaceChildren(emptyMessage);
  return;
}
```

결과가 있으면 학생 카드를 만들어 표시합니다.

```js
charactersList.replaceChildren(...filteredStudents.map(createCharacterCard));
```

의미:

```text
filteredStudents 배열
→ createCharacterCard로 학생 카드 DOM 배열 생성
→ charactersList 안의 기존 내용을 지우고 새 카드들로 교체
```

## 초기 option 생성

스크립트 아래쪽에서 필터 option들을 먼저 채웁니다.

```js
addAcademyOptions();
addClubOptions();
addOptions(attackFilter, [...new Set(students.map((student) => student.attackType))]);
addOptions(defenseFilter, [...new Set(students.map((student) => student.defenseType))]);
addOptions(roleFilter, [...new Set(students.map((student) => student.role))]);
```

### new Set

```js
[...new Set(students.map((student) => student.attackType))]
```

학생들의 공격 타입을 모은 뒤 중복을 제거합니다.

예:

```js
students.map((student) => student.attackType)
// ["신비", "신비", "폭발", "관통", "폭발"]
```

`new Set(...)`으로 중복 제거:

```js
Set { "신비", "폭발", "관통" }
```

`[...]`로 다시 배열로 변환:

```js
["신비", "폭발", "관통"]
```

이 배열을 `addOptions`에 넘겨 select option을 만듭니다.

## 이벤트 등록

### 학원 필터 change

```js
academyFilter.addEventListener("change", () => {
  addClubOptions(academyFilter.value);
  renderCharacters();
});
```

학원 필터가 바뀌면:

```text
1. 선택한 학원에 맞게 동아리 option을 다시 만든다.
2. 학생 목록을 다시 렌더링한다.
```

### 이름 검색 input

```js
nameSearchInput.addEventListener("input", renderCharacters);
```

학생 이름 검색창에 글자가 입력될 때마다 학생 목록을 다시 렌더링합니다.

`input` 이벤트는 값이 바뀔 때 바로 발생합니다.

### 필터 form change

```js
filterForm.addEventListener("change", renderCharacters);
```

form 안의 select 값이 바뀌면 학생 목록을 다시 렌더링합니다.

주의:

- 학원 필터에는 별도 `change` 이벤트도 등록되어 있습니다.
- 그래서 학원 선택 시에는 동아리 option 갱신과 학생 목록 렌더링이 함께 일어납니다.

## 마지막 실행

```js
renderCharacters();
```

페이지가 처음 열렸을 때 전체 학생 목록을 표시합니다.

처음에는 모든 필터 값이 비어 있으므로 전체 학생이 표시됩니다.

## 사용된 주요 JavaScript 문법

### querySelector

```js
document.querySelector("#characters-list");
```

HTML에서 특정 요소 하나를 찾습니다.

`#characters-list`는 `id="characters-list"`인 요소를 뜻합니다.

### createElement

```js
document.createElement("a");
```

새 HTML 요소를 만듭니다.

만든 요소는 `append`, `replaceChildren` 등으로 문서에 붙여야 화면에 보입니다.

### append

```js
content.append(titleRow, club);
```

부모 요소 안에 자식 요소들을 추가합니다.

### replaceChildren

```js
charactersList.replaceChildren(...filteredStudents.map(createCharacterCard));
```

기존 자식 요소를 모두 지우고 새 자식 요소로 교체합니다.

목록을 다시 그릴 때 사용합니다.

### map

```js
filteredStudents.map(createCharacterCard)
```

학생 객체 배열을 학생 카드 DOM 배열로 변환합니다.

### filter

```js
students.filter((student) => ...)
```

조건을 만족하는 학생만 골라 새 배열을 만듭니다.

### find

```js
academies.find((academy) => academy.slug === slug)
```

조건을 만족하는 첫 번째 항목을 찾습니다.

### includes

```js
student.name.includes(filterValues.nameKeyword)
```

문자열 안에 검색어가 포함되어 있는지 확인합니다.

예:

```js
"노아(파자마)".includes("노아")
// true
```

### nullish coalescing

```js
student.starRank ?? student.rarity ?? 0
```

왼쪽 값이 `null` 또는 `undefined`일 때만 오른쪽 값을 사용합니다.

### spread syntax

```js
charactersList.replaceChildren(...cards);
```

배열 안의 요소들을 하나씩 펼쳐서 전달합니다.

### dataset

```js
image.dataset.starIndex = String(index + 1);
```

HTML의 `data-*` 속성을 설정합니다.

결과:

```html
<img data-star-index="1" />
```

## 이 코드가 존재하는 이유

`characters.html`은 학생 기본 데이터를 탐색하기 위한 목록 페이지입니다.

이 페이지의 목적:

- 전체 학생을 카드 형태로 보여준다.
- 사용자가 이름과 여러 조건으로 학생을 좁혀볼 수 있게 한다.
- 학생 상세 페이지로 이동하는 입구 역할을 한다.
- DB 없이도 정적 데이터로 필터 UI와 목록 UI를 먼저 검증한다.

## 수정할 때 주의할 점

- 학생 상세 링크는 `student.id`를 기준으로 만듭니다.
- 학원 연결은 `student.academySlug`와 `academy.slug` 기준입니다.
- 동아리 연결은 `student.clubId`와 `club.id` 기준입니다.
- 학생 이름 검색은 현재 `student.name`만 대상으로 합니다.
- `students.js`의 `attackType`, `defenseType`, `role` 값이 바뀌면 필터 option도 자동으로 바뀝니다.
- `rarity` 필터는 `getStudentStarRank(student)` 결과와 비교합니다.
- `charactersList`가 없으면 현재 코드에는 방어 처리가 없으므로 HTML id를 바꾸면 오류가 날 수 있습니다.

## 현재 임시 처리

- 학생 이미지는 실제 `<img>`가 아니라 `portraitClass` 기반 placeholder입니다.
- 학생 데이터 일부는 `임시 데이터`, `임시 표시` 값을 사용합니다.
- 상단 통합검색 input은 현재 이 페이지의 필터 로직과 연결되어 있지 않습니다.
- 전용무기 별은 `weaponStarRank`가 있을 때만 표시됩니다. 현재 `students.js`의 `weaponStar`와 이름이 다르므로 대부분 표시되지 않을 수 있습니다.
