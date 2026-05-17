# characterLevelCalculator.js 코드 공부 문서

## 목적

이 문서는 `utils/characterLevelCalculator.js`를 공부하기 위한 설명 문서다.

이 파일은 학생 레벨 업에 필요한 내용을 계산한다.

계산하는 것:

- 현재 레벨과 목표 레벨 사이의 필요 EXP
- 필요 EXP에 따른 크레딧 수량
- EXP를 채우기 위한 활동 보고서 조합

현재 학생 상세 페이지의 `필요한 재화` 영역에서 이 계산 결과를 사용한다.
현재 페이지에서는 학생 레벨의 현재값을 1로 고정하고, 목표 레벨만 입력받아 계산하는 구조로 사용한다.

## 연결된 파일

### 계산 함수

```text
utils/characterLevelCalculator.js
```

### 데이터

```text
data/characterExpTable.js
data/activityReports.js
```

`characterExpTable.js`는 학생 레벨별 누적 EXP 표를 가지고 있고, `activityReports.js`는 활동 보고서의 EXP 값을 가지고 있다.

## 파일 전체 구조

```text
import activityReports
import characterExpTable
const CREDIT_PER_EXP = 7

export function calculateCharacterLevelMaterials(...)
  ├─ normalizeLevel()
  ├─ getRequiredExp()
  ├─ calculateActivityReports()
  └─ materials 배열 생성

function getRequiredExp(...)
function calculateActivityReports(...)
function normalizeLevel(...)
```

## 입력과 출력

### 입력

```js
calculateCharacterLevelMaterials({
  currentLevel,
  targetLevel,
  expTable = characterExpTable,
  reports = activityReports,
})
```

입력값 의미:

- `currentLevel`: 현재 레벨
- `targetLevel`: 목표 레벨
- `expTable`: 레벨별 EXP 표
- `reports`: 활동 보고서 표

`expTable`과 `reports`는 기본값이 있어서 보통은 직접 넘기지 않아도 된다.

### 출력

```js
{
  currentLevel,
  targetLevel,
  requiredExp,
  creditQuantity,
  reports,
  materials,
}
```

반환값 의미:

- `currentLevel`: 보정된 현재 레벨
- `targetLevel`: 보정된 목표 레벨
- `requiredExp`: 현재에서 목표까지 필요한 총 EXP
- `creditQuantity`: 필요한 크레딧 수량
- `reports`: 추천 활동 보고서 조합
- `materials`: 화면에 바로 쓰기 좋은 재화 배열

## CREDIT_PER_EXP

```js
const CREDIT_PER_EXP = 7;
```

EXP 1당 크레딧 7개라는 계산 기준이다.

즉:

```text
필요 크레딧 = 필요 EXP * 7
```

## calculateCharacterLevelMaterials()

이 파일의 핵심 함수다.

### 역할

```text
현재 레벨과 목표 레벨을 받아
필요 EXP, 크레딧, 활동 보고서, 재화 카드 데이터를 만든다.
```

### 처리 순서

1. `expTable`에서 최대 레벨을 구한다.
2. 현재 레벨과 목표 레벨을 숫자로 보정한다.
3. 목표 레벨이 현재 레벨보다 작거나 같으면 0 EXP로 끝낸다.
4. 필요 EXP를 계산한다.
5. 필요 EXP에 `CREDIT_PER_EXP`를 곱해 크레딧을 구한다.
6. 활동 보고서 조합을 만든다.
7. 보고서와 크레딧을 `materials` 배열로 묶어 반환한다.

### 코드 흐름

```js
const maxLevel = Math.max(...expTable.map((row) => row.level));
const normalizedCurrentLevel = normalizeLevel(currentLevel, maxLevel);
const normalizedTargetLevel = normalizeLevel(targetLevel, maxLevel);
```

`expTable`의 `level` 값 중 가장 큰 값을 찾아서 허용 최대 레벨로 쓴다.

학생 레벨 표가 1~90이면 `maxLevel`은 90이 된다.

### 목표가 현재보다 낮거나 같을 때

```js
if (normalizedTargetLevel <= normalizedCurrentLevel) {
  return {
    currentLevel: normalizedCurrentLevel,
    targetLevel: normalizedTargetLevel,
    requiredExp: 0,
    creditQuantity: 0,
    reports: [],
    materials: [],
  };
}
```

이 조건은 매우 중요하다.

의미:

- 목표 레벨이 현재 레벨보다 낮거나 같으면 계산할 것이 없다
- EXP도 0
- 크레딧도 0
- 활동 보고서도 없음
- 재화 카드도 없음

즉 오류를 내지 않고 빈 결과를 돌려준다.

## getRequiredExp()

```js
function getRequiredExp({ currentLevel, targetLevel, expTable })
```

### 역할

```text
현재 레벨 누적 EXP와 목표 레벨 누적 EXP의 차이를 구한다.
```

### 계산 방식

```js
const expMap = new Map(expTable.map((row) => [row.level, row]));
const currentTotalExp = expMap.get(currentLevel)?.totalExp ?? 0;
const targetTotalExp = expMap.get(targetLevel)?.totalExp ?? currentTotalExp;

return Math.max(0, targetTotalExp - currentTotalExp);
```

설명:

- `expTable` 배열을 `Map`으로 바꿔서 레벨로 빠르게 찾는다.
- 현재 레벨의 `totalExp`를 읽는다.
- 목표 레벨의 `totalExp`를 읽는다.
- 둘의 차이를 구한다.
- 음수가 나오면 `0`으로 잘라낸다.

