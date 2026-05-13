# academies 데이터 설명

`academies`는 사이트에서 학원 정보를 표현하는 JavaScript 배열입니다.

현재 파일 위치:

```text
data/academies.js
```

이 데이터는 메인 페이지의 학원 목록, 학원 상세 페이지, 학생 목록 필터, 캐릭터 상세 페이지에서 사용됩니다.

## 연결된 파일

### Data

- `data/academies.js`
- `data/index.js`

`data/academies.js`는 실제 학원 데이터 배열을 가지고 있습니다.

```js
export const academies = [
  ...
];
```

`data/index.js`는 이 값을 다시 내보내는 진입점 역할을 합니다.

```js
export { academies } from "./academies.js";
```

그래서 페이지에서는 보통 이렇게 가져옵니다.

```js
import { academies } from "./data/index.js";
```

정확한 흐름:

```text
data/academies.js
→ academies 배열 export
→ data/index.js가 다시 export
→ 각 HTML module script에서 import
→ 화면 렌더링에 사용
```

### 사용 페이지

- `index.html`
- `academy-detail.html`
- `characters.html`
- `character-detail.html`

주요 사용 목적:

- `index.html`: 학원 목록 카드 생성
- `academy-detail.html`: URL의 academy 값으로 학원 상세 정보 표시
- `characters.html`: 학원 필터 옵션과 학생 카드의 학원 이름 표시
- `character-detail.html`: 학생의 `academySlug`로 학원 정보 표시

## 데이터 전체 구조

`academies`는 배열입니다.

배열 안에는 학원 하나를 나타내는 객체들이 들어 있습니다.

```js
export const academies = [
  {
    slug: "gehenna",
    name: "게헨나 학원",
    shortName: "게헨나",
    mark: "G",
    logoClass: "gehenna-mark",
    logoImageUrl: "./images/academies/gehenna-logo.webp",
    mapImageUrl: "./images/maps/gehenna-map.webp",
    description:
      "자유로운 분위기와 강한 개성을 가진 학생들이 모인 학원입니다. 실제 학원 소개 데이터는 추후 academies 테이블과 연결합니다.",
  },
];
```

구조를 단순화하면 다음과 같습니다.

```text
academies 배열
├─ 학원 객체 1
├─ 학원 객체 2
├─ 학원 객체 3
└─ ...
```

각 학원 객체는 다음 정보를 가집니다.

```text
slug
name
shortName
mark
logoClass
logoImageUrl
mapImageUrl
description
```

## 각 속성 의미

### slug

```js
slug: "gehenna"
```

학원을 구분하는 URL용 식별자입니다.

화면에 보여주는 이름이 아니라, 코드와 URL에서 학원을 찾기 위한 값입니다.

예:

```text
academy-detail.html?academy=gehenna
```

`academy-detail.html`은 이 URL에서 `gehenna` 값을 읽고, `academies` 배열에서 `slug`가 같은 학원을 찾습니다.

```js
academies.find((academy) => academy.slug === academyKey);
```

주의:

- `slug`는 다른 데이터와 연결되는 기준입니다.
- `clubs.academySlug`, `students.academySlug` 같은 값과 연결됩니다.
- `slug`를 바꾸면 상세 페이지 링크, 필터, 학생/동아리 연결이 깨질 수 있습니다.

### name

```js
name: "게헨나 학원"
```

학원의 전체 표시 이름입니다.

학원 상세 페이지의 제목이나 이미지 대체 텍스트에서 사용됩니다.

예:

```js
academyName.textContent = selectedAcademy.name;
image.alt = `${academy.name} 로고`;
```

### shortName

```js
shortName: "게헨나"
```

짧은 표시 이름입니다.

메인 페이지의 학원 카드나 학생 목록 필터처럼 공간이 좁은 곳에서 사용합니다.

예:

```js
name.textContent = academy.shortName;
```

### mark

```js
mark: "G"
```

로고 이미지가 없을 때 대신 보여줄 짧은 문자입니다.

예를 들어 로고 이미지가 없으면 `G`, `T`, `M` 같은 문자를 placeholder로 표시할 수 있습니다.

```js
mark.textContent = academy.mark;
```

### logoClass

```js
logoClass: "gehenna-mark"
```

로고 이미지가 없을 때 placeholder에 추가되는 CSS class입니다.

학원별 placeholder 색상이나 모양을 다르게 하기 위해 사용합니다.

```js
mark.className = `academy-logo-placeholder ${academy.logoClass}`;
```

주의:

- `logoClass`는 학원 식별용 데이터라기보다 CSS 스타일 연결용 값입니다.
- 실제 관계 연결에는 `slug`를 사용해야 합니다.

### logoImageUrl

```js
logoImageUrl: "./images/academies/gehenna-logo.webp"
```

학원 로고 이미지 경로입니다.

메인 학원 카드와 학원 상세 상단 로고에 사용됩니다.

이미지 파일 규칙:

```text
./images/academies/{academy-slug}-logo.webp
```

주의:

