# character-detail.html 코드 공부 문서

## 목적

이 문서는 `character-detail.html`을 공부하기 위한 설명 문서다.

목표는 다음 흐름을 이해하는 것이다.

- HTML이 어떤 영역으로 나뉘는지
- 학생 데이터가 화면 어디에 들어가는지
- 각 함수가 어떤 일을 하는지
- 학생 레벨, 성급, 스킬 레벨 변경이 재화 계산으로 어떻게 이어지는지
- 장비, 애장품, 스탯, 전용무기 영역이 현재 실제 계산과 연결되어 있는지

현재 페이지는 정적 HTML 안에 `script type="module"`이 들어 있는 구조다. 별도 `character-detail.js` 파일은 아직 없다.

## 실행 URL

현재 학생 상세 페이지는 URL의 `slug` 값을 읽는다.

```text
character-detail.html?slug=kei
```

예전 문서나 코드에서 `id`를 기준으로 설명한 부분이 있다면 현재 코드와 다르다. 현재 기준은 `slug`다.

학생을 찾는 코드:

```js
const characterSlugParam = new URLSearchParams(window.location.search).get("slug");

const selectedStudent =
  students.find((student) => student.slug === characterSlugParam) ||
  students.find((student) => student.slug === "kei") ||
  students[0];
```

의미:

- URL에 `?slug=학생slug`가 있으면 그 학생을 찾는다.
- 못 찾으면 `slug === "kei"`인 학생을 기본값으로 사용한다.
- 케이도 없으면 `students[0]`을 사용한다.

## 연결 파일

HTML/CSS:

```text
character-detail.html
styles.css
```

페이지에서 직접 import하는 데이터:

```text
data/index.js
data/academies.js
data/students.js
data/student-terrain-adaptations.js
```

계산 함수:

```text
utils/characterLevelCalculator.js
utils/skillMaterialCalculator.js
utils/starRankCalculator.js
```

계산 함수가 내부에서 사용하는 데이터:

```text
data/characterExpTable.js
data/activityReports.js
data/skillMaterialRequirements.js
data/starRankRequirements.js
```

## 전체 HTML 구조

큰 구조는 다음과 같다.

```text
body
├─ header.site-header
│  ├─ a.logo
│  └─ div.student-search
└─ main.page-shell.character-detail-shell
   ├─ section.character-detail-grid
   │  ├─ article.character-profile-panel
   │  └─ article.character-info-panel
   └─ section.character-detail-stack
      ├─ article.character-skill-panel
      ├─ article.student-level-panel
      ├─ article.equipment-panel
      ├─ article.favorite-item-panel
      ├─ article.character-stat-panel
      ├─ article.required-material-panel
      ├─ article.exclusive-weapon-panel
      └─ article.memorial-panel
```

상단 `character-detail-grid`는 학생 프로필과 기본 정보를 보여준다.

하단 `character-detail-stack`은 스킬, 성장 설정, 장비, 애장품, 스탯, 필요한 재화, 전용무기, 메모리얼을 세로로 보여준다.

## 상단 왼쪽: character-profile-panel

HTML 위치:

```html
<article class="panel character-profile-panel">
  <div class="character-large-placeholder" aria-hidden="true"></div>
  <div class="character-profile-copy">
    <p class="eyebrow">PROFILE</p>
    <div class="character-profile-title-row">
      <h1 id="character-profile-name">리쿠하치마 아루</h1>
      <div class="character-profile-tags" aria-label="학생 전투 정보">
        ...
      </div>
    </div>
    <p id="character-profile-description">...</p>
  </div>
</article>
```

역할:

- `.character-large-placeholder`: 학생 프로필 이미지 또는 이름 fallback이 들어간다.
- `#character-profile-name`: 학생의 `fullName`이 들어간다.
- `.character-profile-tags`: 공격 타입, 역할, 방어 타입, 포지션이 들어간다.
- `#character-profile-description`: 학생의 `profile` 문자열이 들어간다.

현재 `#character-profile-name`은 CSS에서 `transform: translateX(32px)`로 약간 오른쪽으로 보정되어 있다.

## 상단 오른쪽: character-info-panel

HTML 위치:

```html
<article class="panel character-info-panel">
  <div class="panel-heading character-info-heading">
    ...
    <span class="combat-badge" data-student-field="combatClass">Striker</span>
  </div>
  <dl class="character-info-list">
    <dd data-student-field="fullName">...</dd>
    <dd data-student-field="birthday">...</dd>
    ...
  </dl>
  <div class="terrain-aptitude-section">...</div>
</article>
```

`data-student-field` 속성이 중요하다.

예:

