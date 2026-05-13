# index.html 설명

`index.html`은 사이트의 메인 페이지입니다.

사용자가 처음 들어왔을 때 보는 화면이며, 학원 목록, 진행 중인 픽업, 현재 이벤트, 인연랭크 계산기 이동 버튼, 과거 픽업 기록 이동 버튼, 학생 목록 이동 버튼을 보여줍니다.

## 연결된 파일

### CSS

- `./styles.css`

`<link rel="stylesheet" href="./styles.css" />`로 전체 스타일을 불러옵니다.

이 페이지에서 사용하는 주요 CSS 클래스는 다음과 같습니다.

- `site-header`
- `logo`
- `site-search`
- `page-shell`
- `academy-section`
- `academy-panel`
- `main-grid`
- `panel`
- `character-list`
- `archive-grid`
- `history-button`
- `bond-enter-button`

여기서 `class`는 대부분 CSS 꾸미기와 레이아웃을 연결하기 위한 이름입니다.

하지만 `class`가 항상 꾸미기만 의미하는 것은 아닙니다. JavaScript가 `class`를 기준으로 요소를 찾거나, 상태를 표시하기 위해 `class`를 추가/삭제한다면 기능에도 관여합니다.

현재 `index.html`에서는 주요 기능 연결에 `id`를 더 많이 사용합니다.

예:

```js
document.querySelector("#academy-panel");
document.querySelector("#current-pickup-list");
```

위 코드는 `class`가 아니라 `id`로 요소를 찾습니다.

반면 아래 코드는 JavaScript가 새 요소에 CSS class를 붙이는 예입니다.

```js
card.className = "character-card";
status.className = "tag";
```

이 경우 `character-card`, `tag`는 화면 스타일을 적용하기 위한 class입니다. 다만 JavaScript가 직접 붙이고 있기 때문에, 해당 class 이름을 바꾸면 CSS뿐 아니라 JavaScript 코드도 함께 확인해야 합니다.

정리하면 다음과 같습니다.

- `id`: JavaScript가 특정 요소 하나를 찾기 위한 이름표로 자주 사용합니다.
- `class`: 여러 요소에 같은 스타일을 적용하기 위해 자주 사용합니다.
- 기능용 `class`: JavaScript가 찾거나 추가/삭제하는 class라면 기능에도 영향을 줍니다.

### JavaScript module

`index.html` 하단에는 별도 JS 파일이 아니라 인라인 모듈 스크립트가 있습니다.

```html
<script type="module">
```

`type="module"`을 사용하기 때문에 `import` 문법으로 다른 JavaScript 파일의 데이터를 가져올 수 있습니다.

```js
import { academies } from "./data/index.js";
```

`./data/index.js`는 여러 data 파일을 다시 export하는 진입점 역할을 합니다. 이 페이지에서는 그중 `academies`만 가져와 학원 목록을 만듭니다.

### Data

- `./data/index.js`
- `./data/academies.js`
- `./data/pickups.json`

`index.html`은 `data/index.js`에서 `academies`를 import하고, 실제 학원 데이터는 `data/academies.js`에 있습니다.

정확히는 `data/index.js`가 여러 데이터 파일을 한 곳에서 다시 내보내는 역할을 합니다.

```js
export { academies } from "./academies.js";
```

그래서 `index.html`은 실제 `academies.js`를 직접 import하지 않고, 중간 진입점인 `data/index.js`에서 필요한 값만 가져옵니다.

진행 중인 픽업 정보는 `fetch("./data/pickups.json")`로 직접 JSON 파일을 불러옵니다.

## HTML 전체 구조

문서는 크게 세 영역으로 나뉩니다.

```text
html
├─ head
├─ body
│  ├─ header.site-header
│  ├─ main.page-shell
│  │  ├─ section.academy-section
│  │  ├─ section.main-grid
│  │  └─ section.archive-grid
│  └─ script type="module"
```

## head 영역

