import csv
import json
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

INPUT_PATH = PROJECT_ROOT / "data" / "skill_material_requirements_mapped.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "skillMaterialRequirements.js"


def to_bool(value: str) -> bool:
    return str(value).strip().lower() == "true"


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다: {INPUT_PATH}")

    grouped = defaultdict(list)
    group_meta = {}

    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            key = (
                row["studentId"],
                row["skillType"],
                int(row["fromLevel"]),
                int(row["toLevel"]),
            )

            material = {
                "itemId": row["itemId"],
                "itemName": row["itemName"],
                "tier": int(row["tier"]) if row["tier"] != "" else None,
                "quantity": int(row["quantity"]),
                "needsReview": to_bool(row["needsReview"]),
            }

            grouped[key].append(material)

            group_meta[key] = {
                "studentId": row["studentId"],
                "studentName": row["studentName"],
                "skillType": row["skillType"],
                "fromLevel": int(row["fromLevel"]),
                "toLevel": int(row["toLevel"]),
                "sourceUrl": row["sourceUrl"],
            }

    output = []

    for key in sorted(grouped.keys(), key=lambda x: (x[0], x[1], x[2], x[3])):
        meta = group_meta[key]
        materials = grouped[key]

        output.append({
            "studentId": meta["studentId"],
            "studentName": meta["studentName"],
            "skillType": meta["skillType"],
            "fromLevel": meta["fromLevel"],
            "toLevel": meta["toLevel"],
            "materials": materials,
            "sourceUrl": meta["sourceUrl"],
            "needsReview": any(m["needsReview"] for m in materials),
        })

    js = (
        "export const skillMaterialRequirements = "
        + json.dumps(output, ensure_ascii=False, indent=2)
        + ";\n"
    )

    OUTPUT_PATH.write_text(js, encoding="utf-8")

    print(f"완료: {OUTPUT_PATH}")
    print(f"절대 경로: {OUTPUT_PATH.resolve()}")
    print(f"저장된 구간 수: {len(output)}")


if __name__ == "__main__":
    main()