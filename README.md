# BlueArchive Info Site

블루아카이브 학생 정보와 성장 재화 계산을 한 곳에서 확인할 수 있도록 제작 중인 팬 사이트입니다.

현재는 정적 HTML, CSS, JavaScript 기반으로 개발하고 있으며, 이후 React 프론트엔드와 Spring Boot 백엔드로 확장할 수 있도록 구조를 정리하고 있습니다.

---

## 프로젝트 개요

이 프로젝트는 블루아카이브 학생 정보를 조회하고, 학생 성장에 필요한 재화를 계산할 수 있는 웹 사이트입니다.

학생 상세 페이지에서는 학생의 기본 정보, 스킬, 장비, 애장품, 전용무기, 능력개방 정보를 확인할 수 있으며, 사용자가 선택한 성장 조건에 따라 필요한 재화를 계산하는 기능을 목표로 합니다.

또한 픽업 기록, 학원별 학생 정보, 인연 계산기 등 블루아카이브 관련 정보를 편하게 확인할 수 있는 기능을 함께 제공합니다.

---

## 주요 기능

### 학생 목록 및 검색

- 전체 학생 목록 조회
- 학생 이름 검색
- 학원, 공격 타입, 방어 타입 등 학생 정보 표시
- 학생 카드 클릭 시 상세 페이지 이동
    
### 학생 상세 페이지

- 학생 기본 프로필 표시
- 공격 타입, 방어 타입, 포지션, 역할 표시
- 스킬 정보 표시
- 장비 정보 표시
- 애장품 정보 표시
- 전용무기 정보 표시
- 지역 적성 정보 표시

### 성장 재화 계산

- 학생 레벨
- 학생 성급
- 스킬 레벨
- 전용무기 성장
- 장비 티어
- 애장품 티어
- 능력개방

### 픽업 기록

- 과거 픽업 기록 조회
- 픽업 학생 정보 확인
- 주차별 픽업 데이터 관리

### 인연 계산기

- 학생 인연 성장에 필요한 정보를 계산
- 선물, 인연 경험치 등 관련 데이터 활용

---

## 현재 기술 스택

현재 프로젝트는 정적 웹 사이트 구조로 개발되고 있습니다.

```text
Frontend: HTML, CSS, JavaScript
Data: JavaScript, JSON, CSV
Structure: 정적 HTML 페이지 + 페이지별 JS
Deploy: 정적 웹 배포 가능 구조
```

---

## 향후 확장 계획

프로젝트가 안정화되면 다음 구조로 확장하는 것을 목표로 합니다.

```text
프론트: React + Vite
백엔드: Spring Boot
통신: REST API
DB: MyBatis + MySQL 또는 Oracle
인증: JWT + BCrypt
문서화: Swagger
배포: AWS EC2
```

향후 추가를 고려하는 기능은 다음과 같습니다.

- 로그인
- 유저별 보유 재화 관리
- 유저별 찜 목록
- 계산 설정 저장
- 리뷰 또는 댓글 기능
- 관리자용 데이터 갱신 기능

---

## 프로젝트 구조

현재 프로젝트는 정적 HTML 페이지와 JavaScript 파일을 중심으로 구성되어 있습니다.

```text
BlueArchive-info-site/
├─ index.html
├─ characters.html
├─ character-detail.html
├─ academy-detail.html
├─ pickup-history.html
├─ bond-calculator.html
│
├─ pages/
│  ├─ mainPage.js
│  ├─ characterDetailPage.js
│  └─ pickupHistoryPage.js
│
├─ utils/
│  ├─ characterLevelCalculator.js
│  ├─ skillMaterialCalculator.js
│  ├─ starRankCalculator.js
│  ├─ equipmentCalculator.js
│  ├─ exclusiveWeaponCalculator.js
│  └─ userInventoryStorage.js
│
├─ data/
│  ├─ growth/
│  ├─ schaledb/
│  ├─ items.js
│  └─ pickups.json
│
├─ scripts/
├─ styles.css
└─ README.md
```

---

## 구조 정리 방향

현재 프로젝트는 정적 HTML 기반이지만, 향후 React와 Spring Boot로 확장할 수 있도록 다음 방향으로 구조를 정리할 예정입니다.

```text
data
→ 정적 데이터, 성장 비용표, 오버라이드 데이터

services
→ 데이터 접근 계층
→ 현재는 로컬 데이터 사용
→ 나중에는 Spring Boot REST API 호출로 교체 가능

calculators
→ 성장 재화, 스킬, 전용무기, 장비, 애장품, 능력개방 계산

pages
→ 페이지별 화면 제어 로직

components
→ 반복되는 UI 생성 함수 또는 재사용 가능한 화면 단위

utils
→ formatting 등 범용 유틸
```

---

## 데이터 관리

- 학생 기본 정보
- 스킬 정보
- 장비 정보
- 애장품 정보
- 전용무기 정보
- 성장 비용표
- 아이템 정보
- 픽업 기록
- 인연 계산 데이터

---

## 계산기 구조

성장 재화 계산은 화면 로직과 분리하여 별도의 계산기 모듈로 관리하는 것을 목표로 합니다.

```text
calculators/
├─ characterLevelCalculator.js
├─ skillMaterialCalculator.js
├─ starRankCalculator.js
├─ equipmentCalculator.js
├─ exclusiveWeaponCalculator.js
├─ abilityUnlockCalculator.js
└─ neededMaterialsAggregator.js
```

---

## 개발 우선순위

현재 프로젝트의 개발 우선순위는 다음과 같습니다.

```text
1. 데이터 구조 안정화
2. 계산기 구조 분리
3. 학생 상세 페이지 안정화
4. 필요 재화 계산 통합
5. 학생 목록 및 검색 개선
6. 픽업 기록 정리
7. 인연 계산기 개선
8. React 전환 준비
9. Spring Boot 백엔드 확장
```

---

## 실행 방법

```bash
python -m http.server 8000
```

---

## 주의 사항

이 프로젝트는 블루아카이브 팬 사이트이며, 공식 서비스가 아닙니다.

본 프로젝트는 개인 학습 및 정보 정리 목적의 비공식 프로젝트입니다.

---

## 작성 목적

이 README는 프로젝트의 목적, 현재 구조, 주요 기능, 향후 확장 방향을 설명하기 위해 작성되었습니다.

특히 현재 프로젝트는 정적 사이트에서 출발하지만, 이후 React와 Spring Boot 기반의 확장 가능한 구조로 발전시키는 것을 목표로 합니다.
