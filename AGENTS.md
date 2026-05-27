# AGENTS.md

## 공통 규칙

- 불필요한 파일 구조 변경 금지
- 기존 기능을 깨지 않도록 최소 수정
- 코드 수정 전 반드시 관련 파일을 먼저 읽고 계획 수립
- 수정 후 변경 파일 목록과 이유를 요약
- 가능하면 브라우저 동작 기준으로 최종 확인

## 역할 분담

### Planner
- 코드를 수정하지 않고 구조 분석과 작업 계획만 작성

### Implementer
- Planner의 계획을 바탕으로 최소 범위로 코드 수정

### Reviewer
- 코드를 수정하지 않고 버그, 누락, 위험한 변경 검토

### Final Checker
- 최종 diff, 실행 방법, 남은 위험 요소 확인

## Project Overview

This is a static Blue Archive information site.

Current stack:
- HTML
- CSS
- JavaScript
- Static data files in `data/`
- Utility calculators in `utils/`

There is no backend and no database connection yet.  
Files in `data/` act as temporary data storage.

Run locally from the project root:

```bash
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/index.html
```

Do not use `file://`.

---

## Core Rule

Only modify files related to the user request.

Do not make unrelated refactors.  
Do not rewrite working code unless necessary.  
Do not invent game data.  
Unknown values must be `null`, placeholder text, or `needsReview: true`.

---

## Read Before Editing

Before editing, read only the documents related to the requested task.

Docs are organized by purpose:
- `docs/overview/`: project overview, roadmap, broad requirements
- `docs/specs/`: feature behavior and functional rules
- `docs/ui/`: layout, visual structure, component states, responsive UI rules
- `docs/data/`: data shape, calculation data, source/processing rules
- `docs/code-guide/`: code reading notes and file-level explanations

Common docs:
- `docs/overview/project-overview.md`
- `docs/overview/project-roadmap.md`
- `docs/overview/requirements.md`
- `docs/specs/todo.md`
- `docs/ui/ui-common.md`

Feature docs:
- Bond calculator:
  - `docs/specs/spec-bond-calculator.md`
  - `docs/ui/ui-bond-calculator.md`
- Character list/detail:
  - `docs/ui/ui-chracter.md`
  - `docs/specs/spec-chracter-detail.md`
  - `docs/ui/ui-chracter-detail.md`
- Academies:
  - `docs/ui/ui-academies.md`
- Main page:
  - `docs/ui/ui-main.md`
- Pickup history:
  - `docs/ui/ui-pickup-history.md`
- Growth/material calculators:
  - `docs/data/data-resource-calculator.md`
  - `docs/data/data-character-level-calculator.md`
  - `docs/data/data-star-rank-calculator.md`
  - `docs/data/character-material-calculation-flow.md`

Do not read every document unless needed.

---

## Important Files

Main pages:
- `index.html`
- `academy-detail.html`
- `characters.html`
- `character-detail.html`
- `pickup-history.html`
- `bond-calculator.html`

Main scripts:
- `bond-calculator.js`
- `styles.css`

Utility scripts:
- `utils/characterLevelCalculator.js`
- `utils/skillMaterialCalculator.js`
- `utils/starRankCalculator.js`

Main data:
- `data/index.js`
- `data/academies.js`
- `data/clubs.js`
- `data/students.js`
- `data/bond-calculator-students.js`
- `data/pickups.json`
- `data/pickups.js`
- `data/gifts.js`
- `data/character-gift-preferences.js`
- `data/bond-rank-requirements.js`
- `data/bond-point-sources.js`
- `data/items.js`
- `data/ooparts-candidates.js`
- `data/student-growth-profiles.js`
- `data/characterExpTable.js`
- `data/activityReports.js`
- `data/skillMaterialRequirements.js`
- `data/starRankRequirements.js`
- `data/student-terrain-adaptations.js`

Images:
- `images/academies/`
- `images/maps/`
- `images/gifts/`
- `images/characters/`

Raw/source files:
- `sources/`
- `scripts/`
- `tools/`
- `data/raw/rawItems.js`
- CSV files in `data/`

Do not modify raw/source files unless explicitly asked.

---

## Documentation Rules

When UI or data structure changes, update the related document.

Keep document responsibilities separated:
- Functional behavior and calculation rules belong in `docs/specs/`.
- Layout, visual states, component placement, and responsive behavior belong in `docs/ui/`.
- Data structures, source data, ID mapping, and calculation data belong in `docs/data/`.
- Code reading notes belong in `docs/code-guide/`.
- Remaining work belongs in `docs/specs/todo.md`.

Examples:
- Main page UI changes -> `docs/ui/ui-main.md`
- Character list UI changes -> `docs/ui/ui-chracter.md`
- Character detail behavior changes -> `docs/specs/spec-chracter-detail.md`
- Character detail UI changes -> `docs/ui/ui-chracter-detail.md`
- Bond calculator behavior changes -> `docs/specs/spec-bond-calculator.md`
- Bond calculator UI changes -> `docs/ui/ui-bond-calculator.md`
- Growth/material data changes -> related file in `docs/data/`
- Pickup history UI changes -> `docs/ui/ui-pickup-history.md`
- Remaining work -> `docs/specs/todo.md`
- DB design changes -> only if explicitly requested

