# 프로젝트 이해 가이드

## 이 문서의 목적

이 문서는 `BlueArchive-info-site`를 직접 수정할 때 전체 구조를 빠르게 이해하기 위한 시작점이다.

코드를 전부 외우는 대신 다음 질문에 답할 수 있게 정리한다.

- 어떤 HTML이 어떤 화면인가?
- 데이터는 어디에 있는가?
- 화면은 데이터를 어떻게 가져오는가?
- 재화 계산은 어떤 파일들이 담당하는가?
- 새 기능을 추가할 때 어디부터 봐야 하는가?

## 프로젝트 성격

이 프로젝트는 정적 사이트다.

- 백엔드 없음
- DB 연결 없음
- 로그인 저장 기능 없음
- `data/` 폴더의 JS/JSON 파일을 임시 DB처럼 사용
- 브라우저의 ES module import로 데이터와 계산 함수를 불러옴

로컬 실행:

```bash
python -m http.server 8000
```

접속:

```text
http://127.0.0.1:8000/index.html
```

`file://`로 열면 module import가 깨질 수 있으므로 사용하지 않는다.

## 먼저 읽을 문서 순서

처음 볼 때는 아래 순서가 가장 이해하기 쉽다.

1. `docs/project-understanding-guide.md`
2. `docs/data-and-file-map.md`
3. `docs/character-material-calculation-flow.md`
4. `docs/ui-character.md`
5. `docs/data-resource-calculator.md`

특정 기능을 고칠 때는 관련 문서만 보면 된다.

## 화면 파일

주요 HTML 파일:

```text
index.html
characters.html
character-detail.html
academy-detail.html
pickup-history.html
bond-calculator.html
```

현재 가장 중요한 화면은 `character-detail.html`이다.  
학생 상세 정보와 성장 재화 계산 UI가 이 파일 안에 있다.

## 공통 데이터 흐름

대부분의 화면은 다음 방식으로 동작한다.

```text
HTML 로드
  -> <script type="module">
  -> data/*.js import
  -> DOM 요소 선택
  -> 데이터로 화면 렌더링
  -> input/select/button 이벤트 등록
  -> 값이 바뀌면 다시 렌더링
```

예:

```js
import { academies, students } from "./data/index.js";
```

`data/index.js`는 여러 데이터 파일을 한 번에 가져오기 위한 re-export 파일이다.

## 중요한 규칙

### 학생 연결

학생은 이름으로 연결하지 않는다.

좋은 예:

```js
studentId: "kei"
```

나쁜 예:

```js
studentName: "케이"
```

이름은 표시용이고, 연결은 ID로 한다.

### 재화 연결

재화는 `itemId` 기준으로 합산한다.

예:

```js
itemId: "credit"
```

같은 `itemId`가 여러 계산에서 나오면 하나로 더한다.

### 검수 필요 표시

`needsReview: true`인 데이터도 계산에는 포함한다.  
대신 화면에서 `검수 필요` 표시를 유지한다.

## 현재 구현된 재화 계산

학생 상세 화면에서 다음 항목을 계산한다.

- 학생 레벨업 활동 보고서
- 학생 레벨업 크레딧
- 스킬 강화 재화
- 성급 및 전용무기 성급 엘레프

계산 결과는 `character-detail.html`의 `필요한 재화` 영역에 표시된다.

관련 계산 함수:

```text
utils/characterLevelCalculator.js
utils/skillMaterialCalculator.js
utils/starRankCalculator.js
```

자세한 흐름은 `docs/character-material-calculation-flow.md`를 본다.

## 아직 구현되지 않은 것

- 장비 티어업 재화 계산
- 애장품 재화 계산
- 학생별 엘레프 stable itemId
- 유저별 보유 재화 저장
- 유저별 현재 학생 상태 저장
- DB 연결

## 수정할 때 기준

작게 고치고 확인한다.

예:

- 화면 문구 수정: HTML 또는 CSS만 확인
- 데이터 값 수정: `data/*.js`만 확인
- 계산식 수정: `utils/*.js`와 관련 데이터 문서 확인
- 재화 계산 UI 수정: `character-detail.html`, `styles.css`, 관련 docs 확인

관련 없는 파일은 같이 수정하지 않는다.
