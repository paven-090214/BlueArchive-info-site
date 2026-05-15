# index.html
##  main page
### 학원목록
학원 목록의 <div>는 처음에 비어있다가 /data/index.js파일 안에있는 
```js
export { academies } from "./academies.js";
```
를 포함시킨다. 이때 포함시키는 방법은 학원 배열앤 걱 헉원 정보가 담긴 객체가 들어있다.
이를 DOM배열로 변경하여 <div>태그에 추가한다.

> 검토 메모:
> - 표현 보강: `index.html`이 `data/index.js` 파일 자체를 `<div>`에 포함시키는 것은 아니다.
> - 정확히는 `index.html`의 module script가 `import { academies } from "./data/index.js";`로 `academies` 배열을 가져온다.
> - `data/index.js`는 실제 데이터를 가진 파일이라기보다 `data/academies.js`의 `academies`를 다시 export하는 중간 파일이다.
> - 가져온 `academies` 배열의 각 객체를 `createAcademyCard` 함수로 `<a>` DOM 요소로 바꾼 뒤, `academyPanel` div 안에 추가한다.

정확한 흐름:

```text
data/academies.js에 학원 객체 배열이 있음
→ data/index.js가 academies를 다시 export함
→ index.html이 academies를 import함
→ academies.map(createAcademyCard)로 학원 객체를 카드 DOM으로 바꿈
→ academyPanel.append(...)로 빈 div 안에 추가함
```
### 픽업 캐릭터
학원 목록처럼 <div>태그를 찾아간다.
오늘 날짜를 기준으로 `data/pickups.json`를 읽어서 진행중인 픽업만 화면에 표시한다.

> 검토 메모:
> - 큰 흐름은 맞다.
> - 단, `pickup.status` 값이 데이터에 이미 있으면 날짜 계산보다 그 값을 먼저 사용한다.
> - `status`가 없을 때만 `startDate`, `endDate`와 오늘 날짜를 비교해서 `진행중`, `예정`, `종료`를 계산한다.

```js
if (pickup.status) {
  return pickup.status;
}
```

### 현재 진행중인 이벤트
제작중

### 인연랭크 계산기
현재 `index.html` 안에서는 계산을 하지 않고, 별도 페이지인 `bond-calculator.html`로 이동을 담당한다.

### 하단 영역
마찬가지로 현재 `index.html` 안에서는 계산을 하지 않고, 별도 페이지로 이동하는 담당을 한다.

## JavaScript 실행 흐름

페이지가 로드된 이후 module script 실행하는 이유 : html은 위에서부터 코드를 읽는데 먼저 module script를 실행하게되면 변수에 null값이 들어가게된다.

> 검토 메모:
> - 방향은 맞다.
> - 더 정확히는 브라우저가 HTML을 위에서 아래로 읽다가 하단의 `<script type="module">`을 만나면 그 스크립트를 실행한다.
> - 스크립트가 HTML 아래쪽에 있기 때문에 `#academy-panel`, `#current-pickup-list`, `#site-search-form` 같은 요소들이 먼저 만들어져 있고, `querySelector`가 정상적으로 찾을 수 있다.
> - 만약 같은 스크립트가 해당 HTML 요소보다 위에서 먼저 실행되면 `document.querySelector(...)` 결과가 `null`이 될 수 있다.

1. data/index.js에서 academies를 가져온다.
2. 필요한 HTML 요소를 querySelector로 찾는다. 각 태그에 #으로 클래스 이름을 만들어둠
3. 검색 폼 submit 이벤트를 등록한다.

> 틀린 부분 표시:
> - `#`은 클래스 이름이 아니라 `id`를 찾는 CSS 선택자이다.
> - 클래스는 `.`으로 찾는다.
>
> 옳은 표현:
> - `document.querySelector("#academy-panel")`은 `id="academy-panel"`인 요소를 찾는다.
> - `document.querySelector(".academy-panel")`처럼 쓰면 `class="academy-panel"`인 요소를 찾는다.

``` js
      const siteSearchForm = document.querySelector("#site-search-form");
      const siteSearchInput = document.querySelector("#site-search-input");
      siteSearchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = siteSearchInput.value.trim();
        if (!query) {
          return;
        }

        console.log("통합검색:", query);
        window.alert(`통합검색은 준비 중입니다.\n검색어: ${query}`);
      });
```
```text
1. 여러 파일을 병합한 한 중요한 파일 data/index.js에 있는 academies정보를 위해 academies.js파일의 경로를 path로 가져온다.
2. . document.querySelector로 현재 html의 태그를 변수에 담는다.
    - siteSearchForm = 검색 텍스트와 검색 버튼이 담긴 form 태그
    - siteSearchInput = label(for = 동알한 id)태그는 포함되지 않은 input 태그
2. submit이벤트가 발생하면 siteSearchForm요소를 addEventListener라는 js의 메서드를 사용하여 이벤트를 실행한다.
3. event.preventDefault();아직 기능이 없어서 만들었음.
4. const query = siteSearchInput.value.trim();는 siteSearchInput안에 유저가 입력한 텍스트를 trim으로 공백 제거후 query에 넣는다.
5. if (!query) 는 "query가 비어 있거나 유효한 값이 아니면"이라는 의미를 지닌다.

```

