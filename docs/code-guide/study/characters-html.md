# characters.html

## 스크린 리더
스크린 리더 : 화면을 눈으로 보기 어려운 사용자가 웹페이지를 이용할 수 있게, 화면 내용을 음성이나 점자로 읽어주는 보조 기술
    - Windows: NVDA, JAWS
    - macOS/iPhone: VoiceOver
    - Android: TalkBack

## TODO 확인할 함수

getStudentBaseStar()
    - 예상 :  학생의 기본 성 급 숫자 반환

renderStarIcons()
    - 예상 : 학생의 기본 성 급 아이콘 출력


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

## HTML 전체 구조

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

## 필터 영역

주요 select 목록

```text
#academy-filter
#club-filter
#attack-filter
#defense-filter
 #base-star-filter
#role-filter
```

초기 html에는 option으로 전체값만 존재하며 나중에 js가 데이터를 읽어서 option 을 추가한다

### form 밖 search
이름 기능을 form태그 밖에 둔 이유
1. UI/이벤트 처리 성격분리
    - 이름 검색은 사용자가 글자를 입력할 때마다 바로 반응
    - select 필터들은 값이 바뀔 때 반응
2. 디자인 측면에서도 이름 검색은 필터 패널 안에서 가장 위에 크게 따로 보여주고, 아래에 세부 필터들을 배치
3. 사용자가 글자를 입력할 때마다 `renderCharacters()`가 실행

## 학생 목록 영역

```js
const charactersList = document.querySelector("#characters-list");
```

목록이 표시될 영역은 아무 값도 들어가있지 않은 빈 <div>요소이다.

### html 태그

|html태그|      설명     |
|--------|-------------|
|dl      | 설명 목록 전체|
|dt      | 설명할 항목 이름|
|dd      | 그 항목의 설명/값|

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

## javascript 영역

`<script type="module">`
를 사용하여 data/index.js에서 academies, clubs, students를 가져온다.


```js
const filterForm = document.querySelector("#character-filter-form");
```
필터 기능 선택시 이벤트 전달할 form


### 주요 함수

### getAcademyName(slug), getClubName(clubId) 선택한 학원, 동아리

학생의 `academySlug`를 받아 학원의 짧은 이름을 반환하는 함수

```js
function getAcademyName(slug) {
    return academies.find((academy) => academy.slug === slug)?.shortName || "임시 학원";
}
```

1. 내가 선택한 학원의 slug가 매개변수, 학원 배열에서 내가 선택한 slug와 비교하여 같은 n 번째 인덱스에 존재하는 객체의 .shortName을 출력
2. ?.shortName 사용 이유 -> `?.`는 optional chaining
    - 앞에서 객체가 나왔으면 shortName을 꺼냄
    - 앞에서 undefined가 나왔으면 오류 대신 undefined를 반환 -> 임시 학원 반환

```js
function getClubName(clubId) {
    return clubs.find((club) => club.id === clubId)?.name || "임시 동아리";
}
```

### createCharacterCard(student) 학생 카드 만들기

학생의 카드를 생성하는 함수로 매개변수 `student`에는 학생 객체 하나가 들어감
    - 목표 : 이 함수는 학생 하나를 클릭 가능한 카드 DOM으로 만들기

```text
club = <p>
    - 학생의 소속 학원, 소속 동아리

portrait = <div>
    - portraitClass : 학생의 초상화 이미지 - 현재는 대체 상태

name = <h3>
    - 학생의 이름 저장

titleRow = <div>
    - append(name, baseStarIcons); 이름과 성급 저장 

detailList = <dl>
    - append(roleItem, attackItem, defenseItem); 역할, 공격타입, 방어타입 저장

content = <div>
    - append(titleRow, club); {이름, 성급}, {학원 이름, 동아리} 저장
    - append(detailList);

link = <a>
    - 학생의 id로 보내는 href 추가
    - append(content, portrait);
    - return link;

완성된 학생 카드 <a> 요소를 반환
```

```text
최종 구조

  link.student-list-card
  ├─ portrait.student-list-portrait
  └─ content.student-list-card-content
     ├─ titleRow.student-list-title-row
     │  ├─ h3 = 학생 이름
     │  └─ baseStarIcons = 기본 성급 별
     ├─ p.student-list-club = 학원 · 동아리
     └─ dl.student-id-detail-list
        ├─ 역할
        ├─ 공격 타입
        └─ 방어 타입
```

