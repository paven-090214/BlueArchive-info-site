import csv
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

INPUT_PATH = PROJECT_ROOT / "data" / "skill_material_raw.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "skill_material_rows_preview.csv"


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다: {INPUT_PATH}")

    grouped = defaultdict(dict)
    meta = {}
    max_col_index = 0

    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        required_columns = {
            "studentId",
            "studentName",
            "skillType",
            "tableIndex",
            "rowIndex",
            "colIndex",
            "cellText",
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
            row_index = row["rowIndex"]
            col_index = row["colIndex"]

            if row_index == "" or col_index == "":
                continue

            try:
                col_number = int(col_index)
            except ValueError:
                continue

            key = (
                row["studentId"],
                row["studentName"],
                row["skillType"],
                row["tableIndex"],
                row["rowIndex"],
            )

            grouped[key][col_number] = row["cellText"]

            meta[key] = {
                "sourceUrl": row["sourceUrl"],
                "needsReview": row["needsReview"],
            }

            max_col_index = max(max_col_index, col_number)

    fieldnames = [
        "studentId",
        "studentName",
        "skillType",
        "tableIndex",
        "rowIndex",
    ]

    for i in range(max_col_index + 1):
        fieldnames.append(f"col{i}")

    fieldnames += [
        "sourceUrl",
        "needsReview",
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        sorted_keys = sorted(
            grouped.keys(),
            key=lambda x: (
                x[0],
                x[2],
                int(x[3]) if str(x[3]).isdigit() else 9999,
                int(x[4]) if str(x[4]).isdigit() else 9999,
            ),
        )

        for key in sorted_keys:
            student_id, student_name, skill_type, table_index, row_index = key

            out = {
                "studentId": student_id,
                "studentName": student_name,
                "skillType": skill_type,
                "tableIndex": table_index,
                "rowIndex": row_index,
                "sourceUrl": meta[key]["sourceUrl"],
                "needsReview": meta[key]["needsReview"],
            }

            for i in range(max_col_index + 1):
                out[f"col{i}"] = grouped[key].get(i, "")

            writer.writerow(out)

    print(f"완료: {OUTPUT_PATH}")
    print(f"절대 경로: {OUTPUT_PATH.resolve()}")


if __name__ == "__main__":
    main()