> 검토 메모:
> - `data/index.js`가 여러 파일을 "병합"한다기보다는 여러 데이터 export를 한 곳에서 다시 내보내는 진입점 역할을 한다고 보는 편이 정확하다.
> - `siteSearchInput = label(for = 동일한 id)태그는 포함되지 않은 input 태그`는 맞다. `for="site-search-input"`은 label과 input을 연결할 뿐, `querySelector("#site-search-input")` 결과에 label이 같이 들어가지는 않는다.
>
> 틀린 부분 표시:
> - `submit이벤트가 발생하면 ... 이벤트를 실행한다`는 표현은 조금 부정확하다.
>
> 옳은 표현:
> - `addEventListener("submit", 함수)`는 submit 이벤트가 발생했을 때 실행할 함수를 미리 등록한다.
> - 사용자가 Enter를 누르거나 검색 버튼을 눌러 form이 submit될 때 등록한 함수가 실행된다.
>
> 보강:
> - `event.preventDefault()`는 "아직 기능이 없어서만" 만든 것은 아니다.
> - 현재는 실제 검색 기능이 alert뿐이라 페이지 새로고침을 막는 목적이 크다.
> - 나중에 JavaScript로 검색 결과를 직접 처리하는 방식으로 구현해도 `preventDefault()`를 계속 사용할 수 있다.
> - 반대로 검색 결과 페이지로 이동하는 방식으로 만들면 `<form action="...">`을 쓰고 `preventDefault()`를 제거할 수도 있다.

4. 날짜 계산과 픽업 카드 생성 함수를 준비한다.
    - function parseDate(value)
    > 
```js
  function parseDate(value) {
    const date = new Date(`${value}T00:00:00`); // 픽업 시작날짜와 종료날짜가 들어가기된다.
    return Number.isNaN(date.getTime()) ? null : date; // 날짜가 잘못되었을 경우 null 반환
  }
```
```text
    - function createPickupCharacterCard(pickup, character)
1. createPickupCharacterCard이 함수는 그냥 html요소를 새로 구성하는 함수야. card변수에 article태그 생성, class로 character-card이름 부여함
2. portrait변수에 div태그 생성 class = character-portrait pickup-current-portrait 부여. 
3. imageUrl변수에 character.imageUrl || pickup.bannerImageUrl;부여함.
--- 이런식으로 함수 내에서 직접 html요소를 작업하는 함수
```

> 검토 메모:
> - 이해한 방향은 맞다.
> - 추가로 `createPickupCharacterCard`는 HTML 요소를 만들기만 하는 함수가 아니라, 완성된 `card` DOM을 `return card;`로 돌려준다.
> - 화면에 실제로 붙이는 일은 이 함수 안이 아니라 나중의 `currentPickupList.replaceChildren(...cards)`가 담당한다.

```text
createPickupCharacterCard(...)
→ article, div, img, h3, p, span 요소를 만든다
→ card 안에 조립한다
→ return card로 완성된 DOM 요소를 반환한다
→ renderCurrentPickups()가 반환된 카드들을 currentPickupList에 넣는다
```

5. 학원 데이터를 카드로 변환해 academy-panel에 추가한다. 
    - 학원 각가의 객체를 유저가 볼 수 있도록 HTML 요소로 만든다. (로고 이미지, 이름)
6. pickups.json을 fetch로 불러온다. json파일이라 fetch로 불러옴
7. 현재 진행 중인 픽업만 필터링한다.
8. 픽업 캐릭터 카드를 만들어 current-pickup-list에 표시한다. -> 빈 배열(배열보다 <div>요소가 맞는 말)에 학원의 로고와 이름이 적힌 a태그를 추가한다.

> 틀린 부분 표시:
> - 8번의 `빈 배열에 학원의 로고와 이름이 적힌 a태그를 추가한다`는 설명은 픽업 캐릭터 처리와 학원 카드 처리가 섞여 있다.
>
> 옳은 표현:
> - 5번은 학원 데이터 처리이다. 학원 객체를 `<a class="academy-card">` 카드로 바꿔 `academy-panel`에 넣는다.
> - 8번은 픽업 캐릭터 처리이다. 진행 중인 픽업의 `characters` 배열을 돌면서 `<article class="character-card">` 카드를 만들고 `current-pickup-list`에 넣는다.
> - `cards`는 빈 배열을 직접 만든 것이 아니라 `flatMap(...)`의 결과로 만들어진 새 배열이다.