```html
<meta charset="UTF-8" />
```

한글을 포함한 문자를 올바르게 표시하기 위한 설정입니다.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

모바일 화면에서도 페이지 폭이 기기 크기에 맞게 계산되도록 하는 반응형 웹 기본 설정입니다.

```html
<title>BlueArchive Info Site</title>
```

브라우저 탭에 표시되는 페이지 제목입니다.

```html
<link rel="stylesheet" href="./styles.css" />
```

외부 CSS 파일을 연결합니다.

## header 영역

`header.site-header`는 모든 주요 페이지에서 공통으로 쓰기 좋은 상단 영역입니다.

구성은 다음과 같습니다.

- 로고
- 통합검색 폼
- 로그인/회원가입 링크

### 로고

```html
<a class="logo" href="./index.html" aria-label="메인 페이지로 이동">
```

로고는 `<a>` 태그라서 클릭하면 메인 페이지로 이동합니다.

`aria-label`은 화면에는 보이지 않지만 스크린 리더 같은 보조 기술에 "메인 페이지로 이동"이라는 의미를 전달합니다.

### 통합검색 폼

```html
<form class="site-search" id="site-search-form" role="search" aria-label="통합검색">
```

검색 영역입니다.

현재 실제 검색 결과 페이지는 없고, JavaScript에서 입력값을 받아 임시 alert을 띄웁니다.

중요한 연결 지점은 `id`입니다.

```html
id="site-search-form"
id="site-search-input"
```

JavaScript는 이 id를 사용해 HTML 요소를 찾습니다.

```js
const siteSearchForm = document.querySelector("#site-search-form");
const siteSearchInput = document.querySelector("#site-search-input");
```

### 로그인/회원가입 링크

```html
<a href="#" class="header-auth-link">로그인</a>
<a href="#" class="header-auth-link">회원가입</a>
```

현재는 UI만 있습니다. 실제 로그인/회원가입 기능이나 페이지 이동은 구현되어 있지 않습니다.

`href="#"`는 임시 링크입니다.

## main 영역

`main.page-shell`은 메인 콘텐츠 전체를 감싸는 영역입니다.

### 학원 목록 섹션

```html
<section class="academy-section" aria-label="학원 목록">
```

학원 목록을 표시하는 영역입니다.

실제 학원 카드는 HTML에 직접 적혀 있지 않고, JavaScript가 `data/academies.js`의 데이터를 이용해 만듭니다.

카드가 들어가는 위치는 다음 요소입니다.

```html
<div id="academy-panel" class="academy-panel academy-panel-static"></div>
```

JavaScript 연결:

```js
const academyPanel = document.querySelector("#academy-panel");
academyPanel.append(...academies.map(createAcademyCard));
```

의미:

- `academies.map(createAcademyCard)`는 학원 데이터 배열을 카드 DOM 배열로 바꿉니다.
- `append(...cards)`는 만들어진 카드들을 `academyPanel` 안에 추가합니다.

주의:

- `academyPanel`은 배열이 아니라 `id="academy-panel"`인 `div` 요소입니다.
- 처음 HTML에서는 비어 있지만, JavaScript가 학원 카드 요소를 만들어 안에 넣습니다.
- 현재 코드에는 `academyPanel`이 없을 때의 방어 코드가 없습니다. 따라서 `id="academy-panel"`을 삭제하거나 이름을 바꾸면 `academyPanel.append(...)`에서 오류가 날 수 있습니다.

### 메인 정보 그리드

```html
<section class="main-grid" aria-label="메인 정보">
```

메인 정보 그리드는 3개의 패널을 가집니다.

- 진행 중인 픽업 캐릭터
- 현재 진행 중인 이벤트
- 인연랭크 계산기

### 진행 중인 픽업 패널

```html
<div id="current-pickup-list" class="character-list" aria-live="polite"></div>
```

현재 진행 중인 픽업 카드가 들어가는 영역입니다.