```html
<dd data-student-field="weaponType">SR</dd>
```

스크립트는 이 속성을 찾아서 학생 데이터를 넣는다.

```js
const target = document.querySelector(`[data-student-field="${field}"]`);
target.textContent = value;
```

즉 `fieldValues.weaponType` 값이 위 `dd`에 들어간다.

## 중단: 스킬 영역

HTML 위치:

```html
<article class="panel character-skill-panel">
  <div class="skill-list">
    <article class="skill-card">EX 스킬</article>
    <article class="skill-card">1스킬</article>
    <article class="skill-card">2스킬</article>
    <article class="skill-card">3스킬</article>
  </div>
</article>
```

처음 HTML에는 각 스킬 카드마다 목표 레벨 select만 있다.

```html
<select class="skill-level-select" aria-label="EX 스킬 레벨">
  <option value="1">Lv. 1</option>
  ...
</select>
```

페이지 로딩 후 `setupSkillMaterialControls()`가 실행되면 각 스킬 카드의 select가 목표 레벨용으로 정리된다.

현재 연결 방식:

```text
첫 번째 skill-card -> ex
두 번째 skill-card -> normal
세 번째 skill-card -> passive
네 번째 skill-card -> sub
```

이 순서가 바뀌면 스킬 타입 연결도 같이 바뀌므로 주의해야 한다.

## 성장 설정 영역

HTML 위치:

```html
<article class="panel student-level-panel">
  <input id="student-level-input" type="number" min="1" max="90" value="1" />
  <input id="student-level-range" type="range" min="1" max="90" value="1" />
  <div class="growth-star-row" data-growth-star-row></div>
</article>
```

역할:

- `#student-level-input`: 목표 학생 레벨 숫자 입력
- `#student-level-range`: 목표 학생 레벨 슬라이더
- `[data-growth-star-row]`: 기본 성급 1~5성과 전용무기 1~4성 버튼이 동적으로 들어가는 곳

현재 학생의 실제 보유 상태는 저장하지 않는다.

현재 기준:

```text
현재 학생 레벨 = 1
현재 기본 성급 = 학생 데이터의 baseStar
현재 전용무기 성급 = 0
```

## 장비 영역

HTML 위치:

```html
<article class="panel equipment-panel">
  <article class="equipment-card">장비 1</article>
  <article class="equipment-card">장비 2</article>
  <article class="equipment-card">장비 3</article>
</article>
```

현재 상태:

- 장비 1, 장비 2, 장비 3은 고정 placeholder다.
- 각 장비는 T1~T8 select를 가지고 있다.
- 현재 JavaScript에서 장비 select 값을 읽지 않는다.
- 현재 필요한 재화 계산에도 장비 티어는 반영되지 않는다.
- 장비 이미지, 장비 이름, 장비별 스탯 효과도 아직 데이터와 연결되지 않았다.

즉 지금 장비 영역은 UI 뼈대만 있는 상태다.

공부할 때 기억할 점:

```text
장비 select 변경 -> 현재 아무 계산도 실행하지 않음
```

나중에 장비 계산을 붙이려면 다음 작업이 필요하다.

- 장비별 슬롯 데이터
- 장비 티어업 요구량 데이터
- 장비 select change 이벤트
- `renderRequiredMaterials()` 안에서 장비 결과 합산

## 애장품 영역

HTML 위치:

```html
<article class="panel favorite-item-panel">
  <article class="equipment-card favorite-item-card">
    <h3>애장품 이름</h3>
    <select class="equipment-tier-select" aria-label="애장품 티어">
      <option value="none">미선택</option>
      <option value="tier1">1티어</option>
      <option value="tier2">2티어</option>
    </select>
  </article>
</article>
```

현재 상태:

- 애장품 이름은 placeholder다.
- 학생별 애장품 존재 여부를 확인하지 않는다.
- 애장품이 없는 학생이어도 카드가 표시된다.
- 애장품 select 값을 JavaScript에서 읽지 않는다.
- 필요한 재화 계산에도 애장품은 반영되지 않는다.

즉 애장품 영역도 현재는 UI placeholder다.

## 스탯 영역

HTML 위치:

```html
<article class="panel character-stat-panel">
  <dl class="stat-grid">
    <dt>공격력</dt>
    <dd>N</dd>
    ...
  </dl>
</article>
```

현재 상태:

- 모든 값이 `N`이다.
- 학생 레벨, 성급, 장비, 애장품 변경과 연결되어 있지 않다.
- JavaScript에서 스탯 영역을 갱신하는 함수가 없다.

즉 스탯 영역은 아직 표시 placeholder다.