- 경로는 브라우저가 HTML 파일 기준으로 읽습니다.
- 파일이 없거나 경로가 틀리면 이미지가 깨질 수 있습니다.
- `.webp`라고 적었다면 실제 파일 형식도 webp여야 합니다.

### mapImageUrl

```js
mapImageUrl: "./images/maps/gehenna-map.webp"
```

학원 지도 이미지 경로입니다.

현재는 `academy-detail.html`의 지도 영역에서 사용합니다.

이미지 파일 규칙:

```text
./images/maps/{academy-slug}-map.webp
```

### description

```js
description: "자유로운 분위기와 강한 개성을 가진 학생들이 모인 학원입니다..."
```

학원 상세 페이지에 표시되는 소개 문구입니다.

현재 문구 대부분은 임시 설명입니다. 실제 데이터가 확정되지 않은 내용은 새로 지어내지 않고, placeholder 문구나 `needsReview` 같은 표시를 사용하는 방향이 안전합니다.

## index.html에서 사용하는 흐름

`index.html`은 메인 학원 목록을 만들 때 `academies`를 사용합니다.

```js
import { academies } from "./data/index.js";
```

학원 목록이 들어갈 위치:

```html
<div id="academy-panel" class="academy-panel academy-panel-static"></div>
```

JavaScript는 이 요소를 찾습니다.

```js
const academyPanel = document.querySelector("#academy-panel");
```

그리고 학원 데이터를 카드 DOM으로 바꿔서 추가합니다.

```js
academyPanel.append(...academies.map(createAcademyCard));
```

의미:

```text
academies 배열의 각 학원 객체
→ createAcademyCard 함수로 a 태그 카드 생성
→ 만들어진 카드들을 academyPanel 안에 추가
```

### createAcademyCard

```js
function createAcademyCard(academy) {
  const link = document.createElement("a");
  link.href = `academy-detail.html?academy=${academy.slug}`;
  link.className = "academy-card";

  const mark = createAcademyLogo(academy);

  const name = document.createElement("span");
  name.textContent = academy.shortName;

  link.append(mark, name);
  return link;
}
```

이 함수의 매개변수 `academy`에는 학원 객체 하나가 들어갑니다.

예:

```js
{
  slug: "gehenna",
  name: "게헨나 학원",
  shortName: "게헨나",
  ...
}
```

이 함수가 만드는 결과는 개념적으로 다음과 같습니다.

```html
<a class="academy-card" href="academy-detail.html?academy=gehenna">
  <span class="academy-logo-slot" aria-hidden="true">
    <img src="./images/academies/gehenna-logo.webp" alt="" loading="lazy" />
  </span>
  <span>게헨나</span>
</a>
```

중요한 점:

- `<a>` 태그로 만들기 때문에 카드 전체가 클릭 가능한 링크가 됩니다.
- `href`에 `academy.slug`를 넣어 상세 페이지가 어떤 학원인지 알 수 있게 합니다.
- 화면에 보이는 이름은 `shortName`을 사용합니다.

### createAcademyLogo

```js
function createAcademyLogo(academy) {
  if (academy.logoImageUrl) {
    ...
  }

  ...
}
```

학원 로고 표시 요소를 만듭니다.

로고 이미지가 있으면 이미지 태그를 만듭니다.

```js
const image = document.createElement("img");
image.className = "academy-logo-image";
image.src = academy.logoImageUrl;
image.alt = "";
image.loading = "lazy";
```

로고 이미지가 없으면 placeholder를 만듭니다.

```js
const mark = document.createElement("span");
mark.className = `academy-logo-placeholder ${academy.logoClass}`;
mark.setAttribute("aria-hidden", "true");
mark.textContent = academy.mark;
return mark;
```

`aria-hidden="true"`는 화면에는 보이지만 스크린 리더가 읽지 않게 하는 속성입니다.

메인 학원 카드에는 로고 옆에 `shortName` 텍스트가 이미 있으므로, 로고까지 읽히면 정보가 중복될 수 있습니다.

## academy-detail.html에서 사용하는 흐름

학원 상세 페이지는 URL query string으로 어떤 학원을 보여줄지 결정합니다.

예:

```text
academy-detail.html?academy=gehenna
```

이 값을 읽는 코드:

```js
const academyKey = new URLSearchParams(window.location.search).get("academy") || "gehenna";
```

의미:

```text
현재 주소의 ?academy= 값을 읽는다.
값이 없으면 기본값으로 gehenna를 사용한다.
```

그 다음 `academies` 배열에서 같은 `slug`를 가진 학원을 찾습니다.

```js
const selectedAcademy =
  academies.find((academy) => academy.slug === academyKey) ||
  academies.find((academy) => academy.slug === "gehenna");
```

의미:

```text
1. URL의 academy 값과 slug가 같은 학원을 찾는다.
2. 찾지 못하면 gehenna 학원을 기본값으로 사용한다.
```

선택한 학원 정보는 상세 페이지에 들어갑니다.