### getStudentStarRank(student)

`??`는 nullish coalescing 연산자로 왼쪽 값이 `null` 또는 `undefined`일 경우 오른쪽 값으로 넘어간다.

```js
  function getStudentBaseStar(student) {
    return Number(student.baseStar ?? 0);
  }
```

`Number()` 함수로 값을 숫자로 반환

```js
const displayName = user.nickname ?? user.name ?? "이름 없음";
```

첫 번째 값이 존재하지 않음 -> 두 번째 값이 존재하지 않음 -> "이름없음"

### createStarIcon(kind, index)

```js
function createStarIcon() {
    const image = document.createElement("img");
    image.className = `star-icon student-star-icon`;
    image.src = STAR_ICON_URL;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    return image;
}
```


```js
<span aria-label="기본 성급 3성">
  <img src="star.webp" alt="" aria-hidden="true">
  <img src="star.webp" alt="" aria-hidden="true">
  <img src="star.webp" alt="" aria-hidden="true">
</span>
```

결과 : 스크린 리더는 별 이미지를 각각 읽지 않고, 부모의 의미만 읽을 수 있다.

#### `setAttribute` : html 요소에 속성을 설정하는 js 메서드

요소.setAttribute(속성 이름, 속성 값);

#### dataset
`dataset` : html의 data-* 속성을 JavaScript에서 쉽게 읽고 쓰기 위한 속성

1. TML에서는 항상 data-로 시작함
2. 전부 소문자로 이어 쓰면 JS에서도 그대로 이어짐
3. HTML에서 -를 넣으면 JS에서는 대문자로 바뀜
4. 반대로 JS에서 대문자를 쓰면 HTML에서는 -소문자로 바뀜
5. 값은 항상 문자열로 받음

### renderStarIcons(count, kind, ariaLabel)

```js
function renderStarIcons(count, ariaLabel) {
    const list = document.createElement("span");
    list.className = `star-icon-list student-star-icon-list`;
    list.setAttribute("aria-label", ariaLabel);

    for (let index = 0; index < count; index += 1) {
          list.append(createStarIcon());
    }

    return list;
}
```

설명

```text
매개변수
    - count -> 별 출력 반복 횟수
    - ariaLabel -> html에 직접적으로 작성할 속성을 적음 -> 예: "기본 성급 3성"
list = <span>
<span>에 aria-label = "기본 성급 3성"의 형태가 들어감
결과 : <span aria-label = "기본 성급 3성">
```

### createTextDetail()

```js
const roleItem = createTextDetail("역할", student.role);

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

```text
설명 생략
```

### createBadgeDetail()

```js
const attackItem = createBadgeDetail("공격 타입", student.attackType, "attack");
const defenseItem = createBadgeDetail("방어 타입", student.defenseType, "defense");

function createBadgeDetail(label, value, type) {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    const badge = document.createElement("span");
    term.textContent = label;
    badge.className = `type-badge ${type}-${getTypeClass(value)}`;
    badge.textContent = value;
    description.append(badge);
    item.append(term, description);
    return item;
}
```

```text
span : 타입마다 색상을 먹이기위해 존재한다(css용).
이하 생략
```

### getTypeClass()

```js
function getTypeClass(value) {
    const typeMap = {
        "폭발": "red",
        "경장갑": "red",
        "관통": "yellow",
        "중장갑": "yellow",
        "신비": "blue",
        "특수장갑": "blue",
        "진동": "purple",
        "탄력장갑": "purple",
    };

    return typeMap[value] || "neutral";
}
```

```text
설명 생략
```

### addOptions()

```js
function addOptions(select, values) {
    values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textcontext = value;
        select.append(option);
    })
}
```

```text
select요소에 option을 추가하는 함수
option.value = value
```

### addAcademyOptions() 

```js
function addAcademyOptions() {
    academies.forEach((academy) => {
        const option = document.createElement("option");
        option.value = academy.slug;
        option.textContent = academy.shortName;
        academyFilter.append(option);
    })
}
```

```text
학원 배열을 option태그에 넣어서 유저가 선택하는 값은 학원의 짧은 이름이고 내부의 value는 js가 찾는 slug값이다.
```

### addClubOptions(0)

```js
function addClubOptions(academySlug = "") { // 필터 값, = "" 은 안 골랐을 경우 기본값 -> 모두 출력
    const selectClubValue = clubFilter.value;
    const filteredClubs = academySlug 
        ? clubs.filter((club) => club.academySlug === academySlug)
        : clubs;

    clubFilter.replaceChildren(new Option("전체", ""));

    filteredClubs.forEach((club) => {
        const option = document.createElement("option");
        option.value = club.id;
        option.textContent = club.name;
        clubFilter.append(option);
    });
}
```

```text
학원을 골랐다면 academySlug와 같은 값만을 참으로 새로운 배열을 만든다.
이때 참의 조건에 clubs배열을 filter로 각 동아리객체에 있는 slug가 같은 동아리들의 slug와 비교 후 참으로 하여 배열을 만든다.
학원을 고르지 않았다면 ""가 되어서 거짓인 경우 clubs배열을 그대로 새로운 배열로 만들어서 출력한다.