## 필요한 재화 영역

HTML 위치:

```html
<article class="panel required-material-panel">
  <div class="material-list">
    ...
  </div>
</article>
```

처음 HTML에는 임시 카드가 들어 있다. 하지만 페이지 로딩 후 `renderRequiredMaterials()`가 실행되면서 기존 카드들이 계산 결과 카드로 교체된다.

교체 코드:

```js
materialList.replaceChildren(...cards);
```

현재 실제로 반영되는 계산:

- 학생 레벨업 보고서/크레딧
- 스킬 강화 재화
- 성급/전용무기 성급 엘레프

현재 반영되지 않는 계산:

- 장비 티어업 재화
- 애장품 재화
- 장비/애장품에 따른 스탯

## 전용무기 영역

HTML 위치:

```html
<article class="panel exclusive-weapon-panel">
  <h2>전용무기 이름</h2>
  <p class="weapon-locked-message" data-weapon-display-locked-message hidden>미개방</p>
  ...
</article>
```

현재 상태:

- 전용무기 이름과 설명은 placeholder다.
- 전용무기 효과 카드도 고정 HTML이다.
- `data-weapon-display-locked-message` 속성은 있지만 현재 JavaScript에서 사용하지 않는다.
- 전용무기 성급 선택은 성장 설정의 별 버튼에서만 계산에 반영된다.
- 표시 순서는 `exclusive-weapon-copy` 설명 영역, `weapon-image-placeholder` 가로 이미지 영역, `weapon-effect-card-list` 효과 카드 영역이다.

즉 전용무기 영역의 표시 내용은 아직 학생별 데이터와 연결되지 않았다.

## script import

스크립트 시작 부분:

```js
import { academies, studentTerrainAdaptations, students } from "./data/index.js";
import { calculateCharacterLevelMaterials } from "./utils/characterLevelCalculator.js";
import { calculateSkillMaterials, SKILL_LEVEL_RANGES } from "./utils/skillMaterialCalculator.js";
import { calculateStarRankEleph } from "./utils/starRankCalculator.js";
```

각 import 역할:

- `academies`: 학생의 `academySlug`로 학원 이름을 찾는다.
- `studentTerrainAdaptations`: 학생별 시가지/야외/실내 적성 데이터를 찾는다.
- `students`: URL의 `slug`로 표시할 학생을 찾는다.
- `calculateCharacterLevelMaterials`: 목표 학생 레벨까지 필요한 보고서와 크레딧을 계산한다.
- `calculateSkillMaterials`: 스킬 현재/목표 레벨에 따른 재화를 계산한다.
- `SKILL_LEVEL_RANGES`: EX는 1~5, 나머지는 1~10 범위를 제공한다.
- `calculateStarRankEleph`: 목표 성급/전용무기 성급까지 필요한 엘레프를 계산한다.

## DOM 변수

스크립트 초반에 HTML 요소를 변수로 잡는다.

```js
const characterProfileName = document.querySelector("#character-profile-name");
const characterProfileDescription = document.querySelector("#character-profile-description");
const studentLevelInput = document.querySelector("#student-level-input");
const studentLevelRange = document.querySelector("#student-level-range");
const characterProfileVisual = document.querySelector(".character-large-placeholder");
const materialList = document.querySelector(".material-list");
const growthStarRow = document.querySelector("[data-growth-star-row]");
const terrainAptitudeList = document.querySelector(".terrain-aptitude-list");
const roleImage = document.querySelector("[data-role-image]");
```

이 변수들은 이후 함수들이 화면을 바꿀 때 계속 사용한다.

예:

```js
characterProfileName.textContent = student.fullName;
materialList.replaceChildren(...cards);
growthStarRow.replaceChildren(...buttons);
```

## 상수 데이터

이미지 경로 상수:

```js
const STAR_ICON_URL = "./images/icon/Icon_star.webp";
const BLUE_STAR_ICON_URL = "./images/icon/Icon_blue_star.webp";
const BLANK_STAR_ICON_URL = "./images/icon/Icon_blank_star.webp";
```

지역 적성 키:

```js
const TERRAIN_KEYS = ["urban", "outdoor", "indoor"];
```

지역 정보:

```js
const TERRAIN_META = {
  urban: { label: "시가지", imageUrl: "./images/terrains/urban.webp" },
  outdoor: { label: "야외", imageUrl: "./images/terrains/outdoor.webp" },
  indoor: { label: "실내", imageUrl: "./images/terrains/indoor.webp" },
};
```

지역 랭크 이미지:

