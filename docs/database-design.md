# 데이터베이스 설계

## 현재 개발 목표

현재 1차 목표는 로그인 기능 없이 캐릭터 정보를 화면에 표시하는 것이다.

따라서 이번 단계에서는 유저 정보, 로그인 정보, 유저별 재화 저장, 유저별 캐릭터 육성 상태 저장 기능은 구현하지 않는다.

1차 목표에서 필요한 핵심 데이터는 다음과 같다.

- 학원 정보
- 동아리 정보
- 캐릭터 정보

---

# 1차 DB 설계

## 1. academies 테이블

게임 내 학원 정보를 저장하는 테이블이다.

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| id | INT | 학원 고유 번호 |
| name | VARCHAR(100) | 학원 이름 |
| logo_url | VARCHAR(255) | 학원 로고 이미지 경로 |
| description | TEXT | 학원 설명 |

### 예시 데이터

| id | name | description |
|---|---|---|
| 1 | 게헨나 학원 | 자유로운 분위기의 학원 |
| 2 | 트리니티 종합학원 | 전통과 질서를 중시하는 학원 |
| 3 | 밀레니엄 사이언스 스쿨 | 과학과 기술 중심의 학원 |

---

## 2. clubs 테이블

각 학원에 소속된 동아리 정보를 저장하는 테이블이다.

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| id | INT | 동아리 고유 번호 |
| academy_id | INT | 소속 학원 번호 |
| name | VARCHAR(100) | 동아리 이름 |
| description | TEXT | 동아리 설명 |

### 관계

- 하나의 학원은 여러 동아리를 가질 수 있다.
- 하나의 동아리는 하나의 학원에 소속된다.
- `clubs.academy_id`는 `academies.id`를 참조한다.

### 예시 데이터

| id | academy_id | name |
|---|---:|---|
| 1 | 1 | 흥신소 68 |
| 2 | 2 | 보충수업부 |
| 3 | 3 | 게임개발부 |

---

## 3. characters 테이블

캐릭터 정보를 저장하는 테이블이다.

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| id | INT | 캐릭터 고유 번호 |
| academy_id | INT | 소속 학원 번호 |
| club_id | INT | 소속 동아리 번호 |
| name | VARCHAR(100) | 캐릭터 이름 |
| base_rarity | INT | 기본 성급 |
| role | VARCHAR(50) | 캐릭터 역할 |
| attack_type | VARCHAR(50) | 공격 타입 |
| defense_type | VARCHAR(50) | 방어 타입 |
| position | VARCHAR(50) | 포지션 |
| weapon_name | VARCHAR(100) | 무기 이름 |
| weapon_type | VARCHAR(50) | 무기 종류 |
| terrain_urban | VARCHAR(10) | 시가지 적성 |
| terrain_outdoor | VARCHAR(10) | 야외 적성 |
| terrain_indoor | VARCHAR(10) | 실내 적성 |
| uses_cover | BOOLEAN | 엄폐 사용 여부 |
| release_date | DATE | 캐릭터 출시일 |
| image_url | VARCHAR(255) | 캐릭터 이미지 경로 |
| weapon_image_url | VARCHAR(255) | 무기 이미지 경로 |
| description | TEXT | 캐릭터 설명 |

### 관계

- 하나의 학원은 여러 캐릭터를 가질 수 있다.
- 하나의 동아리는 여러 캐릭터를 가질 수 있다.
- 하나의 캐릭터는 하나의 학원에 소속된다.
- 하나의 캐릭터는 하나의 동아리에 소속된다.
- `characters.academy_id`는 `academies.id`를 참조한다.
- `characters.club_id`는 `clubs.id`를 참조한다.

### 예시 데이터

| id | name | academy_id | club_id | role |
|---|---|---:|---:|---|
| 1 | 아루 | 1 | 1 | 딜러 |
| 2 | 히후미 | 2 | 2 | 서포터 |
| 3 | 아리스 | 3 | 3 | 딜러 |

---

# 1차 ERD 관계 정리

## 학원과 동아리

```text
academies 1 ─── N clubs
```

## 4. pickup_banners 테이블

픽업 배너 정보를 저장하는 테이블이다.

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| id | INT | 픽업 배너 고유 번호 |
| banner_name | VARCHAR(100) | 픽업 배너 이름 |
| start_date | DATE | 픽업 시작일 |
| end_date | DATE | 픽업 종료일 |
| server_region | VARCHAR(50) | 서버 구분 |
| pickup_type | VARCHAR(50) | 픽업 종류 |
| image_url | VARCHAR(255) | 배너 이미지 경로 |
| description | TEXT | 배너 설명 |