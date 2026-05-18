# 장비 계산 데이터

## 목적

이 문서는 학생 장비 계산에 사용할 장비 종류와 슬롯 규칙을 정리한다.

장비 표시명은 화면 출력용으로 사용하고, 계산 및 학생 데이터 연결에는 안정적인 `equipmentTypeId`를 사용한다.

## 장비 종류

| equipmentTypeId | 표시명 |
| --- | --- |
| `hat` | 모자 |
| `gloves` | 장갑 |
| `shoes` | 신발 |
| `bag` | 가방 |
| `badge` | 배지 |
| `hairpin` | 헤어핀 |
| `charm` | 부적 |
| `necklace` | 목걸이 |
| `watch` | 손목시계 |

장비 완제품 아이콘은 `data/equipment-types.js`의 `iconImageUrlsByTier`에 티어별로 저장한다.

파일이 확인된 티어만 이미지 경로를 넣고, 없는 티어는 `null`로 둔다.

이미지 매핑 우선순위:

```text
1. ./images/items/Equipment_Icon/Equipment_Icon_{Type}_Tier{tier}.png
2. ./images/items/Equipment_Icon/81px-Equipment_Icon_{Type}_Tier{tier}.png
3. null
```

`_Piece` 파일은 장비 설계도 이미지이므로 장비 완제품 아이콘에 사용하지 않는다.

## 장비 슬롯 규칙

각 학생은 장비 슬롯 3개를 가진다.

각 슬롯에는 아래 장비 종류 중 하나가 들어간다.

| slotId | 슬롯 표시명 | 가능한 장비 종류 |
| --- | --- | --- |
| `slot1` | 1번 장비 칸 | 모자, 장갑, 신발 |
| `slot2` | 2번 장비 칸 | 가방, 배지, 헤어핀 |
| `slot3` | 3번 장비 칸 | 부적, 목걸이, 손목시계 |

## 학생 장비 연결 규칙

- 학생별 장비는 표시명이 아니라 `equipmentTypeId`로 연결한다.
- 학생 한 명은 `slot1`, `slot2`, `slot3`에 각각 하나의 장비 종류를 가진다.
- 확실하지 않은 학생 장비 값은 추측하지 않고 `null` 또는 `needsReview: true`로 표시한다.

예시:

```js
{
  studentSlug: "kei",
  slot1: "hat",
  slot2: "bag",
  slot3: "watch",
  needsReview: true,
}
```

## 티어 규칙

- 사용자는 각 장비 슬롯의 티어를 독립적으로 선택한다.
- 장비 티어는 T1부터 T10까지 존재한다.
- 미착용에서 T1 장착은 승급 재화와 크레딧을 소모하지 않는다.
- T1에서 T2로 승급할 때부터 승급 재화와 크레딧을 소모한다.
- 다음 티어로 승급하려면 현재 티어의 최대 레벨까지 올려야 한다.
- 승급 후 장비 레벨은 Lv.1로 초기화된다.
- 계산 입력은 1레벨 단위가 아니라 현재 티어, 현재 상태, 목표 티어를 사용한다.
- 현재 상태는 `LV1` 또는 `MAX`를 사용한다.
- 목표 티어는 항상 해당 티어의 MAX 상태를 의미한다.
- 장비 티어별 스탯 증가량과 재화 요구량은 별도 데이터로 연결한다.
- 티어별 요구량이 불확실하면 `needsReview: true`를 사용한다.

## 티어별 최대 레벨

| 티어 | 최대 레벨 |
| --- | ---: |
| T1 | 10 |
| T2 | 20 |
| T3 | 30 |
| T4 | 40 |
| T5 | 45 |
| T6 | 50 |
| T7 | 55 |
| T8 | 60 |
| T9 | 65 |
| T10 | 70 |

## 장비 승급 비용

| 승급 | 필요 설계도 | 크레딧 | 승급 후 최대 레벨 |
| --- | --- | ---: | ---: |
| T1 → T2 | 2T 설계도 15 | 1,500 | 20 |
| T2 → T3 | 3T 설계도 20 | 10,000 | 30 |
| T3 → T4 | 2T 설계도 10, 4T 설계도 30 | 25,000 | 40 |
| T4 → T5 | 2T 설계도 15, 3T 설계도 20, 5T 설계도 35 | 50,000 | 45 |
| T5 → T6 | 3T 설계도 5, 4T 설계도 15, 6T 설계도 40 | 75,000 | 50 |
| T6 → T7 | 4T 설계도 5, 5T 설계도 15, 7T 설계도 40 | 100,000 | 55 |
| T7 → T8 | 5T 설계도 5, 6T 설계도 15, 8T 설계도 40 | 125,000 | 60 |
| T8 → T9 | 6T 설계도 10, 7T 설계도 15, 9T 설계도 50 | 150,000 | 65 |
| T9 → T10 | 7T 설계도 10, 8T 설계도 20, 10T 설계도 60 | 175,000 | 70 |

## 데이터 파일

장비 계산 데이터는 다음 파일로 분리한다.

```text
data/equipment-types.js
data/equipment-tier-max-levels.js
data/equipment-tier-up-costs.js
data/equipment-level-costs.js
data/equipment-enhancement-items.js
data/equipment-materials.js
data/student-equipment.js
utils/equipmentCalculator.js
utils/materialStorage.js
```

역할:

- `data/equipment-types.js`: 장비 9종과 슬롯별 허용 장비 목록
- `data/equipment-tier-max-levels.js`: 티어별 최대 레벨
- `data/equipment-tier-up-costs.js`: 장비 승급 비용
- `data/equipment-level-costs.js`: 장비 레벨업 EXP/크레딧
- `data/equipment-enhancement-items.js`: 장비 레벨업에 사용하는 강화석 EXP
- `data/equipment-materials.js`: 장비 설계도 재화 ID와 표시명
- `data/student-equipment.js`: 학생 slug별 장비 슬롯 연결 데이터
- `utils/equipmentCalculator.js`: DOM과 저장소에 의존하지 않는 순수 계산 함수
- `utils/materialStorage.js`: 유저 보유 재화 localStorage 조회 계층

## 장비 설계도 itemId 규칙

장비 설계도는 장비 종류와 티어를 모두 포함한 안정 ID를 사용한다.

```text
equipment-{equipmentTypeId}-blueprint-t{tier}
```

예:

```text
equipment-hat-blueprint-t2
equipment-gloves-blueprint-t4
equipment-watch-blueprint-t10
```

장비 설계도는 `data/items.js`에서 `type: "equipment-blueprint"`로 조회한다.

장비 설계도 이미지는 `_Piece` 파일을 사용한다.

이미지 매핑 우선순위:

```text
1. ./images/items/Equipment_Icon/Equipment_Icon_{Type}_Tier{tier}_Piece.png
2. ./images/items/Equipment_Icon/81px-Equipment_Icon_{Type}_Tier{tier}_Piece.png
3. null
```

확인된 설계도 이미지는 `data/equipment-materials.js`의 `imageUrl`에 연결한다.

## 계산 결과와 보유량 분리

- 장비 필요 재화 계산 함수는 필요한 재화만 계산한다.
- 유저 보유 재화는 계산 함수 내부에서 직접 조회하지 않는다.
- 유저 보유 재화 저장은 `{ itemId, quantity }` 형태만 사용한다.
- 현재는 `localStorage`를 사용하지만, 나중에 DB 저장으로 바꿀 수 있도록 저장 로직은 `utils/materialStorage.js`에 분리한다.
- 화면에서는 필요 수량, 보유 수량, 부족 수량을 구분해서 표시한다.
