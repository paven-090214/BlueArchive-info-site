# academy

## academy.js

academy.js 에는 각 학원의 설명을 담은 객체들이 들어있는 배열이 존재한다.

> 틀린 부분 표시:
> - 실제 파일명은 `academy.js`가 아니라 `data/academies.js`입니다.
> - 배열 이름도 `academy`가 아니라 `academies`입니다.
>
> 옳은 표현:
> - `data/academies.js`에는 각 학원의 정보를 담은 객체들이 들어 있는 `academies` 배열이 존재합니다.
>
> 예:
>
> ```js
> export const academies = [
>   {
>     slug: "gehenna",
>     name: "게헨나 학원",
>     shortName: "게헨나",
>     ...
>   },
> ];
> ```

slug로 url식별자를 갖는다. slug로 다른 페이지들과 연결을 하기때문에 변경하게되면 사용된 페이지
- `index.html`
- `academy-detail.html`
- `characters.html`
- `character-detail.html`
에서 연결이 깨질 수 있다.

> 검토 메모:
> - 맞는 설명입니다.
> - `slug`는 화면 표시용 이름이 아니라 데이터 연결용 식별자입니다.
> - `index.html`에서는 상세 페이지 링크를 만들 때 사용합니다.
> - `academy-detail.html`에서는 URL의 `academy` 값과 비교할 때 사용합니다.
> - `clubs.academySlug`, `students.academySlug`와 연결될 수 있기 때문에 함부로 바꾸면 안 됩니다.

## academy-detail.html

### html 영역

첫 번째 좌측 패널에는 학원의 로고와 이름, 간단한 설명이 들어간다.(빈 <div>요소 존재)
두 번째 좌측 패널에는 각 학원의 동아리가 들어가게된다.
그 바로 아래에 동아리 종류(이름, 간단한 설명 + 각 동아리 부원)가 들어갈 자리가 있다.(빈 <div>요소 존재)
세 번째 우측에 학원의 지도 표시
네 번째 지도 아래에 학원의 스케줄 설명

> 검토 메모:
> - 전체 구조 설명은 맞습니다.
> - 다만 첫 번째 좌측 패널의 로고 영역은 완전히 빈 `<div>`는 아닙니다. 기본값으로 게헨나 placeholder가 들어 있습니다.
>
> ```html
> <div id="academy-hero-mark" class="academy-hero-placeholder gehenna-mark" aria-hidden="true">
>   G
> </div>
> ```
>
> - 이 값은 JavaScript가 정상 실행되면 `selectedAcademy` 값에 맞게 이미지나 placeholder로 교체됩니다.
> - 동아리 목록이 들어갈 `#club-list`는 빈 div가 맞습니다.
> - 지도 영역도 처음부터 placeholder가 들어 있고, JavaScript가 지도 이미지나 새 placeholder로 교체합니다.

#### html 태그
<details> : 접었다 펼 수 있는 html의 요소
<summary> : <details>안에서 제목 역할을 하는 요소, <summary> 클릭시 <details>가 접히거나 펼쳐짐
<strong> : 현재 각 동아리의 이름 출력이므로 중요한 역할이라 강조 표시
<small> : 설명 표시

> 검토 메모:
> - 맞는 설명입니다.
> - 현재 코드에서는 `details` 하나가 동아리 하나입니다.
> - `summary`는 그 동아리 카드의 제목/클릭 영역입니다.
> - `strong`에는 동아리 이름, `small`에는 동아리 설명이 들어갑니다.


### script 영역

```js
const academyName = document.querySelector("#academy-name"); // <h1>태그인 학원의 이름을 가르키는 요소를 변수에 넣는다.
```

```text
- const academyKey = new URLSearchParams(window.location.search).get("academy") || "gehenna";
1. query string
    - 예시 주소 : academy-detail.html?academy=trinity
    - ?academy=trinity <- 이 부분을 query string이라고 합니다.
    - 결과 : window.location.search = ?academy=trinity
2. new URLSearchParams(window.location.search) -> ?academy=trinity같은 query string을 다루기 쉬운 객채로 변경함
    - .get()으로 특정 값을 꺼낼 수 있다.
3. .get("arcademy")로 학원의 이름을 가져올 수 있다.
4. null값일 경우 gehenna를 표시
```

> 틀린 부분 표시:
> - `.get("arcademy")`는 오타입니다. 실제 코드는 `.get("academy")`입니다.
> - `.get("academy")`로 가져오는 값은 학원의 "이름"이 아니라 URL에 들어간 학원 식별자 `slug`입니다.
>
> 옳은 표현:
> - `academy-detail.html?academy=trinity` 주소라면 `.get("academy")`의 결과는 `"trinity"`입니다.
> - 이 값은 `academyKey`에 들어가고, 이후 `academies.find(...)`에서 `academy.slug`와 비교됩니다.
>
> ```js
> const academyKey = new URLSearchParams(window.location.search).get("academy") || "gehenna";
> ```
>
> 추가 보강:
> - `?academy=` 값이 아예 없으면 `academyKey`는 `"gehenna"`가 됩니다.
> - `?academy=wrong`처럼 값은 있지만 실제 배열에 없는 slug라면, 다음 코드에서 다시 게헨나 학원 객체로 fallback합니다.
>
> ```js
> const selectedAcademy =
>   academies.find((academy) => academy.slug === academyKey) ||
>   academies.find((academy) => academy.slug === "gehenna");
> ```