```js
const TERRAIN_RANK_IMAGE_URLS = {
  SS: "./images/terrain-ranks/rank-ss.webp",
  S: "./images/terrain-ranks/rank-s.webp",
  ...
};
```

역할 이미지:

```js
const ROLE_IMAGE_URLS = {
  "딜러": "./images/role/attacker.webp",
  "탱커": "./images/role/tank.webp",
  ...
};
```

## selectedStudent / selectedAcademy

학생 선택:

```js
const selectedStudent =
  students.find((student) => student.slug === characterSlugParam) ||
  students.find((student) => student.slug === "kei") ||
  students[0];
```

학원 선택:

```js
const selectedAcademy = academies.find(
  (academy) => academy.slug === selectedStudent.academySlug,
);
```

학생 데이터에는 학원 이름을 직접 넣지 않고 `academySlug`를 넣는다. 화면에 표시할 학원 이름은 `academies`에서 찾는다.

## renderStudentDetail(student)

역할:

```text
선택된 학생의 기본 정보를 화면에 넣는다.
```

처리 흐름:

1. 학생의 학원 이름을 구한다.
2. 브라우저 탭 제목을 학생 이름으로 바꾼다.
3. 프로필 이미지 영역을 비운다.
4. `profileImageUrl`이 있으면 이미지를 넣고, 없으면 학생 이름 fallback을 넣는다.
5. 큰 이름과 프로필 설명을 넣는다.
6. 역할 이미지 경로를 설정한다.
7. `data-student-field` 요소들에 학생 정보를 넣는다.

핵심 코드:

```js
characterProfileVisual.replaceChildren();

if(student.profileImageUrl) {
  const image = document.createElement("img");
  image.src = student.profileImageUrl;
  image.alt = student.name;
  image.className = "character-profile-image";
  characterProfileVisual.append(image);
} else {
  const fallback = document.createElement("span");
  fallback.id = "character-profile-mark";
  fallback.textContent = student.name;
  characterProfileVisual.append(fallback);
}
```

`replaceChildren()`은 기존 자식 요소를 모두 지우고 새로 넣기 위한 준비다.

`fieldValues` 연결:

```js
const fieldValues = {
  fullName: student.fullName,
  birthday: student.birthday,
  academyName, // 키, 값이 같이 때문에 축약함
  attackType: student.attackType,
  defenseType: student.defenseType,
  role: student.role,
  position: student.position ?? "임시 표시",
  combatClass: student.combatClass ?? "임시 표시",
  ...
};
```

여기서 key는 HTML의 `data-student-field` 값과 맞아야 한다.

예:

```js
fieldValues.fullName
```

은 아래 HTML에 들어간다.

```html
<dd data-student-field="fullName">...</dd>
```

주의:

- `?? "임시 표시"`는 값이 `null` 또는 `undefined`일 때만 임시 표시를 넣는다.
- 빈 문자열 `""`은 `??`로 대체되지 않는다.

## renderTerrainAdaptations(student)

역할:

```text
학생의 시가지/야외/실내 적성을 카드로 다시 그린다.
```

학생 적성 데이터 찾기:

```js
const adaptation =
  studentTerrainAdaptations.find((item) => item.studentId === student.id) ||
  studentTerrainAdaptations.find((item) => item.studentSlug === student.slug);
```

의미:

- 먼저 `studentId`가 같은 데이터를 찾는다.
- 없으면 `studentSlug`가 같은 데이터를 찾는다.

카드 생성 흐름:

```text
TERRAIN_KEYS ["urban", "outdoor", "indoor"]를 순회
-> 각 terrainKey에 맞는 지역 이름과 이미지 경로를 가져옴
-> 학생 적성 랭크를 가져옴
-> 랭크 이미지가 있으면 img 추가
-> 카드 article 반환
-> terrainAptitudeList.replaceChildren(...cards)
```

현재 코드에서 주의할 점:

```js
} else {
    const empty = document.createElement("span");
    empty.textContent = "데이터 없음";

    body.append(title);
}
```

여기서는 `empty`를 만들지만 실제로 append하지 않고 `title`을 한 번 더 append하고 있다. 그래서 데이터가 없는 경우 `데이터 없음` 문구가 화면에 나오지 않을 수 있다.

이 문서는 공부용이므로 코드는 수정하지 않았다.

## 초기 렌더링

학생 기본 정보와 지역 적성은 상태 변수 선언보다 먼저 한 번 렌더링된다.

```js
renderStudentDetail(selectedStudent);
renderTerrainAdaptations(selectedStudent);
```

이 두 함수는 계산 상태와 상관없이 선택된 학생 데이터를 화면에 넣는다.

## 성장 상태 변수

