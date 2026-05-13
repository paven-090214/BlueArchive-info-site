# characters.html

## 스크린 리더
스크린 리더 : 화면을 눈으로 보기 어려운 사용자가 웹페이지를 이용할 수 있게, 화면 내용을 음성이나 점자로 읽어주는 보조 기술
    - Windows: NVDA, JAWS
    - macOS/iPhone: VoiceOver
    - Android: TalkBack

## TODO 확인할 함수

renderStarIcons()
    - 예상 : 학생의 기본 성 급 숫자 반환


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
#rarity-filter
#attack-filter
#defense-filter
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

dl = 설명 목록 전체
dt = 설명할 항목 이름
dd = 그 항목의 설명/값

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

club = <p>
    - 학생의 소속 학원, 소속 동아리

portrait = <div>
    - portraitClass : 학생의 초상화 이미지 - 현재는 대체 상태

starRank = 학생의 기본 성급 -> 전용무기 성급 -> 0 순으로 숫자 반환
rarity

name = <h3>
    - 학생의 이름 저장

titleRow = <div>
    - append(name, rarity); 이름과 성급 저장 

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


최종 구조

  link.student-list-card
  ├─ portrait.student-list-portrait
  └─ content.student-list-card-content
     ├─ titleRow.student-list-title-row
     │  ├─ h3 = 학생 이름
     │  └─ rarity = 기본 성급 별
     ├─ p.student-list-club = 학원 · 동아리
     ├─ weaponStars = 전용무기 별
     └─ dl.student-id-detail-list
        ├─ 역할
        ├─ 공격 타입
        └─ 방어 타입

### getStudentStarRank(student)

`??`는 nullish coalescing 연산자로 왼쪽 값이 `null` 또는 `undefined`일 경우 오른쪽 값으로 넘어간다.

```js
  function getStudentStarRank(student) {
    return Number(student.starRank ?? student.rarity ?? 0);
  }
```

`Number()` 함수로 값을 숫자로 반환

예시

```js
const displayName = user.nickname ?? user.name ?? "이름 없음";
```

첫 번째 값이 존재하지 않음 -> 두 번째 값이 존재하지 않음 -> "이름없음"

### getWeaponStarRank(student)

```js
function getWeaponStarRank(student) {
  return student.weaponStarRank == null ? null : Number(student.weaponStarRank);
}
```

javascript에서 `== null`은 `null`, `undefined`의 값들을 잡아낸다.

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

- kind : 기본 성급, 전용무기 성급 구분
- index : n - 1 번째 반복문 값


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

