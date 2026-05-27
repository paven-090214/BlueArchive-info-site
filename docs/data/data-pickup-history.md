# 픽업 기록 데이터

## 목적

픽업 기록 데이터의 최종 저장 파일과 후보 데이터 처리 규칙을 정리한다.

픽업 기록 화면의 UI 배치와 페이지네이션은 `docs/ui/ui-pickup-history.md`를 따른다.

## 최종 데이터

최종 픽업 기록 데이터는 다음 파일을 사용한다.

```text
data/pickups.json
```

픽업 기록 페이지는 이 파일을 읽어서 주차별 픽업 캐릭터를 표시한다.

## 후보 추출 스크립트

픽업 후보 데이터는 다음 스크립트로 HTML source 파일에서 추출한다.

```text
scripts/extract-pickup-candidates.js
```

기본 입력과 출력:

```text
sources/arca-pickup-1-111.html
data/pickup-candidates.json
```

다른 source 또는 출력 파일을 사용할 때는 스크립트 인자로 지정한다.

```bash
node scripts/extract-pickup-candidates.js sources/arca-pickup-112-177.html data/pickup-candidates-112-177.json
```

후보 파일은 검수용 중간 데이터다. 최종 UI에서 사용하는 데이터로 승격하기 전에는 날짜, 주차, 캐릭터 매핑, 픽업 유형을 확인한다.

## 학생 ID 매핑

후보 추출 스크립트는 `data/students.js`를 읽어서 학생 이름을 안정 ID로 매핑한다.

source HTML에는 캐릭터 표시 이름만 있으므로 이름 기반 매핑은 후보 생성 단계에서만 허용한다. 후보 output에는 검수와 최종 안정 연결을 위해 `characterId`와 `characterSlug`를 함께 기록한다.

매핑 가능한 캐릭터는 다음 값을 가진다.

```js
{
  name: "아루",
  characterId: 3,
  characterSlug: "aru",
  imageUrl: null,
  type: "기존",
  needsReview: false
}
```

필드 의미:

- `name`: source에서 추출한 표시 이름
- `characterId`: `data/students.js`의 숫자 `id`
- `characterSlug`: `data/students.js`의 `slug`
- `imageUrl`: 픽업 이미지 경로, 확정 전에는 `null`
- `type`: 픽업 유형
- `needsReview`: 해당 캐릭터 row의 검수 필요 여부

학생 이름이 `data/students.js`에 없으면 `characterId`와 `characterSlug`는 `null`로 둔다.

```js
{
  name: "미확정 학생",
  characterId: null,
  characterSlug: null,
  imageUrl: null,
  type: "신규",
  needsReview: true
}
```

이름만으로 추측해서 새로운 ID를 만들지 않는다.

## 캐릭터별 needsReview

픽업 후보 데이터는 일정 row 전체의 `needsReview`와 캐릭터별 `needsReview`를 구분한다.

캐릭터별 `needsReview`는 다음 경우 `true`로 둔다.

- source 이름을 `data/students.js`의 학생과 매핑하지 못한 경우
- 같은 표시 이름이 어떤 학생 또는 버전 학생을 뜻하는지 확실하지 않은 경우
- 이미지, 타입, 배포 여부 등 캐릭터 단위 정보 검수가 필요한 경우

일정 row의 `needsReview`는 다음 중 하나라도 있으면 `true`로 둔다.

- 날짜 또는 주차 파싱에 실패한 경우
- 픽업 유형이 없는 캐릭터가 있는 경우
- `needsReview: true`인 픽업 캐릭터가 있는 경우
- `needsReview: true`인 배포 캐릭터가 있는 경우

## 배포 캐릭터

배포 캐릭터는 `characters`가 아니라 `distributions`에 저장한다.

```js
{
  distributions: [
    {
      name: "노도카",
      characterId: null,
      characterSlug: null,
      imageUrl: null,
      type: "배포",
      needsReview: true
    }
  ]
}
```

배포 캐릭터도 가능한 경우 `data/students.js` 기준으로 `characterId`와 `characterSlug`를 채운다.

중복 제거는 안정 ID가 있으면 `characterId` 기준으로 하고, 안정 ID가 없으면 표시 이름 기준으로만 임시 처리한다. 표시 이름 기준 중복 제거는 검수 대상이다.

## 처리 원칙

- 최종 관계 연결에는 표시 이름이 아니라 `characterId` 또는 `characterSlug`를 사용한다.
- source에 있는 이름은 표시와 검수 참고용으로 유지할 수 있다.
- 학생 매핑이 불확실하면 `null`과 `needsReview: true`를 사용한다.
- source HTML과 candidate JSON은 중간 산출물이며, 최종 데이터로 사용하기 전에 검수한다.
- distribution 캐릭터는 기본 픽업 목록 UI에 표시하지 않는다.
