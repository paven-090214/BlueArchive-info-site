# 스킬 강화 재화 계산 데이터

## 현재 상태

- 스킬 강화 요구량 데이터는 `data/skillMaterialRequirements.js`에 있다.
- 이 파일은 ES module 형식으로 `skillMaterialRequirements`를 export한다.
- 현재 데이터는 Kei 한 명만 있어도 된다.
- 실제 DB는 연결하지 않는다.
- `data/` 파일을 임시 DB처럼 사용한다.

## 요구량 데이터 구조

```js
{
  studentId: "kei",
  studentName: "Kei",
  skillType: "ex",
  fromLevel: 1,
  toLevel: 2,
  materials: [
    {
      itemId: "credit",
      itemName: "크레딧",
      tier: null,
      quantity: 80000,
      needsReview: false
    }
  ],
  sourceUrl: "https://bluearchive.wiki/wiki/Kei",
  needsReview: false
}
```

## 연결 규칙

- 학생 연결은 반드시 `studentId` 기준으로 한다.
- 이름 기준으로 학생을 연결하지 않는다.
- `data/students.js`의 Kei 학생 ID는 `"kei"`여야 한다.
- `data/skillMaterialRequirements.js`의 Kei 요구량도 `studentId: "kei"`를 사용한다.

## 계산 함수

파일:

```text
utils/skillMaterialCalculator.js
```

함수:

```js
calculateSkillMaterials({
  studentId,
  skillType,
  currentLevel,
  targetLevel
})
```

## 계산 규칙

요구량 row는 다음 조건으로 선택한다.

```js
row.studentId === studentId
row.skillType === skillType
row.fromLevel >= currentLevel
row.toLevel <= targetLevel
```

합산 규칙:

- 재화는 `itemId` 기준으로 합산한다.
- 같은 `itemId`의 `quantity`를 더한다.
- 같은 `itemId` 중 하나라도 `needsReview: true`이면 최종 결과도 `needsReview: true`로 한다.
- `needsReview: true` 재화도 계산에는 포함한다.

## 스킬 레벨 범위

- EX: 1~5
- Normal: 1~10
- Passive: 1~10
- Sub: 1~10

## 데이터가 없는 학생

- 요구량 데이터가 없는 학생도 상세 페이지는 정상 표시되어야 한다.
- 요구량 데이터가 없으면 계산 결과 영역에 `스킬 재화 데이터가 아직 없습니다.`를 표시한다.
- 레벨업 재화와 성급 재화는 공통 규칙을 사용하므로 스킬 재화 데이터가 없는 학생도 해당 항목은 계산한다.

## 현재 화면 연결

학생 상세 화면:

```text
character-detail.html
```

동작:

- 선택된 학생의 `id`를 `studentId`로 사용한다.
- 스킬별 현재 레벨과 목표 레벨을 계산 입력으로 사용한다.
- 계산 결과는 레벨업 재화, 성급 재화와 함께 `필요한 재화` 영역에 합산 표시한다.

## 아직 하지 않는 것

- DB 연결
- 유저 보유 재화 저장
- 유저별 스킬 레벨 저장
- 이름 기준 데이터 매칭
- raw/source 파일을 직접 계산에 사용