```js
let selectedBaseStar = getBaseStar(selectedStudent);
let selectedWeaponStar = getWeaponStar();
let targetStudentLevel = Number(studentLevelInput.value) || 1;
let targetBaseStar = selectedBaseStar;
let targetWeaponStar = selectedWeaponStar;
const initialStudentLevel = 1;
const initialBaseStar = getBaseStar(selectedStudent);
```

의미:

- `selectedBaseStar`: 현재 화면에서 선택된 기본 성급
- `selectedWeaponStar`: 현재 화면에서 선택된 전용무기 성급
- `targetStudentLevel`: 목표 학생 레벨
- `targetBaseStar`: 계산에 사용할 목표 기본 성급
- `targetWeaponStar`: 계산에 사용할 목표 전용무기 성급
- `initialStudentLevel`: 현재 학생 레벨, 지금은 항상 1
- `initialBaseStar`: 학생 데이터의 기본 성급

현재 `initialWeaponStar` 변수는 없다. `calculateStarRankEleph()`는 `currentWeaponStar` 기본값이 `0`이므로 전달하지 않아도 0으로 계산된다.

## syncStudentLevel(value)

역할:

```text
숫자 입력과 슬라이더를 같은 값으로 맞추고, 필요한 재화를 다시 계산한다.
```

코드:

```js
function syncStudentLevel(value) {
  const normalizedLevel = Math.min(90, Math.max(1, Number(value) || 1));
  studentLevelInput.value = String(normalizedLevel);
  studentLevelRange.value = String(normalizedLevel);
  targetStudentLevel = normalizedLevel;
  renderRequiredMaterials();
}
```

처리 흐름:

1. 입력값을 숫자로 바꾼다.
2. 숫자가 아니면 1로 본다.
3. 최소 1, 최대 90으로 제한한다.
4. number input과 range input 값을 같은 값으로 맞춘다.
5. `targetStudentLevel`을 갱신한다.
6. `renderRequiredMaterials()`를 실행해서 재화를 다시 계산한다.

이벤트 연결:

```js
studentLevelInput.addEventListener("input", () => {
  syncStudentLevel(studentLevelInput.value);
});

studentLevelRange.addEventListener("input", () => {
  syncStudentLevel(studentLevelRange.value);
});
```

## clampNumber(value, min, max)

역할:

```text
숫자를 min~max 사이로 제한한다.
```

코드:

```js
function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}
```

예:

```text
clampNumber(3, 1, 5) -> 3
clampNumber(9, 1, 5) -> 5
clampNumber(null, 1, 5) -> 1
```

## getBaseStar(student)

역할:

```text
학생 데이터의 baseStar를 1~5 범위로 보정해서 반환한다.
```

코드:

```js
function getBaseStar(student) {
  return clampNumber(student.baseStar ?? 1, 1, 5);
}
```

`student.baseStar`가 없으면 1성으로 본다.

## getWeaponStar()

역할:

```text
현재 전용무기 성급을 반환한다.
```

현재 코드:

```js
function getWeaponStar() {
  return 0;
}
```

현재 프로젝트는 유저별 보유 상태를 저장하지 않으므로 전용무기 성급은 항상 0으로 시작한다.

## getGrowthStarKind(slotNumber, baseStar, weaponStar)

역할:

```text
1~9번 별 칸이 노란 별인지, 파란 별인지, 빈 별인지 판단한다.
```

규칙:

```text
1~5번 칸: 기본 성급
6~9번 칸: 전용무기 1~4성
```

코드:

```js
if (slotNumber <= 5) {
  return slotNumber <= baseStar ? "student" : "blank";
}

return slotNumber - 5 <= weaponStar ? "weapon" : "blank";
```

예:

```text
baseStar = 3, weaponStar = 0
1 student
2 student
3 student
4 blank
5 blank
6 blank
7 blank
8 blank
9 blank
```

예:

```text
baseStar = 5, weaponStar = 2
1~5 student
6 weapon
7 weapon
8 blank
9 blank
```

## getStarIconUrl(kind)

역할:

```text
별 종류에 맞는 이미지 경로를 반환한다.
```

반환:

```text
student -> 노란 별
weapon -> 파란 별
blank -> 빈 별
```

## createStarIcon(kind)

역할:

```text
별 이미지 img 요소를 만든다.
```

코드:

```js
const image = document.createElement("img");
image.className = `star-icon ${kind}-star-icon`;
image.src = getStarIconUrl(kind);
image.alt = "";
image.setAttribute("aria-hidden", "true");
```

`aria-hidden="true"`는 이 이미지가 장식용이라는 뜻이다. 실제 버튼의 의미는 버튼의 `aria-label`이 담당한다.