new Option("화면에 보이는 글자", "value 값")
new Option("전체", "")

이후 필터에 맞춰서 맞는 동아리만 남게되고, 똑같이 option 으로 select를 만들게된다.
```

### renderCharacters()

```js
function renderCharacters() {
    const filterValues = {
        nameKeyword: nameSearchInput.value.trim(),
        academySlug: academyFilter.value,
        clubId: clubFilter.value,
        baseStar: baseStarFilter.value,
        attackType: attackFilter.value,
        defenseType: defenseFilter.value,
        role: roleFilter.value,
    };

    const filteredStudents = students.filter((student) => {
        return (
            (!nameKeyword || students.name.include(filterValues.nameKeyword)) &&
            (!filterValues.academySlug || student.academySlug === filterValues.academySlug) &&
            (!filterValues.clubId || student.clubId === filterValues.clubId) &&
            (!filterValues.baseStar || String(getStudentBaseStar(student)) === filterValues.baseStar) &&
            (!filterValues.attackType || student.attackType === filterValues.attackType) &&
            (!filterValues.defenseType || student.defenseType === filterValues.defenseType) &&
            (!filterValues.role || student.role === filterValues.role)
        );
    });

    if (filteredStudents.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContext = "조건에 맞는 학생이 없습니다.";
        chractersList.replaceChildren(emptyMessage);
    }

    chractersList.replaceChldren(...filteredStudents.map(createCharacterCard))
}
```

```text
1. 각 필터의 값을 담은 딕셔너리를 생성한다.
2. filteredStudents 배열 안에 필터 후 남은 학생 배열을 출력한다.
    - !nameKeyword 이므로 ""일 경우 True를 반환한다. ||이므로 or 이다.
    - students.name.include(filterValues.nameKeyword)
    > 학색객체에 name에 입력한 키워드를 포함하는 값이 존재하는지 판단한다.
    - 이하 동일
2-1. 조건을 만족하는 배열의 크기가 0이다.
    - <p>문자열 적을 태그 생성
    - 문자열 작성
    - <div>요소에 <p>로 덮어씌움
3. createCharacterCard 함수로 각 학생들을 <a>태그로 <div>에 덮어씌움
```

### 초기 option 생성

```js
addAcademyOptions();
addClubOptions();
addOptions(attackFilter, [...new Set(students.map((student) => student.attackType))]);
addOptions(defenseFilter, [...new Set(students.map((student) => student.defenseType))]);
addOptions(roleFilter, [...new Set(students.map((student) => student.role))]);
```

```text
option을 먼저 생성하는 이유
    - 첫 페이지 로드시 "전쳬"밖에 존재하지 않는다.
new Set()이유
    - 집합을 이용한 중복 옵션 제거
    - [...]를 사용하여 다시 감싸 배열 생성
```

```js
academyFilter.addEventListener("change", () => {
    addClubOptions(academyFilter.value);
    // renderCharacters();
})
nameSearchInput.addEventListener("input", renderCharacters);
filterForm.addEventListener("change", renderCharacters);
renderCharacters();
```

```text
학원 필터에 변화가 감지되면 변경된 학원 필터의 값을 주고 동아리 필터를 다시 만든다.
학생 목록도 다시 렌더링한다.

input에 타이핑시 학생 목록 다시 렌더링
form태그에 변화를 감지하면 학생 목록 다시 렌더링
페이지 첫 로드시 함수만 있기 때문에 학생 목록 렌더링 필요
-> 현재 학원, 동아리 모두 렌더링 함수가 있기 때문에 렌더링이 두 번 일어날 가능성이 있다.
```