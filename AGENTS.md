# AGENTS.md

## Project Overview

This is a static Blue Archive information site.

Current stack:
- HTML
- CSS
- JavaScript
- Static data files in `data/`

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

Common docs:
- `docs/todo.md`
- `docs/project-plan.md`
- `docs/requirement.md`
- `docs/ui-common.md`
- `docs/ui-layout.md`
- `docs/ui-main.md`
- `docs/ui-character.md`
- `docs/ui-bond-calculator.md`
- `docs/database-design.md`

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

Main data:
- `data/index.js`
- `data/academies.js`
- `data/clubs.js`
- `data/students.js`
- `data/pickups.json`
- `data/gifts.js`
- `data/character-gift-preferences.js`
- `data/bond-rank-requirements.js`
- `data/bond-point-sources.js`

Images:
- `images/academies/`
- `images/maps/`
- `images/gifts/`
- `images/characters/`

Raw/source files:
- `sources/`
- `scripts/`
- `data/raw/rawItems.js`

Do not modify raw/source files unless explicitly asked.

---

## Documentation Rules

When UI or data structure changes, update the related document.

Examples:
- Main page changes → `docs/ui-main.md`
- Student page changes → `docs/ui-character.md`
- Bond calculator changes → `docs/ui-bond-calculator.md`
- Resource calculator changes → `docs/ui-resource-calculator.md` or `docs/data-resource-calculator.md`
- Remaining work → `docs/todo.md`
- DB design changes → only if explicitly requested

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
docs/ui-bond-calculator.md
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

The resource calculator is not implemented yet.

When starting it, create or update one of these documents first:
- `docs/ui-resource-calculator.md`
- `docs/data-resource-calculator.md`

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