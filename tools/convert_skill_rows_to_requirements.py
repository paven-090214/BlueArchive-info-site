import csv
import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

INPUT_PATH = PROJECT_ROOT / "data" / "skill_material_rows_preview.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "skill_material_requirements.csv"


VALID_SKILL_TYPES = {"ex", "normal", "passive", "sub"}


def clean_text(text: str) -> str:
    text = text or ""
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_quantity(value: str):
    """
    80k -> 80000
    3M -> 3000000
    10M -> 10000000
    5000 -> 5000
    """
    value = clean_text(value).replace(",", "")

    if not value:
        return None

    match = re.fullmatch(r"(\d+(?:\.\d+)?)([kKmM]?)", value)

    if not match:
        return None

    number = float(match.group(1))
    suffix = match.group(2).lower()

    if suffix == "k":
        number *= 1000
    elif suffix == "m":
        number *= 1000000

    return int(number)


def extract_trailing_quantities(text: str):
    """
    문장 맨 끝에 붙은 수량들을 뒤에서부터 찾는다.

    예:
    "... 12 14 80k" -> [12, 14, 80000]
    "... 12 18 9 19 10M" -> [12, 18, 9, 19, 10000000]
    """
    text = clean_text(text)
    tokens = text.split()

    quantities_reversed = []

    for token in reversed(tokens):
        token = token.strip().rstrip(".,;")

        quantity = parse_quantity(token)

        if quantity is None:
            break

        quantities_reversed.append(quantity)

    return list(reversed(quantities_reversed))


def normalize_item_id(item_name: str) -> str:
    """
    itemName을 임시 itemId로 변환한다.
    나중에 네 data/items.js의 id 규칙에 맞춰 바꿔도 됨.
    """
    name = clean_text(item_name)

    if name.lower() in {"credit", "credits"}:
        return "credit"

    name = name.lower()
    name = name.replace("blu-ray", "blu_ray")
    name = name.replace("'", "")
    name = re.sub(r"[^a-z0-9]+", "_", name)
    name = re.sub(r"_+", "_", name)
    name = name.strip("_")

    return name


def infer_tier(item_name: str):
    """
    영어 재화명에서 대략적인 티어를 추정한다.
    확실하지 않은 오파츠는 빈 값으로 둔다.
    """
    lower = item_name.lower()

    if "beginner" in lower:
        return 0

    if "normal" in lower:
        return 1

    if "advanced" in lower:
        return 2

    if "superior" in lower:
        return 3

    # 일부 오파츠 이름 패턴
    if "page" in lower:
        return 0

    if "damaged" in lower:
        return 1

    if "annotated" in lower:
        return 2

    if "intact" in lower:
        return 3

    return ""


def get_col_values(row):
    """
    col0, col1, col2 ... 순서대로 가져온다.
    """
    col_keys = []

    for key in row.keys():
        if re.fullmatch(r"col\d+", key or ""):
            col_keys.append(key)

    col_keys.sort(key=lambda x: int(x.replace("col", "")))

    return [row.get(key, "") for key in col_keys]


def parse_material_row(row):
    """
    preview CSV 한 줄을 최종 재화 요구량 여러 줄로 변환한다.
    """
    student_id = row["studentId"]
    student_name = row["studentName"]
    skill_type = row["skillType"]
    source_url = row["sourceUrl"]

    if skill_type not in VALID_SKILL_TYPES:
        return []

    cols = get_col_values(row)

    if not cols:
        return []

    level_text = clean_text(cols[0])

    if not level_text.isdigit():
        return []

    to_level = int(level_text)

    # Lv.1은 강화 재화가 없으므로 제외
    if to_level <= 1:
        return []

    from_level = to_level - 1

    # col1 이후를 합쳐서 재화/설명/수량 문자열로 사용
    material_cell_text = clean_text(" ".join([c for c in cols[1:] if clean_text(c)]))

    if not material_cell_text:
        return []

    quantities = extract_trailing_quantities(material_cell_text)

    if not quantities:
        return [{
            "studentId": student_id,
            "studentName": student_name,
            "skillType": skill_type,
            "fromLevel": from_level,
            "toLevel": to_level,
            "itemId": "",
            "itemName": "",
            "tier": "",
            "quantity": "",
            "sourceUrl": source_url,
            "needsReview": "true",
        }]

    # 재화 이름은 | 로 구분되어 앞쪽에 나열되어 있음
    parts = [clean_text(part) for part in material_cell_text.split("|")]
    parts = [part for part in parts if part]

    material_names = parts[:len(quantities)]

    outputs = []

    # 재화명 개수와 수량 개수가 다르면 일단 가능한 만큼만 저장하고 검수 표시
    needs_review = len(material_names) != len(quantities)

    for item_name, quantity in zip(material_names, quantities):
        outputs.append({
            "studentId": student_id,
            "studentName": student_name,
            "skillType": skill_type,
            "fromLevel": from_level,
            "toLevel": to_level,
            "itemId": normalize_item_id(item_name),
            "itemName": item_name,
            "tier": infer_tier(item_name),
            "quantity": quantity,
            "sourceUrl": source_url,
            "needsReview": "true" if needs_review else "false",
        })

    return outputs


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다: {INPUT_PATH}")

    output_rows = []

    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        required_columns = {
            "studentId",
            "studentName",
            "skillType",
            "tableIndex",
            "rowIndex",
            "sourceUrl",
            "needsReview",
        }

        missing = required_columns - set(reader.fieldnames or [])

        if missing:
            raise ValueError(
                f"CSV 컬럼이 예상과 다릅니다. 없는 컬럼: {missing}\n"
                f"현재 컬럼: {reader.fieldnames}"
            )

        for row in reader:
            output_rows.extend(parse_material_row(row))

    fieldnames = [
        "studentId",
        "studentName",
        "skillType",
        "fromLevel",
        "toLevel",
        "itemId",
        "itemName",
        "tier",
        "quantity",
        "sourceUrl",
        "needsReview",
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"완료: {OUTPUT_PATH}")
    print(f"절대 경로: {OUTPUT_PATH.resolve()}")
    print(f"저장된 행 수: {len(output_rows)}")


if __name__ == "__main__":
    main()