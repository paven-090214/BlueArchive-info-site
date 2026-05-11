import csv
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

REQUIREMENTS_PATH = PROJECT_ROOT / "data" / "skill_material_requirements.csv"
MAPPING_PATH = PROJECT_ROOT / "data" / "skill_items_mapping.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "skill_material_requirements_mapped.csv"


def load_mapping():
    mapping = {}

    if not MAPPING_PATH.exists():
        raise FileNotFoundError(f"매핑 파일이 없습니다: {MAPPING_PATH}")

    with MAPPING_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            current_item_id = row["currentItemId"]

            mapping[current_item_id] = {
                "finalItemId": row["finalItemId"],
                "koreanName": row["koreanName"],
                "category": row["category"],
                "tier": row["tier"],
                "itemNeedsReview": row["needsReview"],
            }

    return mapping


def main():
    if not REQUIREMENTS_PATH.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다: {REQUIREMENTS_PATH}")

    mapping = load_mapping()
    output_rows = []

    with REQUIREMENTS_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            old_item_id = row["itemId"]
            item_map = mapping.get(old_item_id)

            if item_map:
                row["itemId"] = item_map["finalItemId"] or old_item_id
                row["itemName"] = item_map["koreanName"] or row["itemName"]
                row["tier"] = item_map["tier"]

                # 재화 자체가 검수 필요하거나 기존 행이 검수 필요하면 true
                if item_map["itemNeedsReview"] == "true" or row["needsReview"] == "true":
                    row["needsReview"] = "true"
                else:
                    row["needsReview"] = "false"

            else:
                row["needsReview"] = "true"

            output_rows.append(row)

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