# TODO

## TODO 작성 규칙

- 작업 중 해결해야 할 일이 발견됐지만 현재 단계에서 처리하지 않을 경우 `## LATER`에 기록한다.
- 현재 단계에서 바로 처리할 작업은 `## NOW`에 기록한다.
- 완료한 항목은 체크 표시하고, 보류한 이유가 있으면 항목 아래에 짧게 남긴다.

## NOW

### todo.md의 장비 계산기 정리부터 보기


## LATER

### 스킬 재화 데이터 확장

- [ ] 다른 학원 스킬 요구량 데이터가 추가되면 BD / 기술 노트 itemId 규칙 확장
   - 계산 데이터 기준 ID는 `{school}_bd_t0~t3`, `{school}_note_t0~t3`를 사용한다.
   - 이미지 파일명은 `images/items/academy-materials/`의 원본 파일명을 유지한다.
   - `data/items.js`에서 itemId와 실제 imageUrl을 명시 매핑한다.

### 학생 이미지 데이터 정리

- [ ] `profileImageUrl` 제거 또는 null 전환 여부 재검토
   - 현재는 전환 중 호환성을 위해 `profileImageUrl`을 `portraitImageUrl`과 같은 경로로 유지
   - 모든 페이지가 `portraitImageUrl` / `iconImageUrl` 기준으로 안정화되면 제거 여부 결정
   - 제거 전 `profileImageUrl` 직접 참조 코드가 남아 있는지 확인

### 공통 헤더

 - [ ] 공통 헤더 검색 submit 처리를 `scripts/common.js`로 분리하기
    - 현재 `index.html`에만 검색 submit 처리 코드가 있음
    - 공통 헤더를 사용하는 모든 페이지에서 `common.js`를 불러오도록 정리
    - 검색 기능 완성 전까지는 `event.preventDefault()`로 기본 submit만 막고 `console.log()` 임시 처리
    - 나중에 검색 페이지 구현 시 `search.html?q=검색어` 이동으로 변경

###  html

- [ ] 메인 페이지 만들기
- [ ] 메인 페이지에 현재 픽업 영역 UI 만들기
- [ ] 메인 페이지에 현재 이벤트 영역 UI 만들기
- [ ] 학원 목록 페이지 만들기
- [ ] 동아리 목록 페이지 만들기
- [ ] 캐릭터 상세 페이지 만들기
- [ ] 학원 소개 영역을 academies 테이블의 name, logo_url, description과 연결하기
- [ ] 캐릭터 이름 검색
- [ ] 학생 이름 검색 기능 구현
- [ ] 검색어를 기준으로 캐릭터 목록 필터링
- [ ] 통합검색을 실제 DB 데이터와 연결하기
- [ ] 학생 스탯 placeholder 영역 만들기
- [ ] 전용무기 정보 placeholder 영역 만들기
- [ ] 애장품 존재 여부에 따른 표시 UI 만들기
- [ ] 필요 재화 영역에 장비 도면 placeholder 추가하기
- [ ] 필요 재화 영역에 애장품 선물 placeholder 추가하기

### 픽업 및 이벤트 정보 표시

- [ ] 진행 중인 이벤트 페이지 만들기
- [ ] 이벤트 카드 UI 만들기
- [ ] 구간 이동버튼 고정시키기

### 픽업 데이터 작업

- [ ] 픽업 기록 페이지에서 마지막 주차까지 표시 확인
- [ ] 페이지네이션이 데이터 기준으로 자동 생성되는지 확인

### 샘플 재화 계산

- [ ] 재화 목록 만들기
- [ ] 재화 전체 데이터 검수 및 보강
- [ ] `data/items.js`의 샘플 item 제거 또는 예제 데이터로 분리
- [ ] 오파츠 후보 데이터 검수 후 `data/items.js` 병합 여부 결정
- [ ] 학생별 성장 재화 실제 데이터 입력
- [x] 장비 티어업 요구량 데이터 만들기
- [ ] 전용무기 레벨 요구량 데이터 만들기
- [ ] 유저별 재화 수량 저장
- [x] 장비 티어업 재화 계산 연결하기
- [ ] 애장품 재화 계산 연결하기

### 장비 계산기 정리

- [ ] 케이 장비 착용 데이터 재확인
   - 현재 `data/student-equipment.js`의 케이는 `slot1: "hat"`, `slot2: "bag"`, `slot3: "watch"`로 입력되어 있다.
   - 로컬 참고 파일 `data/debug_html/debug_kei.html`에서는 `data-value="shoes"`, `data-value="hairpin"`, `data-value="watch"`로 보인다.
   - 어느 파일이 확정 출처인지 확인한 뒤 수정한다.
   - 출처가 불확실하면 추측해서 바꾸지 말고 `needsReview: true` 또는 `null`로 처리한다.
- [x] 장비 계산 파일 중복 정리
   - 최신 계산 로직은 `utils/equipmentCalculator.js`로 통합했다.
   - 루트의 `equipment-calculator.js`는 제거했다.
   - 학생 상세 장비 계산도 `utils/equipmentCalculator.js`를 사용한다.