## renderStarIcons(count, kind, ariaLabel)

역할:

```text
같은 종류의 별 여러 개를 span으로 묶어서 만든다.
```

현재 `character-detail.html` 안에서는 이 함수가 호출되지 않는다. 남아 있는 보조 함수로 볼 수 있다.

나중에 별을 단순 표시용으로 보여줄 때 사용할 수 있다.

## createGrowthStarButton(slotNumber)

역할:

```text
성장 설정의 별 버튼 하나를 만든다.
```

처리 흐름:

1. `slotNumber`에 맞는 별 종류를 구한다.
2. `button` 요소를 만든다.
3. 1~5번이면 기본 성급 선택 버튼으로 만든다.
4. 6~9번이면 전용무기 성급 선택 버튼으로 만든다.
5. 버튼 안에 별 이미지 하나를 넣는다.

기본 성급 버튼 클릭:

```js
targetBaseStar = slotNumber;
targetWeaponStar = 0;
selectedBaseStar = targetBaseStar;
selectedWeaponStar = targetWeaponStar;
renderGrowthStars();
renderRequiredMaterials();
```

의미:

- 기본 성급을 선택하면 전용무기 성급은 0으로 초기화한다.
- 별 UI를 다시 그린다.
- 필요한 재화를 다시 계산한다.

전용무기 버튼 클릭:

```js
targetBaseStar = 5;
targetWeaponStar = weaponRank;
selectedBaseStar = targetBaseStar;
selectedWeaponStar = targetWeaponStar;
renderGrowthStars();
renderRequiredMaterials();
```

의미:

- 전용무기를 선택하면 기본 성급은 자동으로 5성으로 본다.
- 전용무기 성급을 목표값으로 저장한다.
- 별 UI와 필요한 재화를 다시 계산한다.

## renderGrowthStars()

역할:

```text
성장 설정의 별 버튼 9개를 다시 그린다.
```

코드:

```js
const buttons = [];

for (let slotNumber = 1; slotNumber <= 9; slotNumber += 1) {
  buttons.push(createGrowthStarButton(slotNumber));
}

growthStarRow.replaceChildren(...buttons);
```

별을 클릭할 때마다 `selectedBaseStar`, `selectedWeaponStar`가 바뀌고, 이 함수가 다시 실행되어 화면의 별 색이 갱신된다.

## setupSkillMaterialControls()

역할:

```text
스킬 카드의 기존 select를 목표 레벨 select로 사용하고, 현재 레벨은 내부에서 최소값으로 고정한다.
```

스킬 카드 찾기:

```js
const skillCards = document.querySelectorAll(".character-skill-panel .skill-card");
const skillTypes = ["ex", "normal", "passive", "sub"];
```

각 카드에서 필요한 요소:

```js
const targetSelect = card.querySelector(".skill-level-select");
const titleRow = card.querySelector(".skill-title-row");
const range = SKILL_LEVEL_RANGES[skillType];
```

목표 select에 데이터 속성 추가:

```js
targetSelect.dataset.skillType = skillType;
targetSelect.dataset.levelKind = "target";
```

이후 `getSkillMaterialResults()`는 이 속성을 기준으로 목표 레벨 select를 찾는다.

기본 목표 레벨은 해당 스킬의 최대 레벨이다.

```text
EX -> Lv. 5
normal/passive/sub -> Lv. 10
```

이벤트 연결:

```js
targetSelect.addEventListener("change", renderRequiredMaterials);
```

스킬 목표 레벨이 바뀌면 필요한 재화가 다시 계산된다. 현재 레벨은 각 스킬의 최소 레벨로 내부 고정한다.

## getSkillLabel(skillType)

역할:

```text
스킬 타입 코드를 화면/aria-label용 한글 이름으로 바꾼다.
```

매핑:

```text
ex -> EX 스킬
normal -> 1스킬
passive -> 2스킬
sub -> 3스킬
```

## renderRequiredMaterials()

역할:

```text
현재 선택된 성장값을 기준으로 필요한 재화를 계산하고 화면에 출력한다.
```

이 페이지의 계산 핵심 함수다.

처리 흐름:

1. 학생 레벨업 재화를 계산한다.
2. 성급/전용무기 엘레프를 계산한다.
3. 스킬 재화를 계산한다.
4. 같은 `itemId`의 재화를 합산한다.
5. 엘레프가 필요하면 임시 엘레프 재화를 추가한다.
6. 재화를 정렬한다.
7. 재화 카드를 만든다.
8. 스킬 데이터가 없으면 안내 문구를 추가한다.
9. `.material-list` 내용을 새 카드로 교체한다.