`aria-live="polite"`는 JavaScript로 내용이 바뀌었을 때 보조 기술에 변경 사항을 자연스럽게 알려주기 위한 접근성 속성입니다.

JavaScript 연결:

```js
const currentPickupList = document.querySelector("#current-pickup-list");
renderCurrentPickups();
```

`renderCurrentPickups()`는 `data/pickups.json`을 읽고, 오늘 날짜 기준으로 `진행중`인 픽업만 화면에 표시합니다.

단, 픽업 데이터에 `status` 값이 이미 있으면 날짜 계산보다 `status` 값을 우선 사용합니다.

```js
if (pickup.status) {
  return pickup.status;
}
```

즉 `status: "진행중"`이 직접 들어 있는 데이터는 날짜와 관계없이 진행 중으로 판단됩니다. `status`가 없을 때만 `startDate`, `endDate`로 상태를 계산합니다.

### 현재 이벤트 패널

현재 이벤트 패널은 정적 HTML입니다.

```html
<h3>샬레 업무 지원 캠페인</h3>
```

문구에도 표시되어 있듯이 현재는 임시 이벤트 데이터입니다.

실제 이벤트 기간이나 서버 정보는 아직 data 파일이나 DB와 연결되어 있지 않습니다.

### 인연랭크 계산기 패널

```html
<a href="./bond-calculator.html" class="bond-enter-button">계산기 열기</a>
```

인연랭크 계산기 페이지로 이동하는 버튼입니다.

현재 `index.html` 안에서는 계산을 하지 않고, 별도 페이지인 `bond-calculator.html`로 이동만 담당합니다.

### 보조 이동 영역

```html
<section class="archive-grid" aria-label="보조 이동 영역">
```

두 개의 이동 카드를 보여줍니다.

- 과거 픽업 기록: `pickup-history.html`
- 학생 목록: `characters.html`

```html
<a href="./pickup-history.html" class="history-button">기록 보기</a>
<a href="./characters.html" class="history-button">학생 목록 보기</a>
```

## JavaScript 실행 흐름

페이지가 로드되면 하단의 module script가 실행됩니다.

여기서 "로드되면"은 브라우저가 HTML을 위에서 아래로 읽다가 하단의 `<script type="module">`을 만났을 때 실행된다는 뜻입니다. 스크립트가 아래쪽에 있기 때문에 `#academy-panel`, `#current-pickup-list` 같은 HTML 요소가 먼저 만들어진 뒤 JavaScript가 그 요소를 찾을 수 있습니다.

흐름은 다음과 같습니다.

```text
1. data/index.js에서 academies를 가져온다.
2. 필요한 HTML 요소를 querySelector로 찾는다.
3. 검색 폼 submit 이벤트를 등록한다.
4. 날짜 계산과 픽업 카드 생성 함수를 준비한다.
5. 학원 데이터를 카드로 변환해 academy-panel에 추가한다.
6. pickups.json을 fetch로 불러온다.
7. 현재 진행 중인 픽업만 필터링한다.
8. 픽업 캐릭터 카드를 만들어 current-pickup-list에 표시한다.
```

여기서 함수 정의와 함수 실행은 구분해야 합니다.

- `function createPickupCharacterCard(...) { ... }`: 카드를 만드는 방법을 준비합니다.
- `createPickupCharacterCard(schedule, character)`: 준비한 함수를 실제로 실행해서 카드 DOM을 만듭니다.
- `renderCurrentPickups();`: 픽업 JSON을 불러오고, 진행 중인 픽업 캐릭터 카드를 실제로 생성하도록 렌더링 함수를 실행합니다.

반면 학원 카드는 별도의 마지막 함수 호출이 아니라 아래 줄에서 바로 생성되고 추가됩니다.

```js
academyPanel.append(...academies.map(createAcademyCard));
```

## 주요 변수

### academyPanel

```js
const academyPanel = document.querySelector("#academy-panel");
```

