import csv
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

INPUT_PATH = PROJECT_ROOT / "data" / "skill_material_requirements.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "skill_items_unique.csv"


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다: {INPUT_PATH}")

    items = {}

    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            item_name = row["itemName"]
            item_id = row["itemId"]

            if not item_name:
                continue

            key = item_name

            if key not in items:
                items[key] = {
                    "itemName": item_name,
                    "currentItemId": item_id,
                    "tier": row["tier"],
                    "appearCount": 0,
                    "totalQuantity": 0,
                    "sampleStudentId": row["studentId"],
                    "sampleSkillType": row["skillType"],
                    "finalItemId": "",
                    "koreanName": "",
                    "category": "",
                    "needsReview": "true",
                }

            items[key]["appearCount"] += 1

            try:
                items[key]["totalQuantity"] += int(row["quantity"])
            except ValueError:
                pass

    fieldnames = [
        "itemName",
        "currentItemId",
        "finalItemId",
        "koreanName",
        "category",
        "tier",
        "appearCount",
        "totalQuantity",
        "sampleStudentId",
        "sampleSkillType",
        "needsReview",
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for item_name in sorted(items.keys()):
            writer.writerow(items[item_name])

    print(f"완료: {OUTPUT_PATH}")
    print(f"절대 경로: {OUTPUT_PATH.resolve()}")
    print(f"재화 종류 수: {len(items)}")


if __name__ == "__main__":
    main()