학생 레벨 계산:

```js
const levelResult = calculateCharacterLevelMaterials({
  currentLevel: initialStudentLevel,
  targetLevel: targetStudentLevel,
});
```

성급/전용무기 계산:

```js
const starResult = calculateStarRankEleph({
  currentBaseStar: initialBaseStar,
  targetBaseStar,
  targetWeaponStar,
});
```

`currentWeaponStar`는 넘기지 않는다. `calculateStarRankEleph()`의 기본값이 0이라서 현재 전용무기는 0성으로 계산된다.

스킬 계산:

```js
const skillResults = getSkillMaterialResults();
```

합산:

```js
const materialMap = new Map();

mergeMaterials(materialMap, levelResult.materials);
skillResults.forEach((result) => mergeMaterials(materialMap, result.materials));
```

엘레프 추가:

```js
if (starResult.elephQuantity > 0) {
  mergeMaterials(materialMap, [
    {
      itemId: `${selectedStudent.id}-eleph`,
      itemName: `${selectedStudent.name}의 엘레프`,
      tier: null,
      quantity: starResult.elephQuantity,
      needsReview: true,
    },
  ]);
}
```

주의:

- 엘레프 `itemId`는 아직 안정적인 itemId가 아니라 임시 규칙이다.
- 그래서 `needsReview: true`가 붙는다.

화면 교체:

```js
materialList.replaceChildren(...cards);
```

## getSkillMaterialResults()

역할:

```text
화면에 있는 스킬 목표 select 값을 읽어서 스킬 재화 계산 결과 배열을 만든다.
```

목표 레벨 select 찾기:

```js
document.querySelectorAll(".skill-level-select[data-level-kind='target']")
```

계산 호출:

```js
return calculateSkillMaterials({
  studentId: selectedStudent.id,
  skillType,
  currentLevel: range.min,
  targetLevel: targetSelect.value,
});
```

여기서 `studentId`는 `selectedStudent.id`를 사용한다. URL은 `slug`로 찾지만, 스킬 재화 데이터 연결은 학생의 `id`를 사용한다.

## mergeMaterials(materialMap, materials)

역할:

```text
같은 itemId를 가진 재화를 하나로 합친다.
```

예:

```text
학생 레벨업 크레딧 3,780
스킬 강화 크레딧 80,000
```

둘 다 `itemId: "credit"`이면 최종 결과는:

```text
크레딧 83,780
```

코드:

```js
const existing = materialMap.get(material.itemId);

if (existing) {
  existing.quantity += material.quantity;
  existing.needsReview = existing.needsReview || Boolean(material.needsReview);
  return;
}
```

`needsReview`는 하나라도 true면 최종 결과도 true가 된다.

## sortMaterials(materials)

역할:

```text
재화 카드 표시 순서를 정한다.
```

규칙:

- 크레딧은 뒤로 보낸다.
- 나머지는 `itemName` 기준으로 한글 정렬한다.

코드:

```js
if (left.itemId === "credit") {
  return 1;
}

if (right.itemId === "credit") {
  return -1;
}

return left.itemName.localeCompare(right.itemName, "ko");
```

## createMaterialCard(material)

역할:

```text
재화 하나를 화면에 표시할 카드 article로 만든다.
```

생성되는 구조:

```text
article.material-card
├─ div.material-image-placeholder
└─ div
   ├─ div.material-title-row
   │  ├─ h3 재화 이름
   │  └─ span.material-review-badge 검수 필요
   └─ p 필요 수량 strong
```

`needsReview`가 true면 `검수 필요` 배지가 붙는다.

수량 출력:

```js
quantity.innerHTML = `필요 수량 <strong>${formatNumber(material.quantity)}</strong>`;
```

## createMaterialNotice(message)

역할:

```text
재화 카드 대신 안내 문구를 만든다.
```

사용되는 경우:

- 선택한 학생의 스킬 재화 데이터가 없을 때
- 계산할 재화가 없을 때

## getMaterialInitial(name)

역할:

```text
재화 이미지 placeholder 안에 들어갈 짧은 글자를 정한다.
```

규칙:

```text
이름에 "크레딧" 포함 -> C
이름에 "BD" 포함 -> BD
이름에 "보고서" 포함 -> EXP
이름에 "노트" 포함 -> 노
이름에 "엘레프" 포함 -> 엘
그 외 -> 이름 첫 글자
```

현재 실제 재화 이미지를 연결하지 않고 placeholder를 쓰기 때문에 필요한 함수다.

## formatNumber(value)

역할:

```text
숫자에 한국어 기준 천 단위 쉼표를 넣는다.
```

