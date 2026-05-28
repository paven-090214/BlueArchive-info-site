# 학생 상세 재화 계산 흐름

## 목적

이 문서는 `character-detail.html`의 재화 계산이 어떻게 동작하는지 설명한다.

현재 계산 대상:

- 학생 레벨업
- 스킬 강화
- 성급 및 전용무기 성급
- 전용무기 레벨업

아직 계산하지 않는 대상:

- 장비 티어업
- 애장품
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
utils/exclusiveWeaponCalculator.js
```

데이터:

```text
data/students.js
data/characterExpTable.js
data/activityReports.js
data/skillMaterialRequirements.js
data/starRankRequirements.js
data/growth/exclusiveWeaponLevelCosts.js
data/growth/exclusiveWeaponEnhancementItems.js
```

## 전체 흐름

```text
character-detail.html?slug=kei 접속
  -> URL의 slug 값을 읽음
  -> data/students.js에서 slug가 "kei"인 학생을 찾음
  -> 이후 계산 데이터 연결에는 학생의 숫자 id를 사용
  -> 학생 기본 정보를 화면에 표시
  -> 목표 레벨, 목표 성급, 스킬 현재/목표 레벨 입력 UI 준비
  -> renderRequiredMaterials() 실행
  -> 세 계산 함수 실행
  -> itemId 기준으로 결과 합산
  -> 필요한 재화 영역에 카드로 표시
```

## 학생 선택 흐름

`character-detail.html`은 URL query string에서 학생 slug를 읽는다.

예:

```text
character-detail.html?slug=kei
```

URL은 공유와 접근성을 위해 slug를 사용하고, 내부 계산 데이터 연결은 `students.js`의 숫자 `id`를 우선 사용한다.

## 현재값과 목표값

현재 구현은 유저 저장 기능이 없으므로 일부 현재값은 임시 기준을 사용한다.

| 항목 | 현재값 | 목표값 |
| --- | --- | --- |
| 학생 레벨 | 임시로 1 | 화면의 목표 학생 레벨 입력 |
| 기본 성급 | `students.js`의 `baseStar` | 별 UI에서 선택한 기본 성급 |
| 전용무기 레벨 | 임시로 1 | 목표 전용무기 성급에 따른 최대 레벨 |
| 스킬 레벨 | 스킬 카드의 현재 레벨 select | 스킬 카드의 목표 레벨 select |

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

`data/skillMaterialRequirements.js`의 `studentId`는 `students.js`의 숫자 `id`와 연결한다.
오파츠 재화의 `itemId`는 `data/ooparts-candidates.js`의 안정 ID를 사용한다.
예: `artifact-phaistos-tier1`, `artifact-rocket-tier3`

필터 조건:

```js
row.studentId === studentId
row.skillType === skillType
row.fromLevel >= currentLevel
row.toLevel <= targetLevel
```

스킬 타입:

| 화면 | skillType | 현재 레벨 | 목표 범위 |
| --- | --- | --- |------------|-------|
| EX 스킬 | `ex` |     1~5     | 1~5 |
| 1스킬 | `normal` |    1~10    | 1~10 |
| 2스킬 | `passive` |    1~10    | 1~10 |
| 3스킬 | `sub`     |     1~10    | 1~10 |

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
전용무기 1성 -> 전용무기 2성: 120, 크레딧 : 1,000,000
전용무기 2성 -> 전용무기 3성: 180, 크레딧 : 1,500,000
전용무기 3성 -> 전용무기 4성: 200, 크레딧 : 2,000,000
```

학생별 엘레프 itemId는 다음 형식을 우선 사용한다.

```js
`${selectedStudent.slug}-eleph`
```

예:

```text
kei-eleph
```

학생별 엘레프 item은 `data/items.js`에 등록하고, `imageUrl`은 실제 엘레프 이미지 파일 경로를 명시적으로 연결한다.
이미지 파일명이 학생 이름이 아니라 `CH0064.png` 또는 `Item_Icon_SecretStone_Maki.png` 같은 형식이어도 파일명으로 학생을 추측하지 않는다.
확실하지 않은 매핑은 `imageUrl: null`, `needsReview: true`로 둔다.
학생 상세 화면은 성급 계산 결과의 엘레프 `itemId`로 `data/items.js`를 조회해 이름, 이미지, 검수 상태를 표시한다.

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

## 전용무기 레벨업 계산

함수:

```js
calculateExclusiveWeaponMaterials({
  weaponType,
  targetWeaponStar
})
```

데이터:

```text
data/growth/exclusiveWeaponLevelCosts.js
data/growth/exclusiveWeaponEnhancementItems.js
```

현재 전용무기 레벨은 별도 저장 UI가 없으므로 Lv.1로 고정한다.
목표 전용무기 성급이 없으면 전용무기 레벨업 재화는 계산하지 않는다.

목표 전용무기 성급별 목표 레벨:

| 목표 전용무기 성급 | 목표 레벨 |
| --- | --- |
| 1성 | Lv.30 |
| 2성 | Lv.40 |
| 3성 | Lv.50 |
| 4성 | Lv.60 |

예를 들어 목표가 전용무기 1성이면 Lv.1 -> Lv.30까지 계산한다.
계산은 레벨 비용 데이터에서 `1 -> 2`부터 `29 -> 30`까지의 행을 합산한다.

전용무기 강화 재료 계산:

- 학생의 `weaponType`이 `bonusWeaponTypes`에 포함된 전용 파츠만 사용한다.
- 이번 단계에서는 비로그인 기준이므로 공이는 계산하지 않는다.
- 재료 사용 순서는 `tierOrder` 역순이다.
- 표시 순서와 계산 순서는 티타늄 -> 크로뮴 -> 온전한 -> 녹슨이다.
- 각 재료의 EXP는 `baseExp * bonusMultiplier`의 effective EXP를 사용한다.
- 필요한 EXP를 초과하면 초과분은 `overExp`로 남긴다.

전용무기 강화 재료 안정 ID:

```text
weapon-part-spring-tier1 ~ weapon-part-spring-tier4
weapon-part-hammer-tier1 ~ weapon-part-hammer-tier4
weapon-part-barrel-tier1 ~ weapon-part-barrel-tier4
```

로그인 유저의 보유 공이 우선 사용과 보유 재화 차감 계산은 이후 단계에서 구현한다.

## 화면 표시

결과는 `.material-list` 안에 `.material-card`로 표시한다.

카드 구성:

```text
[아이콘] 재화 이름 [검수 필요]
       필요 수량 N
```

재화 이름, 이미지, 검수 상태는 `itemId`로 `data/items.js`를 먼저 조회한다.
계산 결과에 남아 있는 `itemName` 또는 `imageUrl`은 아직 마스터에 없는 데이터의 fallback으로만 사용한다.
오파츠 후보처럼 아직 `data/items.js`에 병합하지 않은 재화는 `data/ooparts-candidates.js`를 fallback으로 조회한다.
이미지가 없는 재화는 이름에 따라 간단한 글자 placeholder를 표시한다.

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
- 학생별 엘레프 이미지를 `data/items.js` item과 명시적으로 연결하기
- 재화 이미지 연결하기
- 장비 티어업 재화 계산 추가
- 애장품 재화 계산 추가
- 계산 로직을 inline script에서 별도 JS 파일로 분리하기