학원 카드들이 들어갈 HTML 요소입니다.

### currentPickupList

```js
const currentPickupList = document.querySelector("#current-pickup-list");
```

진행 중인 픽업 캐릭터 카드들이 들어갈 HTML 요소입니다.

### siteSearchForm

```js
const siteSearchForm = document.querySelector("#site-search-form");
```

통합검색 폼입니다. submit 이벤트를 등록할 때 사용합니다.

### siteSearchInput

```js
const siteSearchInput = document.querySelector("#site-search-input");
```

사용자가 입력한 검색어를 가져올 때 사용합니다.

## 주요 함수

### parseDate(value)

```js
function parseDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
```

문자열 날짜를 JavaScript `Date` 객체로 바꿉니다.

`value`는 `2021-11-09` 같은 형식을 기대합니다.

날짜로 변환할 수 없으면 `null`을 반환합니다.

`T00:00:00`을 붙이는 이유는 해당 날짜의 시작 시각으로 계산하기 위해서입니다.

### getToday()

```js
function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
```

오늘 날짜를 가져온 뒤 시간을 00:00:00으로 맞춥니다.

픽업 시작일/종료일과 비교할 때 시간 차이 때문에 결과가 어긋나는 것을 줄이기 위한 처리입니다.

### getPickupStatus(pickup)

픽업 상태를 계산합니다.

우선 `pickup.status`가 있으면 그 값을 그대로 사용합니다.

```js
if (pickup.status) {
  return pickup.status;
}
```

없으면 `startDate`, `endDate`를 기준으로 계산합니다.

- 오늘이 시작일과 종료일 사이면 `진행중`
- 오늘이 시작일 전이면 `예정`
- 오늘이 종료일 후면 `종료`
- 날짜가 잘못되었으면 `null`

### isCurrentPickup(pickup)

```js
function isCurrentPickup(pickup) {
  const status = getPickupStatus(pickup);
  return status === "진행중";
}
```

현재 진행 중인 픽업인지 판별하는 함수입니다.

`Array.prototype.filter`와 함께 사용됩니다.

```js
const currentSchedules = schedules.filter(isCurrentPickup);
```

`filter`는 `isCurrentPickup(schedule)`의 결과가 `true`인 항목만 새 배열에 남깁니다. `status === "진행중"`은 `"진행중"`이라는 문자열을 반환하는 코드가 아니라, 비교 결과인 `true` 또는 `false`를 반환하는 코드입니다.

### createPickupCharacterCard(pickup, character)

진행 중인 픽업 캐릭터 카드 하나를 만듭니다.

주요 동작:

- `<article>` 요소 생성
- 캐릭터 이미지 또는 이름 placeholder 생성
- 캐릭터 이름, 픽업 제목, 기간, 상태 태그 생성
- 완성된 card DOM 반환

이미지 선택 순서:

```js
const imageUrl = character.imageUrl || pickup.bannerImageUrl;
```

캐릭터 이미지가 있으면 먼저 사용하고, 없으면 픽업 배너 이미지를 사용합니다.

둘 다 없으면 이미지 대신 캐릭터 이름 텍스트를 표시합니다.

### renderCurrentPickups()

진행 중인 픽업 목록을 화면에 표시하는 비동기 함수입니다.

```js
async function renderCurrentPickups() {
```

`async` 함수이므로 내부에서 `await fetch(...)`를 사용할 수 있습니다.

이 함수는 픽업 캐릭터가 없을 때 카드를 만들지 않고 끝나는 함수만은 아닙니다. 전체 역할은 다음 네 가지입니다.

- `pickups.json` 파일을 불러옵니다.
- 현재 진행 중인 픽업만 고릅니다.
- 진행 중인 픽업이 있으면 캐릭터 카드 DOM을 만듭니다.
- 진행 중인 픽업이 없거나 오류가 나면 카드 대신 안내 문구를 표시합니다.