```js
const cards = currentSchedules.flatMap((schedule) =>
  schedule.characters.map((character) => createPickupCharacterCard(schedule, character)),
);

currentPickupList.replaceChildren(...cards);
```

### 사용 변수

#### entries

```js
const entries = currentSchedules.flatMap((schedule) =>
  schedule.characters.map((character) => ({ schedule, character })),
);
```

1. 현재 픽업중인 주차 1객체를 0 번째 인덱스에 담은 배열을 flatMap을 사용한다.
2. 그 객체 안에서 캐릭터객체(name, type)를 캐릭터 매개변수에 담는다.
3. entries에는 N주차, 캐릭터객체가 담긴 배열이 들어있게된다.

### 사용 함수

#### renderPickupCarouselPage(entries, pageIndex)

```js
function renderPickupCarouselPage(entries, pageIndex) {
  const startIndex = pageIndex * PICKUP_CAROUSEL_PAGE_SIZE;
  const pageEntries = entries.slice(startIndex, startIndex + PICKUP_CAROUSEL_PAGE_SIZE);
  const cards = pageEntries.map(({ schedule, character }) =>
    createPickupCharacterCard(schedule, character),
  );

  currentPickupList.replaceChildren(...cards);
}
```

```text
 매개변수 : entries배열과 다음페이지의 값이 전달
startIndex에 다음 페이지에서 처음으로 표시할 픽업 캐릭터의 인덱스 값을 가져옴
이제 2개씩 출력할 예정이니까 배열을 [0,1], [2,3], [4,5] 처럼 자르고 현재 필요한 번째의 배열을 가져옴
createPickupCharacterCard() 함수로 카드(html태그)를 생성함
전의 픽업 카드가 들어있는 div태그에 기존 자식 요소를 전부 지우고 cards를 붙여넣음
```

#### renderPickupCarousel(entries)

```js
const pageCount = Math.ceil(entries.length / PICKUP_CAROUSEL_PAGE_SIZE);
let currentPage = 0; // 현재 페이지 값
```

총 N개의 페이지를 만들어야 해야한다. 픽업중인 캐릭터의 수를 2로 나누고 올림으로 처리하여 총 페이지 계산한다.

```js
setPickupCarouselControlsVisible(true);// 3명 이상일 경우 실행한 함수이기에 true값을 전달함
```

```js
function moveToPage(pageIndex) {
  currentPage = (pageIndex + pageCount) % pageCount; // 이동할 페이지의 값을 저장함
  renderPickupCarouselPage(entries, currentPage); // 기본 요소를 지우고 다음페이지에 출력할 학생 2명의 정보를 붙여넣음
}
```

```js
function restartAutoSlide() {
    stopPickupCarouselTimer(); // 타이머를 초기화 시킴
    pickupCarouselTimer = window.setInterval(() => { // 5초 이후 moveToPage함수 실행
      moveToPage(currentPage + 1);
    }, PICKUP_CAROUSEL_INTERVAL);
}
```

```js
pickupCarouselPrev.onclick = () => {
    moveToPage(currentPage - n);
    restartAutoSlide();
};
```

현재 페이지에서 n 번 으로 이동할 페이지 값으로 moveToPage함수 실행후 타이머함수 초기화

#### async function renderCurrentPickups()

전체 흐름
```text
1. 타이머 id를 초기화한다.
2. 아직 픽업 배열의 크기를 판단하기 전엔 버튼을 숨긴다.
3. 이후 성공적으로 로드했을 경우 try문 사용
4. 비동기처리로 ./data/pickups.json을 가져옴
  - 실패했을 경우 별도의 문구 표시
5. const schedules = await response.json();를 사용하여 javascript를 사용할 수 있도록 만들어줌
6. currentSchedules 변수에 현재 픽업중인 N 주차 객체가 담긴 배열을 담음
  - 만약 배열의 크기가 0이라면 별도의 문구를 표시함
7. 변수 entries 생성(N주차 객체, 학생(이름, 타입)객체)
8. 픽업중인 학생이 3명 이상한지 판단후 버튼영역 표시, 비표시 판단
9. createPickupCharacterCard 함수로 현재 픽업화면에 표시할 학생의 픽업 정보가 담긴 article 태그의 박스들이 담긴 배열을 card 변수에 담는다.
10. 현재의 학생 픽업 article이 담긴 div 요소에 기존 자식 요소를 삭제 후 9번의 card를 붙여넣는다.
11. catch
  - 별도의 문구 표시
```