Do not put new feature specifications or data rules into UI documents just because the screen uses them. Add or update the matching `docs/specs/` or `docs/data/` document instead.

Do not create new PRD/spec documents unless the user asks.

---

## Data Rules

Use stable IDs for relationships.

Good:

```js
{ characterId: "noa", giftId: "gift-01" }
```

Bad:

```js
{ characterName: "노아", giftName: "레이스 베개" }
```

Names are for display.  
IDs are for connections and future DB migration.

Do not connect data by display name if an ID exists.

---

## Raw Data Rules

`data/raw/rawItems.js` is raw source data.

It is not final calculation data.  
Do not use it directly for calculator logic unless the user explicitly asks.  
If raw data is needed for calculation, first transform it into a stable data file under `data/`.

Example:
- raw source → `data/raw/rawItems.js`
- processed data → `data/items.js` or another stable data file

---

## Image Rules

Use predictable image paths.

Academy logos:

```text
./images/academies/{academy-slug}-logo.webp
```

Academy maps:

```text
./images/maps/{academy-slug}-map.webp
```

Gift images:

```text
./images/gifts/{gift-id}.webp
```

Example:

```js
{
  id: "gift-01",
  name: "레이스 베개",
  imageUrl: "./images/gifts/gift-01.webp"
}
```

If an image is missing or fails to load, show a placeholder.

Do not just rename `.png` or `.jpg` files to `.webp`.  
The actual file format must match the extension.

---

## Pickup Rules

Final pickup archive data:

```text
data/pickups.json
```

The pickup history page should read from this file.

Candidate files may remain:
- `data/pickup-candidates.json`
- `data/pickup-candidates-112-177.json`
- `data/pickup-candidates-178-245.json`

Rules:
- Sort by week number.
- If `weekLabel` is like `221~222주차`, sort by the first number.
- Do not guess missing data.
- Use `needsReview: true` for uncertain data.
- Distribution characters belong in `distributions`.
- Distribution characters are not shown by default in pickup archive UI.

---

## Bond Calculator Rules

For detailed bond calculator rules, read:

```text
docs/specs/spec-bond-calculator.md
docs/ui/ui-bond-calculator.md
```

Only keep the core rules here:

- Use student name search, not a huge select list.
- `노아` and `노아(파자마)` are different characters.
- They do not share bond data or gift preferences.
- Rank range is 1 to 100.
- Rank EXP data comes from `data/bond-rank-requirements.js`.
- Gift data comes from `data/gifts.js`.
- Gift preferences come from `data/character-gift-preferences.js`.
- Preferred gift view must only show gifts explicitly registered for the selected character.
- Do not treat high EXP gifts as preferred automatically.
- Do not treat `fixedPoint` gifts as preferred automatically.
- `모든 선물 보기` shows all gifts.

---

## Resource Calculator Rules

The standalone resource calculator page is not implemented yet.

Some character growth/material calculations already exist in character detail and utility files. Before changing that area, read the related data docs.

When starting it, create or update one of these documents first:
- `docs/ui/ui-resource-calculator.md`
- `docs/data/data-resource-calculator.md`

Do not mix resource calculator rules into `AGENTS.md`.

---

## Styling Rules

- Keep the current light theme.
- Do not switch to dark theme.
- Use placeholders for missing images.
- Use `object-fit: contain` for logos, maps, gifts, and icons.
- Avoid overlapping card content.
- Avoid large unused gaps in grids.

---

## Do Not

- Do not connect MySQL or any database yet.
- Do not implement login/signup yet.
- Do not scrape or invent data unless asked.
- Do not delete source/candidate data files unless asked.
- Do not rename stable IDs without explaining the migration.
- Do not modify unrelated pages.
- Do not commit automatically.

---

## Commit Rule

Only commit when the user explicitly asks.

If the user asks to commit:
1. Run `git status`.
2. Review changed files.
3. Commit with a short message that describes the task.

Example:

```bash
git add .
git commit -m "fix bond calculator gift filtering"
```

---

## Before Finishing

Before finishing a task:
1. Check `git status`.
2. Check that only relevant files changed.
3. Update related docs if UI or data structure changed.
4. Summarize modified files.
5. Mention remaining issues or data that needs review.

## Self Check Before Final Response

Before final response, verify:

- Only files related to the user request were modified.
- No unrelated refactors were made.
- No game data was invented.
- Stable IDs are used for data relationships when IDs exist.
- Raw/source files were not used directly unless explicitly requested.
- UI changes updated the related docs/ui file.
- Behavior or calculation changes updated the related docs/specs or docs/data file.
- Obvious UI issues were checked, including overlap, broken layout, and large unused gaps.
- Security risks were checked, including unsafe innerHTML, external scripts, exposed keys/tokens, and unexpected network/database usage.
- A reasonable verification step was run or clearly explained.
- git status was checked.