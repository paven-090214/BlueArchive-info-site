# student-detail.html

## 계산 함수:

```text
utils/characterLevelCalculator.js
utils/skillMaterialCalculator.js
utils/starRankCalculator.js
```

## 계산 함수가 내부에서 사용하는 데이터:

```text
data/characterExpTable.js
data/activityReports.js
data/skillMaterialRequirements.js
data/starRankRequirements.js
```

## renderStudentDetail(student)

```js
Object.entries(fieldValues).forEach(([field, value]) => {
const target = document.querySelector(`[data-student-field="${field}"]`);

  if (target) {
    target.textContent = value;
  }
});
```

1. 객체를 배열로 변경한다.
2. data-student-field 는 dd, span요소를 가르키며 키를 준다.
3. 키가 존재하면 값을 주며 각 키에 맞는 value가 들어간다.
4. 배열을 반복