동작 순서:

```text
1. currentPickupList 요소가 없으면 중단한다.
2. pickups.json을 fetch로 불러온다.
3. 응답이 실패하면 Error를 발생시킨다.
4. JSON을 배열로 변환한다.
5. 진행 중인 픽업만 filter로 고른다.
6. 진행 중인 픽업이 없으면 안내 문구를 표시한다.
7. 진행 중인 픽업이 있으면 캐릭터 카드들을 만든다.
8. replaceChildren으로 기존 내용을 새 카드로 교체한다.
9. 오류가 발생하면 오류 메시지를 표시한다.
```

여기서 `fetch`를 사용하므로 이 페이지는 `file://`로 열면 제대로 동작하지 않을 수 있습니다.

프로젝트 안내처럼 로컬 서버로 실행해야 합니다.

```bash
python -m http.server 8000
```

### createAcademyCard(academy)

학원 카드 링크를 만듭니다.

```js
link.href = `academy-detail.html?academy=${academy.slug}`;
```

학원 상세 페이지로 이동할 때 URL query string에 학원 slug를 넣습니다.

예:

```text
academy-detail.html?academy=gehenna
```

상세 페이지는 이 값을 읽어 어떤 학원 정보를 보여줄지 결정할 수 있습니다.

### createAcademyLogo(academy)

학원 로고 표시 요소를 만듭니다.

`academy.logoImageUrl`이 있으면 이미지를 사용합니다.

```js
if (academy.logoImageUrl) {
```

로고 이미지가 없으면 placeholder를 사용합니다.

```js
mark.className = `academy-logo-placeholder ${academy.logoClass}`;
mark.textContent = academy.mark;
```

이 구조는 이미지가 없는 학원 데이터도 화면에서 깨지지 않게 하기 위한 방어 코드입니다.

## 사용된 주요 JavaScript 문법

### import/export

```js
import { academies } from "./data/index.js";
```

다른 JS 파일에서 내보낸 값을 가져옵니다.

이 문법은 `<script type="module">`에서 사용할 수 있습니다.

### const

```js
const academyPanel = document.querySelector("#academy-panel");
```

다시 대입하지 않을 값을 선언할 때 사용합니다.

### querySelector

```js
document.querySelector("#academy-panel");
```

CSS 선택자 방식으로 HTML 요소를 찾습니다.

`#academy-panel`은 `id="academy-panel"`인 요소를 뜻합니다.

### addEventListener

```js
siteSearchForm.addEventListener("submit", (event) => {
```

특정 이벤트가 발생했을 때 실행할 함수를 등록합니다.

여기서는 검색 폼이 submit될 때 실행됩니다.

### preventDefault

```js
event.preventDefault();
```

폼 submit의 기본 동작인 페이지 새로고침을 막습니다.

### template literal

```js
`${pickup.startDate} ~ ${pickup.endDate}`
```

문자열 안에 변수 값을 쉽게 넣는 문법입니다.

백틱 기호를 사용합니다.

### map

```js
academies.map(createAcademyCard)
```

배열의 각 항목을 다른 값으로 변환해 새 배열을 만듭니다.

여기서는 학원 데이터 배열을 학원 카드 DOM 배열로 바꿉니다.

### filter

```js
schedules.filter(isCurrentPickup)
```

배열에서 조건에 맞는 항목만 골라 새 배열을 만듭니다.

### flatMap

```js
currentSchedules.flatMap((schedule) =>
  schedule.characters.map((character) => createPickupCharacterCard(schedule, character)),
);
```

각 픽업 스케줄 안의 캐릭터 목록을 카드 배열로 만들고, 중첩 배열을 한 단계 펼칩니다.

픽업 하나에 캐릭터가 여러 명 있을 수 있어서 사용합니다.

### async/await

```js
const response = await fetch("./data/pickups.json");
```

비동기 작업이 끝날 때까지 기다린 뒤 다음 줄을 실행합니다.

