# 학생 레벨업 재화 계산 데이터

## 현재 상태

학생 레벨업 EXP 데이터는 `data/characterExpTable.js`를 사용한다.  
활동 보고서 데이터는 `data/activityReports.js`를 사용한다.

계산 함수:

```text
utils/characterLevelCalculator.js
```

## 계산 함수

```js
calculateCharacterLevelMaterials({
  currentLevel,
  targetLevel
})
```

반환값:

```js
{
  currentLevel,
  targetLevel,
  requiredExp,
  creditQuantity,
  reports,
  materials
}
```

## EXP 계산

필요 EXP는 `characterExpTable`의 `totalExp` 차이로 계산한다.

```js
target.totalExp - current.totalExp
```

목표 레벨이 현재 레벨보다 낮거나 같으면 필요 EXP는 `0`이다.

## 크레딧 계산

학생 레벨업에 필요한 크레딧은 다음 공식으로 계산한다.

```text
필요 크레딧 = 필요 EXP * 7
```

## 활동 보고서 계산

활동 보고서는 `data/activityReports.js`의 EXP 값을 사용한다.

현재 추천 수량은 높은 등급 활동 보고서부터 채우고, 마지막 초급 활동 보고서에서 부족 EXP를 올림 처리한다.

활동 보고서:

```text
초급 활동 보고서: 50 EXP
일반 활동 보고서: 500 EXP
상급 활동 보고서: 2,000 EXP
최상급 활동 보고서: 10,000 EXP
```

## 주의

- 활동 보고서 조합은 여러 방식이 가능하므로 현재 결과는 추천 조합이다.
- 크레딧은 실제 필요 EXP 기준으로 계산한다.
- 활동 보고서 초과 EXP가 있어도 초과분으로 크레딧을 추가 계산하지 않는다.
- 실제 DB는 연결하지 않는다.

## 현재 화면 연결

학생 상세 화면의 `목표 학생 레벨` 입력값을 `targetLevel`로 사용한다.

현재 기준 레벨은 임시로 1레벨을 사용한다.  
나중에 유저별 저장 기능이 생기면 저장된 학생 레벨을 `currentLevel`로 사용한다.