```js
function createClubCard(club) //매개변수 : 학원 객체
```

함수로 동아리 출력
출력 방식 : details -> summary -> span -> strong, small = 동아리 하나
학생객체의 동아리 id와 현재 페이지학원의 동아리 id비교후 clubStudents에 저장

> 틀린 부분 표시:
> - `createClubCard(club)`의 매개변수 `club`은 학원 객체가 아니라 동아리 객체입니다.
>
> 옳은 표현:
> - `club`에는 `clubs` 배열 안의 동아리 객체 하나가 들어갑니다.
>
> 예:
>
> ```js
> {
>   id: "problem-solver-68",
>   academySlug: "gehenna",
>   name: "흥신소 68",
>   description: "의뢰를 받아 여러 일을 처리하는 문제 해결 동아리입니다."
> }
> ```
>
> 검토 메모:
> - `details -> summary -> span -> strong, small = 동아리 하나`라는 구조 설명은 맞습니다.
> - 정확히는 `details` 전체가 동아리 하나이고, `summary` 안에 동아리 이름/설명이 들어갑니다.
> - 학생 목록은 `summary` 안이 아니라 같은 `details` 안의 `characterList div`에 들어갑니다.
>
> 학생 필터링은 현재 학원의 동아리 id와 비교하는 것이 아니라, 현재 동아리의 id와 학생의 `clubId`를 비교합니다.
>
> ```js
> const clubStudents = students.filter((student) => student.clubId === club.id);
> ```
>
> 뜻:
>
> ```text
> 전체 학생 중에서
> student.clubId가 현재 동아리 club.id와 같은 학생만 고른다.
> ```

```js
function createClubStudentLink(student) // 매개변수 : 학색 객체
```

각 학생을 클릭시 이동하는 a태크 추가
a태그에 각 학생의 id 추가
a태그에 이미지와 학생 이름 추가

clubList라는 <div>에 넣기 전에 clubStudents를 map으로 createClubStudentLink()함수 사용하여 각 학생마다 이름과 이미지 출력

> 검토 메모:
> - `학색 객체`는 오타이고, `학생 객체`가 맞습니다.
> - `a태크`도 `a태그`가 맞습니다.
> - 설명 흐름은 맞지만, 학생 링크는 `clubList`에 직접 들어가는 것이 아니라 `characterList`에 들어갑니다.
>
> 정확한 흐름:
>
> ```text
> clubStudents 배열
> → clubStudents.map(createClubStudentLink)
> → 학생 a 태그 배열 생성
> → characterList.append(...학생 a 태그들)
> → details.append(summary, characterList)
> → clubList.replaceChildren(...details 카드들)
> ```

```text
  clubList div
  └─ details = 동아리 하나
     ├─ summary = 동아리 제목 영역
     │  └─ summaryText span
     │     ├─ strong = 동아리 이름
     │     └─ small = 동아리 설명
     │
     └─ characterList div
        └─ a = 학생 하나
           ├─ span = 학생 이미지 placeholder
           └─ span = 학생 이름
```

```js
const academyClubs = clubs.filter((club) => club.academySlug === selectedAcademy.slug);
clubList.replaceChildren(...academyClubs.map(createClubCard));
```
내가 선택한 학원의 동아리 배열이 academyClubs에 저장된다.
이 동아리들을 앞서 설명한 형태로 바꾸기 위해 map을 사용하고, clubList에 덮어쓴다.
replaceChildren() : 그 부모 div 안의 기존 내용을 전부 지우고, 새 자식 요소들로 교체하는 메서드입니다.

> 검토 메모:
> - 맞는 설명입니다.
> - `academyClubs.map(createClubCard)`는 동아리 객체 배열을 `details` DOM 배열로 바꿉니다.
> - `...`는 그 배열을 펼쳐서 `replaceChildren`에 전달합니다.
>
> 풀어 쓰면 다음과 같습니다.
>
> ```js
> const clubCards = academyClubs.map(createClubCard);
> clubList.replaceChildren(...clubCards);
> ```
>
> 동아리가 없을 때는 이 코드가 실행되지 않고, 안내 문구를 표시합니다.
>
> ```js
> if (academyClubs.length === 0) {
>   const emptyMessage = document.createElement("p");
>   emptyMessage.className = "search-empty";
>   emptyMessage.textContent = "표시할 동아리 임시 데이터가 없습니다.";
>   clubList.replaceChildren(emptyMessage);
> }
> ```

## 다음 공부 추천

다음은 `characters.html`을 보는 것을 추천합니다.

이유:

- `academies`, `clubs`, `students`를 모두 import해서 같이 사용합니다.
- 학원 필터, 동아리 필터, 이름 검색이 있어서 `filter`, `find`, 이벤트 처리 연습에 좋습니다.
- `academy-detail.html`에서 배운 `academySlug`, `clubId` 연결 방식이 학생 목록에서 다시 나옵니다.

추천 순서:

```text
characters.html
→ character-detail.html
→ pickup-history.html
→ bond-calculator.js
```