예:

```text
80000 -> 80,000
1234567 -> 1,234,567
```

코드:

```js
return new Intl.NumberFormat("ko-KR").format(value);
```

## 마지막 실행 순서

스크립트 마지막:

```js
setupSkillMaterialControls();
syncStudentLevel(1);
renderGrowthStars();
renderRequiredMaterials();
```

실행 흐름:

1. 스킬 카드의 select를 목표 레벨 select로 정리한다.
2. 학생 레벨을 1로 맞추고 재화 계산을 실행한다.
3. 성장 별 버튼 9개를 그린다.
4. 필요한 재화를 다시 계산해서 표시한다.

`syncStudentLevel(1)` 안에서도 `renderRequiredMaterials()`가 실행된다. 그래서 초기 로딩 때 재화 계산은 한 번 이상 실행된다.

## 계산 흐름 요약

```text
URL slug
-> selectedStudent
-> renderStudentDetail()
-> renderTerrainAdaptations()

학생 레벨 입력 변경
-> syncStudentLevel()
-> renderRequiredMaterials()
-> calculateCharacterLevelMaterials()
-> material-list 갱신

성급/전용무기 별 클릭
-> targetBaseStar / targetWeaponStar 변경
-> renderGrowthStars()
-> renderRequiredMaterials()
-> calculateStarRankEleph()
-> material-list 갱신

스킬 목표 select 변경
-> renderRequiredMaterials()
-> getSkillMaterialResults()
-> calculateSkillMaterials()
-> material-list 갱신
```

## 현재 연결된 것과 연결 안 된 것

연결된 것:

- URL `slug`로 학생 선택
- 학생 프로필 이미지 또는 fallback 표시
- 학생 이름, 프로필, 전투 정보, 기본 정보 표시
- 역할 이미지 표시
- 지역 적성 표시
- 목표 학생 레벨에 따른 보고서/크레딧 계산
- 목표 성급/전용무기 성급에 따른 엘레프 계산
- 스킬 목표 레벨에 따른 스킬 재화 계산
- 계산된 재화 카드 표시

아직 연결되지 않은 것:

- 장비 select 값
- 장비 티어업 재화 계산
- 애장품 존재 여부
- 애장품 티어 select 값
- 애장품 재화 계산
- 스탯 계산
- 전용무기 이름/효과 데이터
- 메모리얼 이미지 데이터
- 유저별 현재 보유 상태 저장

## 공부할 때 추천 순서

1. HTML에서 `character-profile-panel`과 `character-info-panel`을 먼저 본다.
2. `data-student-field`가 어떤 방식으로 데이터와 연결되는지 확인한다.
3. `renderStudentDetail()`을 읽고 학생 기본 정보가 들어가는 흐름을 따라간다.
4. `renderTerrainAdaptations()`를 읽고 동적 카드 생성 방식을 본다.
5. 성장 상태 변수들을 보고 현재값/목표값을 구분한다.
6. `syncStudentLevel()`을 읽고 input과 range가 동기화되는 흐름을 본다.
7. `createGrowthStarButton()`과 `renderGrowthStars()`를 읽고 별 버튼 구조를 이해한다.
8. `setupSkillMaterialControls()`를 읽고 기존 HTML select가 목표 레벨 select로 정리되는 과정을 본다.
9. `renderRequiredMaterials()`를 읽고 세 계산 결과가 어떻게 하나의 재화 목록으로 합쳐지는지 본다.
10. 장비/애장품/스탯/전용무기 영역은 현재 placeholder라는 점을 기억하고, 나중에 어떤 데이터가 필요할지 따로 정리한다.

## 수정할 때 주의할 점

- 스킬 카드는 순서로 `ex`, `normal`, `passive`, `sub`가 연결된다. HTML 카드 순서를 바꾸면 JavaScript 연결도 같이 확인해야 한다.
- `data-student-field` 이름을 바꾸면 `fieldValues`의 key도 같이 바꿔야 한다.
- `selectedStudent`는 URL `slug`로 찾지만, 스킬 재화 계산은 `selectedStudent.id`를 사용한다.
- 장비와 애장품 select는 현재 계산에 연결되어 있지 않다. 값을 바꿔도 재화 목록은 변하지 않는다.
- `renderRequiredMaterials()`는 여러 계산 결과를 `itemId` 기준으로 합친다. 새 계산을 추가할 때도 `itemId`, `itemName`, `quantity`, `needsReview` 형태를 맞추는 것이 좋다.
- 확실하지 않은 데이터는 추측해서 넣지 말고 `null` 또는 `needsReview: true`로 표시한다.