```js
academyName.textContent = selectedAcademy.name;
academyDescription.textContent = selectedAcademy.description;
renderAcademyHeroLogo(selectedAcademy);
renderAcademyMap(selectedAcademy);
```

사용되는 속성:

- `name`: 상세 제목
- `description`: 상세 설명
- `logoImageUrl`: 상단 로고
- `mapImageUrl`: 지도 이미지
- `logoClass`, `mark`: 로고 이미지가 없을 때 placeholder

## clubs, students와의 연결

`academies`는 단독으로만 쓰이지 않고 다른 데이터와 연결됩니다.

### clubs 연결

`academy-detail.html`에서 동아리 목록을 표시할 때 사용합니다.

```js
const academyClubs = clubs.filter((club) => club.academySlug === selectedAcademy.slug);
```

뜻:

```text
전체 동아리 중에서
club.academySlug가 현재 학원의 slug와 같은 동아리만 고른다.
```

예:

```js
selectedAcademy.slug === "gehenna"
club.academySlug === "gehenna"
```

이면 해당 동아리는 게헨나 상세 페이지에 표시됩니다.

### students 연결

동아리 안의 학생 목록은 `clubId`로 연결됩니다.

```js
const clubStudents = students.filter((student) => student.clubId === club.id);
```

학생 데이터에서 학원을 표시할 때는 `academySlug`를 사용합니다.

예:

```js
academies.find((academy) => academy.slug === student.academySlug);
```

정리:

```text
학원 연결 기준: academy.slug
동아리의 학원 연결: club.academySlug
학생의 학원 연결: student.academySlug
학생의 동아리 연결: student.clubId
```

## 사용된 주요 JavaScript 문법

### export

```js
export const academies = [...]
```

다른 파일에서 `academies` 값을 import할 수 있게 내보냅니다.

### import

```js
import { academies } from "./data/index.js";
```

다른 JS 모듈에서 내보낸 값을 가져옵니다.

`import/export` 문법은 `<script type="module">`에서 사용할 수 있습니다.

### 배열

```js
export const academies = [
  { ... },
  { ... },
];
```

여러 학원 객체를 순서대로 담는 자료구조입니다.

### 객체

```js
{
  slug: "gehenna",
  name: "게헨나 학원",
}
```

하나의 학원 정보를 key-value 형태로 담습니다.

### map

```js
academies.map(createAcademyCard)
```

배열의 각 학원 객체를 카드 DOM으로 바꿔 새 배열을 만듭니다.

### find

```js
academies.find((academy) => academy.slug === academyKey)
```

조건에 맞는 첫 번째 학원 객체를 찾습니다.

상세 페이지에서 URL의 academy 값과 같은 학원을 찾을 때 사용합니다.

### filter

```js
clubs.filter((club) => club.academySlug === selectedAcademy.slug)
```

조건에 맞는 항목만 골라 새 배열을 만듭니다.

학원 상세 페이지에서 현재 학원에 속한 동아리만 고를 때 사용합니다.

### optional chaining

```js
academies.find((academy) => academy.slug === slug)?.shortName || "임시 학원"
```

`?.`는 앞의 값이 없으면 오류를 내지 않고 `undefined`를 반환합니다.

학원을 찾지 못했을 때 페이지가 깨지지 않도록 하는 방어 문법입니다.

## 이 데이터가 존재하는 이유

`academies`는 학원 정보를 한 곳에서 관리하기 위한 임시 정적 데이터입니다.

현재는 DB가 없기 때문에 `data/academies.js` 파일이 임시 저장소 역할을 합니다.

이 데이터 덕분에:

- 메인 페이지에서 학원 목록을 만들 수 있습니다.
- 학원 상세 페이지에서 학원별 설명, 로고, 지도를 표시할 수 있습니다.
- 학생 목록과 캐릭터 상세에서 학원 이름을 표시할 수 있습니다.
- 동아리와 학생 데이터를 `slug` 기준으로 연결할 수 있습니다.

## 수정할 때 주의할 점

- `slug`는 관계 연결에 쓰이므로 함부로 바꾸지 않습니다.
- `name`은 전체 이름, `shortName`은 짧은 표시 이름으로 구분해서 사용합니다.
- 이미지 경로는 실제 파일 위치와 확장자가 일치해야 합니다.
- 로고나 지도 이미지가 없으면 `null` 또는 placeholder를 사용합니다.
- 실제 확인되지 않은 설명은 지어내지 말고 placeholder 문구를 사용합니다.
- 새 학원을 추가할 때는 관련 이미지 파일, 동아리의 `academySlug`, 학생의 `academySlug`도 함께 확인해야 합니다.

## 현재 임시 처리

- `description` 대부분은 실제 확정 데이터가 아니라 임시 소개 문구입니다.
- 일부 이미지는 placeholder 성격일 수 있습니다.
- 실제 DB 연동 전까지는 `data/academies.js`가 학원 데이터의 임시 기준입니다.
- `logoClass`, `mark`는 이미지가 없을 때 화면이 깨지지 않게 하기 위한 fallback 값입니다.
