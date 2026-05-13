# 학생 상세 재화 계산 흐름

## 목적

이 문서는 `character-detail.html`의 재화 계산이 어떻게 동작하는지 설명한다.

현재 계산 대상:

- 학생 레벨업
- 스킬 강화
- 성급 및 전용무기 성급

아직 계산하지 않는 대상:

- 장비 티어업
- 애장품
- 전용무기 레벨업
- 유저 보유 재화 차감

## 관련 파일

화면:

```text
character-detail.html
styles.css
```

계산 함수:

```text
utils/characterLevelCalculator.js
utils/skillMaterialCalculator.js
utils/starRankCalculator.js
```

데이터:

```text
data/students.js
data/characterExpTable.js
data/activityReports.js
data/skillMaterialRequirements.js
data/starRankRequirements.js
```

## 전체 흐름

```text
character-detail.html?id=kei 접속
  -> URL의 id 값을 읽음
  -> data/students.js에서 id가 "kei"인 학생을 찾음
  -> 학생 기본 정보를 화면에 표시
  -> 목표 레벨, 목표 성급, 스킬 현재/목표 레벨 입력 UI 준비
  -> renderRequiredMaterials() 실행
  -> 세 계산 함수 실행
  -> itemId 기준으로 결과 합산
  -> 필요한 재화 영역에 카드로 표시
```

## 학생 선택 흐름

`character-detail.html`은 URL query string에서 학생 ID를 읽는다.

예:

```text
character-detail.html?id=kei
```

코드 흐름:

```js
const characterIdParam = new URLSearchParams(window.location.search).get("id");
const characterId = Number.isNaN(Number(characterIdParam))
  ? characterIdParam
  : Number(characterIdParam);

const selectedStudent =
  students.find((student) => student.id === characterId) ||
  students.find((student) => student.id === 3) ||
  students[0];
```

숫자 ID 학생도 찾고, `"kei"` 같은 문자열 ID 학생도 찾기 위한 구조다.

## 현재값과 목표값

현재 구현은 유저 저장 기능이 없으므로 일부 현재값은 임시 기준을 사용한다.

| 항목 | 현재값 | 목표값 |
| --- | --- | --- |
| 학생 레벨 | 임시로 1 | 화면의 목표 학생 레벨 입력 |
| 기본 성급 | `students.js`의 `baseStar` | 별 UI에서 선택한 기본 성급 |
| 전용무기 성급 | 임시로 0 | 별 UI에서 선택한 전용무기 성급 |
| 스킬 레벨 | 스킬 카드의 현재 레벨 select | 스킬 카드의 목표 레벨 select |

나중에 유저 저장 기능이 생기면 현재값은 저장된 유저 상태에서 가져와야 한다.

## 레벨업 계산

함수:

```js
calculateCharacterLevelMaterials({
  currentLevel,
  targetLevel
})
```

데이터:

```text
data/characterExpTable.js
data/activityReports.js
```

계산:

```text
필요 EXP = 목표 레벨 누적 EXP - 현재 레벨 누적 EXP
필요 크레딧 = 필요 EXP * 7
```

활동 보고서는 높은 등급부터 추천 수량을 계산한다.

예:

```text
Lv.1 -> Lv.10
필요 EXP: 540
필요 크레딧: 3,780
추천 보고서: 일반 1개, 초급 1개
```

## 스킬 재화 계산

함수:

```js
calculateSkillMaterials({
  studentId,
  skillType,
  currentLevel,
  targetLevel
})
```

데이터:

```text
data/skillMaterialRequirements.js
```

필터 조건:

```js
row.studentId === studentId
row.skillType === skillType
row.fromLevel >= currentLevel
row.toLevel <= targetLevel
```

스킬 타입:

| 화면 | skillType | 레벨 범위 |
| --- | --- | --- |
| EX 스킬 | `ex` | 1~5 |
| 1스킬 | `normal` | 1~10 |
| 2스킬 | `passive` | 1~10 |
| 3스킬 | `sub` | 1~10 |

Kei 외 학생처럼 스킬 데이터가 없으면 스킬 재화는 표시하지 않고 안내 문구를 표시한다.

```text
스킬 재화 데이터가 아직 없습니다.
```

## 성급/전용무기 성급 계산

함수:

```js
calculateStarRankEleph({
  currentBaseStar,
  currentWeaponStar,
  targetBaseStar,
  targetWeaponStar
})
```

데이터:

```text
data/starRankRequirements.js
```

공통 규칙:

```text
1성 -> 2성: 30
2성 -> 3성: 80
3성 -> 4성: 100
4성 -> 5성: 120
5성 -> 전용무기 1성: 0
전용무기 1성 -> 전용무기 2성: 120
전용무기 2성 -> 전용무기 3성: 180
전용무기 3성 -> 전용무기 4성: 200
```

현재 학생별 엘레프 itemId가 안정 데이터로 없으므로 임시로 다음 ID를 사용한다.

```js
`${selectedStudent.id}-eleph`
```

예:

```text
kei-eleph
```

그래서 화면에는 `케이의 엘레프`가 `검수 필요`로 표시된다.

## 결과 합산

`renderRequiredMaterials()`가 세 계산 결과를 합친다.

중요 규칙:

- `itemId`가 같으면 수량을 합산한다.
- 하나라도 `needsReview: true`이면 최종 카드도 `검수 필요`로 표시한다.
- 크레딧은 여러 계산에서 나오므로 `credit` 하나로 합산된다.

예:

```text
레벨업 크레딧 + 스킬 강화 크레딧 = 크레딧 카드 1개
```

## 화면 표시

결과는 `.material-list` 안에 `.material-card`로 표시한다.

카드 구성:

```text
[아이콘] 재화 이름 [검수 필요]
       필요 수량 N
```

아이콘 이미지는 아직 실제 재화 이미지를 쓰지 않고, 이름에 따라 간단한 글자 placeholder를 표시한다.

예:

```text
크레딧 -> C
BD -> BD
활동 보고서 -> EXP
기술 노트 -> 노
엘레프 -> 엘
```

## 직접 고칠 때 자주 보는 곳

목표 레벨 입력 UI:

```text
character-detail.html
studentLevelInput
studentLevelRange
syncStudentLevel()
```

스킬 현재/목표 레벨 UI:

```text
setupSkillMaterialControls()
getSkillMaterialResults()
```

성급 별 UI:

```text
createGrowthStarButton()
renderGrowthStars()
renderWeaponStarDisplay()
```

결과 합산과 표시:

```text
renderRequiredMaterials()
mergeMaterials()
createMaterialCard()
```

## 다음에 개선할 부분

- 학생별 엘레프 stable itemId를 별도 데이터로 만들기
- 재화 이미지 연결하기
- 현재값을 유저 저장 데이터에서 가져오기
- 장비 티어업 재화 계산 추가
- 애장품 재화 계산 추가
- 계산 로직을 inline script에서 별도 JS 파일로 분리하기
