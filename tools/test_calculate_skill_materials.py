import csv
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

INPUT_PATH = PROJECT_ROOT / "data" / "skill_material_requirements_mapped.csv"


def load_requirements():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다: {INPUT_PATH}")

    rows = []

    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            rows.append(row)

    return rows


def calculate_materials(rows, student_id, skill_type, current_level, target_level):
    """
    예:
    current_level=1, target_level=5
    포함 구간:
    1→2
    2→3
    3→4
    4→5
    """
    result = {}

    for row in rows:
        if row["studentId"] != student_id:
            continue

        if row["skillType"] != skill_type:
            continue

        from_level = int(row["fromLevel"])
        to_level = int(row["toLevel"])

        if from_level < current_level:
            continue

        if to_level > target_level:
            continue

        item_id = row["itemId"]
        item_name = row["itemName"]
        quantity = int(row["quantity"])
        needs_review = row["needsReview"]

        if item_id not in result:
            result[item_id] = {
                "itemId": item_id,
                "itemName": item_name,
                "quantity": 0,
                "needsReview": False,
            }

        result[item_id]["quantity"] += quantity

        if needs_review == "true":
            result[item_id]["needsReview"] = True

    return result


def merge_results(*results):
    merged = {}

    for result in results:
        for item_id, item in result.items():
            if item_id not in merged:
                merged[item_id] = {
                    "itemId": item["itemId"],
                    "itemName": item["itemName"],
                    "quantity": 0,
                    "needsReview": False,
                }

            merged[item_id]["quantity"] += item["quantity"]

            if item["needsReview"]:
                merged[item_id]["needsReview"] = True

    return merged


def print_result(title, result):
    print()
    print("=" * 80)
    print(title)
    print("=" * 80)

    if not result:
        print("계산 결과 없음")
        return

    for item in sorted(result.values(), key=lambda x: x["itemId"]):
        review_mark = " ⚠ 검수필요" if item["needsReview"] else ""
        print(f"{item['itemName']} ({item['itemId']}): {item['quantity']}{review_mark}")


def main():
    rows = load_requirements()

    student_id = "kei"

    ex = calculate_materials(rows, student_id, "ex", 1, 5)
    normal = calculate_materials(rows, student_id, "normal", 1, 10)
    passive = calculate_materials(rows, student_id, "passive", 1, 10)
    sub = calculate_materials(rows, student_id, "sub", 1, 10)

    all_max = merge_results(ex, normal, passive, sub)

    print_result("Kei EX 1 → 5", ex)
    print_result("Kei Normal 1 → 10", normal)
    print_result("Kei Passive 1 → 10", passive)
    print_result("Kei Sub 1 → 10", sub)
    print_result("Kei 전체 스킬 MAX", all_max)


if __name__ == "__main__":
    main()