JSON 파일을 네트워크 요청처럼 불러오기 때문에 비동기 처리가 필요합니다.

### try/catch

```js
try {
  ...
} catch (error) {
  ...
}
```

데이터 로딩 실패 같은 오류가 발생했을 때 페이지가 완전히 멈추지 않고 안내 문구를 표시하도록 합니다.

### replaceChildren

```js
currentPickupList.replaceChildren(...cards);
```

기존 자식 요소를 모두 지우고 새 요소로 교체합니다.

목록을 다시 그릴 때 사용하기 좋습니다.

`...cards`의 `...`는 배열 안의 카드들을 하나씩 펼쳐서 전달하는 문법입니다.

```js
currentPickupList.replaceChildren(...cards);
```

위 코드는 카드가 3개일 때 개념적으로 아래와 같습니다.

```js
currentPickupList.replaceChildren(card1, card2, card3);
```

카드가 화면에서 몇 열로 보일지는 JavaScript가 아니라 CSS의 `.character-list` 레이아웃이 결정합니다.

### aria-hidden

```js
logoSlot.setAttribute("aria-hidden", "true");
```

화면에는 보이지만 스크린 리더 같은 보조 기술에는 읽지 말라고 표시합니다.

학원 카드에는 로고 옆에 학원 이름 텍스트가 이미 있으므로, 로고 이미지를 다시 읽으면 정보가 중복될 수 있습니다. 그래서 로고 영역을 보조 기술에서 숨기고, 실제 링크 이름은 텍스트로 읽히게 합니다.

## 이 코드가 존재하는 이유

`index.html`은 사이트의 입구 역할을 합니다.

이 페이지의 목적은 다음과 같습니다.

- 사용자가 주요 기능으로 빠르게 이동하게 한다.
- 학원 목록을 한눈에 보여준다.
- 진행 중인 픽업 정보를 메인에서 바로 확인하게 한다.
- 아직 구현되지 않은 기능은 임시 UI로 위치와 구조를 먼저 잡아둔다.
- 이후 DB나 API 연동이 들어와도 HTML 구조를 크게 바꾸지 않고 데이터 부분만 교체할 수 있게 한다.

## 수정할 때 주의할 점

- `id="academy-panel"`을 바꾸면 학원 카드 렌더링 코드도 같이 수정해야 합니다.
- `id="current-pickup-list"`를 바꾸면 픽업 목록 렌더링 코드도 같이 수정해야 합니다.
- `id="site-search-form"` 또는 `id="site-search-input"`을 바꾸면 검색 이벤트 코드도 같이 수정해야 합니다.
- `data/academies.js`의 `slug`는 상세 페이지 이동 URL에 사용되므로 함부로 바꾸면 기존 링크가 깨질 수 있습니다.
- `data/pickups.json`의 날짜 형식은 `YYYY-MM-DD` 형태를 유지해야 현재 픽업 판별이 안정적입니다.
- `fetch("./data/pickups.json")`가 있으므로 `file://`로 열지 말고 로컬 서버에서 확인해야 합니다.
- 로그인/회원가입은 현재 임시 링크이므로 실제 기능처럼 오해하지 않도록 구현 단계에서 별도 작업이 필요합니다.
- 현재 이벤트 영역은 정적 임시 데이터이므로 실제 이벤트 데이터와 연결하려면 별도 data 구조를 먼저 정해야 합니다.

## 현재 미구현 또는 임시 처리

- 통합검색은 실제 검색 결과 페이지 없이 alert만 표시합니다.
- 로그인/회원가입은 링크 UI만 있습니다.
- 현재 이벤트는 임시 문구입니다.
- 인연랭크 계산은 메인에서 하지 않고 계산기 페이지로 이동합니다.
- 픽업 캐릭터의 `characterId`나 `imageUrl`이 비어 있을 수 있으며, 이 경우 placeholder 방식으로 표시됩니다.
