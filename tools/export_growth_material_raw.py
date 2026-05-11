import csv
import re
import time
from pathlib import Path
from urllib.parse import quote

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://bluearchive.wiki"

OUTPUT_PATH = Path("data/skill_material_raw.csv")
DEBUG_DIR = Path("data/debug_html")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
}


# 처음에는 테스트용으로 2명만 사용
CHARACTER_TITLES = [
    "Kurumi",
    "Niko",
]


# Kurumi처럼 ExtraPassive Skill이 있는 학생도 있어서 일단 raw CSV에 포함
# 필요 없으면 False로 바꾸면 됨
INCLUDE_EXTRA_PASSIVE = True


def make_student_id(title: str) -> str:
    return (
        title.strip()
        .lower()
        .replace(" ", "_")
        .replace("(", "")
        .replace(")", "")
    )


def make_page_url(title: str) -> str:
    page_title = title.strip().replace(" ", "_")
    return f"{BASE_URL}/wiki/{quote(page_title)}"


def clean_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def fetch_page_html(title: str) -> str:
    url = make_page_url(title)

    response = requests.get(url, headers=HEADERS, timeout=30)

    print()
    print(f"[접속] {title}")
    print(f"status_code: {response.status_code}")
    print(f"url: {response.url}")

    response.raise_for_status()

    html = response.text

    DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    debug_path = DEBUG_DIR / f"debug_{make_student_id(title)}.html"
    debug_path.write_text(html, encoding="utf-8")

    print(f"debug html 저장: {debug_path}")
    print(f"html 길이: {len(html)}")

    return html


def cell_to_text(cell) -> str:
    """
    셀 안의 텍스트 + 이미지 alt/title/src 정보를 같이 가져온다.
    재화 아이콘이 이미지로만 들어가는 경우를 대비한다.
    """
    parts = []

    for img in cell.find_all("img"):
        alt = img.get("alt")
        title = img.get("title")
        src = img.get("src") or img.get("data-src")

        if alt:
            parts.append(alt)
        elif title:
            parts.append(title)
        elif src:
            parts.append(src.split("/")[-1])

    text = cell.get_text(" ", strip=True)

    if text:
        parts.append(text)

    return clean_text(" | ".join(parts))


def table_to_search_text(table) -> str:
    """
    table.get_text()만 쓰면 이미지 정보가 빠질 수 있어서
    각 셀의 이미지 정보까지 포함해 검색용 텍스트를 만든다.
    """
    parts = []

    for cell in table.find_all(["th", "td"]):
        text = cell_to_text(cell)

        if text:
            parts.append(text)

    return clean_text(" ".join(parts))


def guess_skill_type_from_text(text: str) -> str:
    """
    table 텍스트를 보고 어떤 스킬 표인지 판단한다.
    """
    lower = clean_text(text).lower()

    # 표 설명 중간에 다른 스킬명이 섞일 수 있으므로 앞부분 위주로 판단
    prefix = lower[:400]

    if "weapon passive skill" in prefix:
        return "weaponPassive"

    if re.search(r"^extra\s*passive\s*skill\b|^extrapassive\s*skill\b", prefix):
        return "extraPassive"

    if re.search(r"^ex\s*skill\b", prefix):
        return "ex"

    if re.search(r"^normal\s*skill\b", prefix):
        return "normal"

    if re.search(r"^passive\s*skill\b", prefix):
        return "passive"

    if re.search(r"^sub\s*skill\b", prefix):
        return "sub"

    return "unknown"


def find_skill_tables(html: str):
    """
    페이지 전체 table 중에서 스킬 표를 직접 찾는다.

    네 디버그 출력 기준:
    - table 6: EX Skill
    - table 8: Normal Skill
    - table 9: Passive Skill
    - table 10: Sub Skill

    이런 식으로 전체 table 안에 이미 스킬 표가 있으므로,
    Growth Material 섹션을 찾지 않고 전체 table을 검사한다.
    """
    soup = BeautifulSoup(html, "lxml")

    skill_tables = []
    all_tables = soup.find_all("table")

    print()
    print(f"[전체 table 검사] table 개수: {len(all_tables)}")

    for original_table_index, table in enumerate(all_tables):
        search_text = table_to_search_text(table)
        skill_type = guess_skill_type_from_text(search_text)

        if skill_type == "unknown":
            continue

        # 무기 패시브는 지금 목표가 아니므로 제외
        if skill_type == "weaponPassive":
            continue

        # ExtraPassive를 raw에 포함할지 선택
        if skill_type == "extraPassive" and not INCLUDE_EXTRA_PASSIVE:
            continue

        preview = search_text[:220]
        print(
            f"스킬 표 후보 발견: "
            f"table {original_table_index}, "
            f"skillType={skill_type}, "
            f"preview={preview}"
        )

        skill_tables.append({
            "skillType": skill_type,
            "table": table,
            "originalTableIndex": original_table_index,
        })

    return skill_tables


def export_raw_csv():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "studentId",
                "studentName",
                "skillType",
                "tableIndex",
                "rowIndex",
                "colIndex",
                "cellText",
                "sourceUrl",
                "needsReview",
            ],
        )

        writer.writeheader()

        for title in CHARACTER_TITLES:
            student_id = make_student_id(title)
            source_url = make_page_url(title)

            print()
            print("=" * 80)
            print(f"수집 중: {title}")
            print("=" * 80)

            try:
                html = fetch_page_html(title)
                skill_tables = find_skill_tables(html)

                if not skill_tables:
                    writer.writerow({
                        "studentId": student_id,
                        "studentName": title,
                        "skillType": "",
                        "tableIndex": "",
                        "rowIndex": "",
                        "colIndex": "",
                        "cellText": "Skill tables not found",
                        "sourceUrl": source_url,
                        "needsReview": "true",
                    })

                    print("결과: Skill tables not found")
                    time.sleep(1)
                    continue

                for item in skill_tables:
                    skill_type = item["skillType"]
                    table = item["table"]
                    original_table_index = item["originalTableIndex"]

                    rows = table.find_all("tr")

                    for row_index, tr in enumerate(rows):
                        # 우선 직계 td/th만 가져옴
                        cells = tr.find_all(["th", "td"], recursive=False)

                        # 구조상 직계 셀이 안 잡히면 전체 셀로 재시도
                        if not cells:
                            cells = tr.find_all(["th", "td"])

                        for col_index, cell in enumerate(cells):
                            cell_text = cell_to_text(cell)

                            if not cell_text:
                                continue

                            writer.writerow({
                                "studentId": student_id,
                                "studentName": title,
                                "skillType": skill_type,
                                "tableIndex": original_table_index,
                                "rowIndex": row_index,
                                "colIndex": col_index,
                                "cellText": cell_text,
                                "sourceUrl": source_url,
                                "needsReview": "true",
                            })

                print(f"결과: skill table {len(skill_tables)}개 저장 완료")

                time.sleep(1)

            except Exception as e:
                writer.writerow({
                    "studentId": student_id,
                    "studentName": title,
                    "skillType": "",
                    "tableIndex": "",
                    "rowIndex": "",
                    "colIndex": "",
                    "cellText": f"ERROR: {e}",
                    "sourceUrl": source_url,
                    "needsReview": "true",
                })

                print(f"ERROR: {e}")

    print()
    print(f"완료: {OUTPUT_PATH}")


if __name__ == "__main__":
    export_raw_csv()