### 예시

```text
currentLevel = 1
targetLevel = 10
```

`characterExpTable` 기준으로:

```text
1레벨 누적 EXP = 0
10레벨 누적 EXP = 540
필요 EXP = 540
```

## calculateActivityReports()

```js
function calculateActivityReports({ requiredExp, reports })
```

### 역할

```text
필요 EXP를 보고서 단위로 나눠서 추천 조합을 만든다.
```

### 기본 아이디어

활동 보고서는 EXP가 큰 것부터 먼저 채운다.

활동 보고서 종류:

- 초급 활동 보고서: 50
- 일반 활동 보고서: 500
- 상급 활동 보고서: 2,000
- 최상급 활동 보고서: 10,000

### 정렬

```js
const sortedReports = [...reports].sort((left, right) => right.exp - left.exp);
```

보고서를 EXP 큰 순서로 정렬한다.

즉 보통:

```text
최상급 -> 상급 -> 일반 -> 초급
```

### 수량 계산

```js
const isLastReport = index === sortedReports.length - 1;
const quantity = isLastReport
  ? Math.ceil(remainingExp / report.exp)
  : Math.floor(remainingExp / report.exp);
```

의미:

- 마지막 보고서는 부족한 EXP를 올림 처리해서 꼭 채운다
- 그 전 보고서는 나눠 떨어지는 수만큼만 넣는다

이 방식은 조합이 완전히 최적이라는 뜻은 아니다.  
현재는 읽기 쉬운 추천 조합을 만드는 방식이다.

### 예시

필요 EXP가 540이라면:

- 최상급 10000은 0개
- 상급 2000은 0개
- 일반 500은 1개
- 초급 50은 마지막 보고서라서 남은 40 EXP를 채우기 위해 1개

결과적으로:

```text
일반 활동 보고서 1
초급 활동 보고서 1
```

정확한 최적해를 찾는 알고리즘은 아니다.  
현재는 간단한 추천값만 만든다.

## normalizeLevel()

```js
function normalizeLevel(value, maxLevel)
```

### 역할

```text
입력값을 숫자로 바꾸고,
1 이상 maxLevel 이하로 보정한다.
```

### 코드

```js
const numberValue = Number(value);

if (!Number.isFinite(numberValue)) {
  return 1;
}

return Math.min(maxLevel, Math.max(1, Math.trunc(numberValue)));
```

### 의미

- 숫자가 아니면 1로 처리한다
- 소수점은 버린다
- 최소 1, 최대 `maxLevel`로 제한한다

### 예시

```text
"10" -> 10
"10.8" -> 10
"abc" -> 1
0 -> 1
1000 -> maxLevel
```

## data/characterExpTable.js와의 관계

`characterExpTable`은 이런 구조다.

```js
{ level: 10, expToNext: 105, totalExp: 540 }
```

이 파일에서는 `expToNext`보다 `totalExp`를 더 중요하게 쓴다.

이유는 현재 레벨에서 목표 레벨까지의 차이를 계산할 때 누적 EXP 차이가 필요하기 때문이다.

즉 이 계산은:

```text
target.totalExp - current.totalExp
```

로 끝난다.

## data/activityReports.js와의 관계

`activityReports`는 이런 구조다.

```js
{
  id: "activity_report_t2",
  name: "상급 활동 보고서",
  tier: 2,
  exp: 2000,
}
```

이 파일에서는 다음 필드를 사용한다.

- `id` -> `materials.itemId`
- `name` -> `materials.itemName`
- `tier` -> `materials.tier`
- `exp` -> 보고서 조합 계산용

## materials 배열

반환값의 `materials`는 학생 상세 페이지에서 바로 카드로 바꿀 수 있게 만든 배열이다.

구조 예:

```js
[
  {
    itemId: "activity_report_t2",
    itemName: "상급 활동 보고서",
    tier: 2,
    quantity: 1,
    needsReview: false,
  },
  {
    itemId: "credit",
    itemName: "크레딧",
    tier: null,
    quantity: 3780,
    needsReview: false,
  },
]
```

이 구조는 `renderRequiredMaterials()`에서 다른 계산 결과와 합치기 편하게 되어 있다.

## 이 코드가 존재하는 이유

학생 상세 페이지에서 목표 레벨을 바꾸면 필요한 경험치와 재화를 바로 계산해야 한다.
현재 페이지에서는 현재 레벨을 1로 고정하고, 목표 레벨까지의 차이를 계산한다.

이 파일은 그 계산을 HTML과 분리해 둔 것이다.

이렇게 분리하면 좋은 점:

- 학생 상세 페이지 코드가 너무 길어지지 않는다
- 계산 로직을 다른 페이지에서도 재사용할 수 있다
- EXP 표나 활동 보고서 표만 바꿔도 계산 코드는 유지된다

## 수정할 때 주의할 점

- `CREDIT_PER_EXP`는 레벨업 계산의 기준이므로 함부로 바꾸지 않는 것이 좋다.
- `characterExpTable`의 `totalExp` 값이 틀리면 전체 계산이 틀어진다.
- `activityReports`의 `exp` 값이 바뀌면 추천 조합도 바뀐다.
- `normalizeLevel()`은 입력값을 보정하므로, UI에서 범위를 제한하더라도 마지막 방어선으로 남겨 두는 편이 안전하다.
- 현재 `calculateActivityReports()`는 최적 조합 탐색기가 아니라 단순 추천 로직이다.
