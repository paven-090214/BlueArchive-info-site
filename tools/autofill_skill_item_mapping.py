import csv
import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]

INPUT_PATH = PROJECT_ROOT / "data" / "skill_items_unique.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "skill_items_mapping.csv"


SCHOOL_ID_MAP = {
    "Abydos": "abydos",
    "Arius": "arius",
    "Gehenna": "gehenna",
    "Highlander": "highlander",
    "Hyakkiyako": "hyakkiyako",
    "Millennium": "millennium",
    "Red Winter": "red_winter",
    "SRT": "srt",
    "Shanhaijing": "shanhaijing",
    "Trinity": "trinity",
    "Valkyrie": "valkyrie",
    "Wild Hunt": "wildhunt",
}


SCHOOL_KO_MAP = {
    "Abydos": "아비도스",
    "Arius": "아리우스",
    "Gehenna": "게헨나",
    "Highlander": "하이랜더",
    "Hyakkiyako": "백귀야행",
    "Millennium": "밀레니엄",
    "Red Winter": "붉은겨울",
    "SRT": "SRT",
    "Shanhaijing": "산해경",
    "Trinity": "트리니티",
    "Valkyrie": "발키리",
    "Wild Hunt": "와일드헌트",
}


TIER_WORD_MAP = {
    "Beginner": (0, "초급"),
    "Normal": (1, "일반"),
    "Advanced": (2, "상급"),
    "Superior": (3, "최상급"),
}


def clean_text(text: str) -> str:
    text = text or ""
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_id(text: str) -> str:
    text = clean_text(text).lower()
    text = text.replace("blu-ray", "blu_ray")
    text = text.replace("'", "")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text)
    return text.strip("_")


def extract_school_name(item_name: str):
    match = re.search(r"\(([^)]+)\)", item_name)

    if not match:
        return None

    return match.group(1).strip()


def infer_tier_from_name(item_name: str):
    for word, (tier, ko_grade) in TIER_WORD_MAP.items():
        if item_name.startswith(word + " "):
            return tier, ko_grade

    # 오파츠 쪽에서 자주 나오는 표현들
    lower = item_name.lower()

    if lower.startswith("broken "):
        return 0, ""
    if lower.startswith("damaged "):
        return 1, ""
    if lower.startswith("annotated "):
        return 2, ""
    if lower.startswith("intact "):
        return 3, ""

    return "", ""


def fill_mapping(row):
    item_name = clean_text(row["itemName"])
    current_item_id = clean_text(row["currentItemId"])
    tier, ko_grade = infer_tier_from_name(item_name)

    final_item_id = ""
    korean_name = ""
    category = ""
    needs_review = "true"

    lower = item_name.lower()

    # 크레딧
    if lower in {"credit", "credits"}:
        final_item_id = "credit"
        korean_name = "크레딧"
        category = "currency"
        tier = ""
        needs_review = "false"

    # 비의서 / Secret Tech Sheet
    elif "secret tech sheet" in lower or "secret tech" in lower:
        final_item_id = "secret_tech_sheet"
        korean_name = "비의서"
        category = "skill_book"
        tier = ""
        needs_review = "false"

    # 전술교육 BD
    elif "tactical training blu-ray" in lower:
        school_name = extract_school_name(item_name)
        school_id = SCHOOL_ID_MAP.get(school_name)
        school_ko = SCHOOL_KO_MAP.get(school_name)

        if school_id and school_ko and tier != "":
            final_item_id = f"{school_id}_bd_t{tier}"
            korean_name = f"{school_ko} {ko_grade} 전술교육 BD"
            category = "bd"
            needs_review = "false"
        else:
            final_item_id = current_item_id
            korean_name = item_name
            category = "bd"
            needs_review = "true"

    # 기술 노트
    elif "tech notes" in lower or "tech note" in lower:
        school_name = extract_school_name(item_name)
        school_id = SCHOOL_ID_MAP.get(school_name)
        school_ko = SCHOOL_KO_MAP.get(school_name)

        if school_id and school_ko and tier != "":
            final_item_id = f"{school_id}_note_t{tier}"
            korean_name = f"{school_ko} {ko_grade} 기술 노트"
            category = "note"
            needs_review = "false"
        else:
            final_item_id = current_item_id
            korean_name = item_name
            category = "note"
            needs_review = "true"

    # 나머지는 오파츠로 처리
    else:
        final_item_id = current_item_id
        korean_name = item_name
        category = "oopart"

        # 오파츠는 이름 규칙이 다양하므로 일단 검수 필요로 둔다.
        needs_review = "true"

    row["finalItemId"] = final_item_id
    row["koreanName"] = korean_name
    row["category"] = category
    row["tier"] = tier
    row["needsReview"] = needs_review

    return row


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"입력 파일이 없습니다: {INPUT_PATH}")

    with INPUT_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = [fill_mapping(row) for row in reader]
        fieldnames = reader.fieldnames

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"완료: {OUTPUT_PATH}")
    print(f"절대 경로: {OUTPUT_PATH.resolve()}")
    print(f"재화 종류 수: {len(rows)}")


if __name__ == "__main__":
    main()