- [x] 장비 데이터 파일 이름 규칙 정리
   - 장비 데이터는 kebab-case 파일명(`equipment-types.js`, `equipment-tier-up-costs.js` 등)을 사용한다.
   - `data/items.js`의 장비 설계도 병합은 `data/equipment-materials.js` 기준으로 정리했다.
   - 예전 중복 파일인 `equipmentBlueprintItems.js`, `equipmentTierRequirements.js`, `student-equipment-profiles.js`는 제거했다.
- [ ] 학생별 장비 데이터 검수
   - 현재 `data/student-equipment.js`에서 케이는 실제 장비가 입력되어 있지만 다른 학생은 `null` 상태다.
   - 다른 학생 장비는 추측하지 말고 실제 데이터 확보 후 `needsReview`를 갱신한다.
- [x] 장비 강화석 아이템을 `data/items.js` 재화 마스터에 연결
   - 강화석 4종을 `type: "equipment-enhancement"`로 `data/items.js`에 등록했다.
   - `images/items/equipment-enhancement-stones/`의 실제 이미지 경로를 연결했다.
   - 계산 결과의 강화석 itemId는 재화 마스터에서 이름, 이미지, type을 조회할 수 있다.
- [x] 장비 설계도 이미지와 이름 검수
   - `data/equipment-materials.js`의 설계도는 안정 ID, 표시명, 이미지 경로를 가진다.
   - 설계도 이미지는 `images/items/Equipment_Icon/`의 `_Piece` 파일명을 기준으로 연결했다.
   - 장비 완제품 아이콘과 설계도 이미지를 분리해서 관리한다.
   - 설계도 `_Piece` 이미지 81개는 파일 경로 검증까지 완료했다.
- [ ] 장비 계산 결과 검증 케이스 문서화
   - `NONE → T1`, `T3 LV1 → T6`, `T3 MAX → T6`, `T6 LV1 → T6`, `T6 MAX → T6`, `T6 MAX → T5` 케이스를 기준 테스트로 유지한다.
   - 가능하면 나중에 별도 테스트 파일이나 검증 스크립트로 분리한다.
- [ ] 장비 계산 데이터 누락 검증 추가
   - 현재 `calculateLevelCost()`는 레벨 비용 row가 일부 빠져도 존재하는 row만 합산한다.
   - 현재 `calculateTierUpCost()`는 승급 구간 데이터가 빠져도 해당 구간을 건너뛸 수 있다.
   - 데이터 누락이 과소 계산으로 이어지지 않도록 누락 구간을 `needsReview` 또는 `isValid: false`로 드러내는 방식을 정한다.
- [ ] 장비 레벨업 강화석 조합 정책 확정
   - 현재 계산은 필요 EXP 이상을 만족하면서 초과 EXP가 가장 적은 조합을 우선한다.
   - 실제 게임 UI나 사용자가 기대하는 조합이 “최상급 우선”인지 “초과 최소”인지 확인 후 정책을 확정한다.
- [x] 학생 상세 장비 UI 시각 점검
   - 현재 장비 UI는 기능 확인 중심이며 CSS 완성도가 낮을 수 있다.
   - 입력 컨트롤이 모바일에서 겹치지 않는지, 카드 간격과 텍스트 표시가 자연스러운지 확인한다.
- [x] 학생 상세 장비 UI 안내 문구 최신화
   - `character-detail.html`의 장비 안내 문구에서 “레벨업 EXP 재화는 추후 공통 테이블 연결 후 계산합니다.” 문구를 제거했다.
   - 현재는 장비 레벨업 EXP와 강화석 계산이 연결되어 있으므로 실제 동작에 맞게 문구를 수정한다.
- [x] 학생 상세 장비 아이콘 이미지 표시
   - `data/equipment-types.js`에는 `iconImageUrlsByTier`가 준비되어 있다.
   - 현재 학생 상세 장비 카드는 장비 이름 첫 글자 placeholder만 표시한다.
   - 현재/목표 티어 중 어떤 기준의 아이콘을 보여줄지 정한 뒤 이미지 표시로 연결한다.
- [x] 잘못된 장비 목표 입력 표시 방식 정리
   - 계산 함수는 `TARGET_BELOW_CURRENT`를 반환하지만, 학생 상세 UI에서 사용자에게 오류 상태를 어떻게 보여줄지 아직 확정하지 않았다.
   - 목표 티어 선택 제한 또는 경고 문구 중 하나로 정리한다.
   - 현재 `character-detail.html`은 `getEquipmentMaterialResult().materials`만 병합하므로 `isValid`와 `errorCode`가 사용자에게 보이지 않는다.
   - 잘못된 입력이 조용히 0 또는 일부 재화처럼 보이지 않도록 UI 표시를 추가한다.

## Backlog by Feature

### 로그인 기능

- [ ] 회원가입 페이지 만들기
- [ ] 로그인 페이지 만들기
- [ ] 로그아웃 기능 만들기

### 유저 저장 기능

- [ ] 유저별 보유 캐릭터 저장
- [ ] 캐릭터 레벨 저장
- [ ] 스킬 레벨 저장
- [ ] 인연 랭크 저장
