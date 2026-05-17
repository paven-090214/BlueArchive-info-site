# 성급 및 전용무기 성급 재화 계산 데이터

## 현재 상태

성급과 전용무기 성급 상승에 필요한 엘레프 수량은 모든 학생이 같은 공통 규칙을 사용한다.

파일:

```text
data/starRankRequirements.js
```

계산 함수:

```text
utils/starRankCalculator.js
```

## 공통 요구량

```text
1성 -> 2성: 30개
2성 -> 3성: 80개
3성 -> 4성: 100개
4성 -> 5성: 120개
5성 -> 전용무기 1성: 0개
전용무기 1성 -> 전용무기 2성: 120개
전용무기 2성 -> 전용무기 3성: 180개
전용무기 3성 -> 전용무기 4성: 200개
```

## 데이터 구조

```js
{
  fromRank: "base-1",
  toRank: "base-2",
  label: "1성 -> 2성",
  elephQuantity: 30
}
```

## Rank ID

기본 성급:

```text
base-1
base-2
base-3
base-4
base-5
```

전용무기 성급:

```text
weapon-1
weapon-2
weapon-3
weapon-4
```

전용무기 1성 개방은 엘레프를 소모하지 않는다.

## 계산 함수

```js
calculateStarRankEleph({
  currentBaseStar,
  currentWeaponStar,
  targetBaseStar,
  targetWeaponStar
})
```

반환값:

```js
{
  currentRank,
  targetRank,
  elephQuantity,
  transitions
}
```

## 주의

- 이 계산은 필요한 엘레프 수량만 반환한다.
- 학생별 엘레프 `itemId`는 `{studentSlug}-eleph` 형식을 우선 사용한다.
- 학생별 엘레프 item은 `data/items.js`에 등록하고, 성급 계산 결과는 해당 `itemId`로 표시한다.
- 학생 상세 화면은 성급 계산 결과를 렌더링할 때 학생 `slug`로 엘레프 `itemId`를 만들고 `data/items.js`에서 표시 정보를 조회한다.
- 엘레프 이미지는 학생 이름으로 파일명을 추측하지 않고, 실제 이미지 파일명을 `imageUrl`에 명시적으로 연결한다.
- 이름 기준으로 학생 엘레프를 연결하지 않는다.
- 유저 보유 재화 저장은 이미지 경로가 아니라 `itemId` 기준으로 한다.
- 현재 학생 상세 화면의 전용무기 별 UI는 `weapon-1`, `weapon-2`, `weapon-3`, `weapon-4`와 표시 규칙을 맞춘다.
