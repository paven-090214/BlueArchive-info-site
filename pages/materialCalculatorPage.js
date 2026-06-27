import { getAllStudentGroupsByLocale } from "../data/schaledb/schaleDbStore.js";
import { getSchaleLabel } from "../data/schaledb/schaleDbLabels.js";
import {
  getPreferredLanguage,
  getSchaleLocale,
  setPreferredLanguage,
  syncLanguageButtons,
} from "../utils/languagePreference.js";
import {
  EQUIPMENT_CURRENT_STATES,
  EQUIPMENT_TIER_RANGE,
  SKILL_LEVEL_RANGES,
  STUDENT_LEVEL_RANGE,
  UNIQUE_ITEM_TIERS,
  WEAPON_LEVEL_RANGE,
  createDefaultMaterialCalculatorCardState,
  createMaterialCalculatorStudentKey,
  loadMaterialCalculatorCards,
  normalizeMaterialCalculatorCardState,
  saveMaterialCalculatorCards,
} from "../utils/materialCalculatorStorage.js";
import {
  applyStudentImageFallback,
  resolveStudentImage,
} from "../utils/studentImageResolver.js";

const searchInput = document.querySelector("#material-student-search");
const searchResults = document.querySelector("[data-material-search-results]");
const cardList = document.querySelector("[data-material-student-card-list]");
const cardCount = document.querySelector("[data-material-card-count]");
const languageButtons = [...document.querySelectorAll("[data-language-button]")];
const PENDING_CALCULATOR_STORAGE_KEY = "ba-material-calculator-pending-student";

const SKILL_CONFIGS = [
  ["ex", "EX 스킬"],
  ["normal", "기본 스킬"],
  ["passive", "강화 스킬"],
  ["sub", "서브 스킬"],
];

const EQUIPMENT_CATEGORY_LABELS = {
  Hat: "모자",
  Gloves: "장갑",
  Shoes: "신발",
  Bag: "가방",
  Badge: "배지",
  Hairpin: "헤어핀",
  Charm: "부적",
  Necklace: "목걸이",
  Watch: "손목시계",
};

const UNIQUE_ITEM_TIER_LABELS = {
  none: "미선택",
  tier1: "1티어",
  tier2: "2티어",
};

let displayLanguage = getPreferredLanguage();
let studentGroups = [];
let studentForms = [];
let calculatorCards = [];

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeMaterialCalculatorPage);
} else {
  initializeMaterialCalculatorPage();
}

async function initializeMaterialCalculatorPage() {
  bindEvents();
  renderLoading();

  try {
    await loadStudentsForCurrentLanguage();
    restoreCalculatorCards();
    consumePendingStudent();
    renderPage();
  } catch (error) {
    console.error(error);
    renderSearchMessage("학생 데이터를 불러오지 못했습니다.");
    renderCardMessage("계산 목록을 불러오지 못했습니다.");
  }
}

function bindEvents() {
  searchInput.addEventListener("input", renderSearchResults);
  languageButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      displayLanguage = setPreferredLanguage(button.dataset.languageButton);
      syncLanguageButtons(displayLanguage, languageButtons);
      renderLoading();

      try {
        await loadStudentsForCurrentLanguage();
        restoreCalculatorCards();
        consumePendingStudent();
        renderPage();
      } catch (error) {
        console.error(error);
        renderSearchMessage("학생 데이터를 불러오지 못했습니다.");
      }
    });
  });
  syncLanguageButtons(displayLanguage, languageButtons);
}

async function loadStudentsForCurrentLanguage() {
  studentGroups = await getAllStudentGroupsByLocale(getSchaleLocale(displayLanguage));
  studentForms = studentGroups.flatMap((group) => {
    return group.forms.map((form) => {
      const student = form.student;
      const studentKey = createMaterialCalculatorStudentKey({
        groupId: group.groupId,
        formId: form.formId,
        studentId: student.id,
      });

      return {
        group,
        form,
        student,
        studentKey,
        searchText: createSearchText(group, form, student),
      };
    });
  });
}

function restoreCalculatorCards() {
  const savedCards = loadMaterialCalculatorCards();
  const formByKey = new Map(studentForms.map((entry) => [entry.studentKey, entry]));

  calculatorCards = savedCards
    .map((record) => {
      const entry = formByKey.get(record.studentKey);

      if (!entry) {
        return null;
      }

      return {
        ...record,
        state: normalizeMaterialCalculatorCardState(record.state, entry.student),
      };
    })
    .filter(Boolean);
}

function consumePendingStudent() {
  const pending = loadPendingStudent();

  if (!pending) {
    return;
  }

  const entry = studentForms.find((formEntry) => {
    return String(formEntry.student.id) === String(pending.studentId) ||
      (pending.slug && String(formEntry.student.slug) === String(pending.slug));
  });

  if (!entry) {
    return;
  }

  const existingCard = calculatorCards.find((card) => card.studentKey === entry.studentKey);
  const state = createCardStateFromDetailTarget(entry.student, pending.target);

  if (existingCard) {
    existingCard.state = state;
  } else {
    calculatorCards.push({
      studentKey: entry.studentKey,
      groupId: entry.group.groupId,
      formId: entry.form.formId,
      studentId: entry.student.id,
      state,
    });
  }

  saveMaterialCalculatorCards(calculatorCards);
  localStorage.removeItem(PENDING_CALCULATOR_STORAGE_KEY);
}

function loadPendingStudent() {
  try {
    const raw = localStorage.getItem(PENDING_CALCULATOR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("상세 페이지에서 전달된 학생 상태를 불러오지 못했습니다.", error);
    return null;
  }
}

function createCardStateFromDetailTarget(student, target = {}) {
  return normalizeMaterialCalculatorCardState({
    studentLevel: {
      currentLevel: 1,
      targetLevel: target.studentLevel,
    },
    skills: {
      ex: { currentLevel: 1, targetLevel: target.skills?.ex },
      normal: { currentLevel: 1, targetLevel: target.skills?.normal },
      passive: { currentLevel: 1, targetLevel: target.skills?.passive },
      sub: { currentLevel: 1, targetLevel: target.skills?.sub },
    },
    equipment: Object.fromEntries(
      Object.entries(target.equipment ?? {}).map(([slotKey, tier]) => [
        slotKey,
        {
          currentTier: 0,
          currentState: EQUIPMENT_CURRENT_STATES.LV1,
          targetTier: tier,
        },
      ]),
    ),
    uniqueItem: {
      currentTier: "none",
      targetTier: target.favoriteItemTier >= 2 ? "tier2" : target.favoriteItemTier >= 1 ? "tier1" : "none",
    },
    starRank: {
      currentRank: student.star ?? 1,
      targetRank: Number(target.uniqueWeaponStar) > 0
        ? 5 + Number(target.uniqueWeaponStar)
        : target.studentStar,
    },
    exclusiveWeapon: {
      currentLevel: 1,
      targetLevel: target.uniqueWeaponLevel,
    },
  }, student);
}

function renderPage() {
  renderSearchResults();
  renderCalculatorCards();
}

function renderLoading() {
  renderSearchMessage("학생 데이터를 불러오는 중...");
  renderCardMessage("계산 목록을 불러오는 중...");
}

function renderSearchResults() {
  const keyword = normalizeSearchText(searchInput.value);

  if (!keyword) {
    renderSearchMessage("학생 이름을 입력하면 검색 결과가 표시됩니다.");
    return;
  }

  const addedKeys = new Set(calculatorCards.map((card) => card.studentKey));
  const results = studentForms
    .filter((entry) => entry.searchText.includes(keyword))
    .slice(0, 20);

  if (results.length === 0) {
    renderSearchMessage("조건에 맞는 학생이 없습니다.");
    return;
  }

  searchResults.replaceChildren(...results.map((entry) => createSearchResult(entry, addedKeys)));
}

function createSearchResult(entry, addedKeys) {
  const item = document.createElement("article");
  item.className = "material-search-result";

  const image = createStudentIconImage(entry.student, `${getStudentDisplayName(entry)} 아이콘`);

  const content = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = getStudentDisplayName(entry);

  const meta = document.createElement("p");
  meta.textContent = `${getDisplayLabel("school", entry.student.school)} · ${getDisplayLabel("role", entry.student.role)}`;

  const formMeta = document.createElement("p");
  formMeta.className = "material-search-form-name";
  formMeta.textContent = entry.group.forms.length > 1
    ? `폼: ${entry.form.formName ?? entry.student.name ?? entry.form.formId}`
    : "기본 폼";

  content.append(title, meta, formMeta);

  const button = document.createElement("button");
  button.className = "material-add-button";
  button.type = "button";
  button.textContent = addedKeys.has(entry.studentKey) ? "추가됨" : "추가";
  button.disabled = addedKeys.has(entry.studentKey);
  button.addEventListener("click", () => addStudentCard(entry));

  item.append(image, content, button);
  return item;
}

function addStudentCard(entry) {
  if (calculatorCards.some((card) => card.studentKey === entry.studentKey)) {
    renderSearchResults();
    return;
  }

  calculatorCards.push({
    studentKey: entry.studentKey,
    groupId: entry.group.groupId,
    formId: entry.form.formId,
    studentId: entry.student.id,
    state: createDefaultMaterialCalculatorCardState(entry.student),
  });
  persistAndRender();
}

function renderCalculatorCards() {
  updateCardCount();

  if (calculatorCards.length === 0) {
    renderCardMessage("추가된 학생이 없습니다.");
    return;
  }

  const formByKey = new Map(studentForms.map((entry) => [entry.studentKey, entry]));
  const cards = calculatorCards.map((card) => {
    const entry = formByKey.get(card.studentKey);
    return entry ? createStudentCard(card, entry) : null;
  }).filter(Boolean);

  cardList.replaceChildren(...cards);
}

function createStudentCard(card, entry) {
  const student = entry.student;
  const normalizedState = normalizeMaterialCalculatorCardState(card.state, student);
  card.state = normalizedState;

  const article = document.createElement("article");
  article.className = "material-student-card";
  article.dataset.studentKey = card.studentKey;

  const header = document.createElement("div");
  header.className = "material-student-card-header";

  const titleRow = document.createElement("div");
  titleRow.className = "material-student-title-row";
  titleRow.append(createStudentIconImage(student, `${getStudentDisplayName(entry)} 아이콘`));

  const titleGroup = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = getDisplayLabel("school", student.school);

  const title = document.createElement("h3");
  title.textContent = getStudentDisplayName(entry);

  const meta = document.createElement("p");
  meta.textContent = `${getDisplayLabel("attackType", student.attackType)} · ${getDisplayLabel("defenseType", student.defenseType)} · ${getDisplayLabel("position", student.position)}`;
  titleGroup.append(eyebrow, title, meta);
  titleRow.append(titleGroup);

  const removeButton = document.createElement("button");
  removeButton.className = "material-remove-button";
  removeButton.type = "button";
  removeButton.textContent = "삭제";
  removeButton.addEventListener("click", () => removeStudentCard(card.studentKey));

  header.append(titleRow, removeButton);

  const controls = document.createElement("div");
  controls.className = "material-card-control-stack";
  controls.append(
    createLevelSection(card, student),
    createSkillSection(card),
    createEquipmentSection(card, student),
    createUniqueItemSection(card, student),
    createStarSection(card, student),
    createWeaponSection(card),
  );

  article.append(header, controls);
  return article;
}

function createStudentIconImage(student, alt) {
  const image = document.createElement("img");
  image.className = "material-student-image";
  image.src = resolveStudentImage(student, "icon");
  image.alt = alt;
  image.loading = "lazy";
  applyStudentImageFallback(image);
  return image;
}

function createLevelSection(card) {
  const section = createControlSection("학생 레벨");
  section.append(
    createNumberField({
      label: "현재 레벨",
      min: STUDENT_LEVEL_RANGE.min,
      max: STUDENT_LEVEL_RANGE.max,
      value: card.state.studentLevel.currentLevel,
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.studentLevel.currentLevel = value;
      }),
    }),
    createNumberField({
      label: "목표 레벨",
      min: STUDENT_LEVEL_RANGE.min,
      max: STUDENT_LEVEL_RANGE.max,
      value: card.state.studentLevel.targetLevel,
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.studentLevel.targetLevel = value;
      }),
    }),
  );
  return section;
}

function createSkillSection(card) {
  const section = createControlSection("스킬 레벨");
  const grid = document.createElement("div");
  grid.className = "material-control-grid";

  SKILL_CONFIGS.forEach(([key, label]) => {
    const range = SKILL_LEVEL_RANGES[key];
    const group = document.createElement("div");
    group.className = "material-control-group";

    const title = document.createElement("h4");
    title.textContent = label;
    group.append(
      title,
      createSelectField({
        label: "현재",
        value: card.state.skills[key].currentLevel,
        options: createLevelOptions(range.min, range.max),
        onChange: (value) => updateCardState(card.studentKey, (state) => {
          state.skills[key].currentLevel = Number(value);
        }),
      }),
      createSelectField({
        label: "목표",
        value: card.state.skills[key].targetLevel,
        options: createLevelOptions(range.min, range.max),
        onChange: (value) => updateCardState(card.studentKey, (state) => {
          state.skills[key].targetLevel = Number(value);
        }),
      }),
    );
    grid.append(group);
  });

  section.append(grid);
  return section;
}

function createEquipmentSection(card, student) {
  const section = createControlSection("장비");
  const slots = Array.isArray(student.equipmentSlots) ? student.equipmentSlots : [];

  if (slots.length === 0) {
    section.append(createNotice("장비 데이터 확인 필요"));
    return section;
  }

  const grid = document.createElement("div");
  grid.className = "material-control-grid material-equipment-grid";
  slots.forEach((slot, index) => {
    const slotKey = `slot${index + 1}`;
    const slotState = card.state.equipment[slotKey];
    const group = document.createElement("div");
    group.className = "material-control-group";

    const title = document.createElement("h4");
    title.textContent = `${index + 1}번 장비 · ${getEquipmentCategoryLabel(slot)}`;
    group.append(
      title,
      createSelectField({
        label: "현재 티어",
        value: slotState.currentTier,
        options: [["0", "미착용"], ...createTierOptions(1, EQUIPMENT_TIER_RANGE.max)],
        onChange: (value) => updateCardState(card.studentKey, (state) => {
          state.equipment[slotKey].currentTier = Number(value);
        }),
      }),
      createSelectField({
        label: "현재 상태",
        value: slotState.currentState,
        disabled: Number(slotState.currentTier) === 0,
        options: [
          [EQUIPMENT_CURRENT_STATES.LV1, "Lv.1"],
          [EQUIPMENT_CURRENT_STATES.MAX, "MAX"],
        ],
        onChange: (value) => updateCardState(card.studentKey, (state) => {
          state.equipment[slotKey].currentState = value;
        }),
      }),
      createSelectField({
        label: "목표 티어",
        value: slotState.targetTier,
        options: createTierOptions(Math.max(1, Number(slotState.currentTier) || 1), EQUIPMENT_TIER_RANGE.max),
        onChange: (value) => updateCardState(card.studentKey, (state) => {
          state.equipment[slotKey].targetTier = Number(value);
        }),
      }),
    );
    grid.append(group);
  });

  section.append(grid);
  return section;
}

function createUniqueItemSection(card, student) {
  const section = createControlSection("애장품");
  const hasGear = hasUniqueItem(student);

  if (!hasGear) {
    section.append(createNotice("애장품 없음"));
    return section;
  }

  section.append(
    createSelectField({
      label: "현재 티어",
      value: card.state.uniqueItem.currentTier,
      options: UNIQUE_ITEM_TIERS.map((tier) => [tier, UNIQUE_ITEM_TIER_LABELS[tier]]),
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.uniqueItem.currentTier = value;
      }),
    }),
    createSelectField({
      label: "목표 티어",
      value: card.state.uniqueItem.targetTier,
      options: UNIQUE_ITEM_TIERS.map((tier) => [tier, UNIQUE_ITEM_TIER_LABELS[tier]]),
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.uniqueItem.targetTier = value;
      }),
    }),
  );
  return section;
}

function createStarSection(card, student) {
  const section = createControlSection("성급");
  const baseStar = getBaseStar(student);
  section.append(
    createSelectField({
      label: "현재 성급",
      value: card.state.starRank.currentRank,
      options: createStarRankOptions(baseStar),
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.starRank.currentRank = Number(value);
      }),
    }),
    createSelectField({
      label: "목표 성급",
      value: card.state.starRank.targetRank,
      options: createStarRankOptions(card.state.starRank.currentRank),
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.starRank.targetRank = Number(value);
      }),
    }),
  );
  return section;
}

function createWeaponSection(card) {
  const section = createControlSection("전용무기 레벨");
  section.append(
    createNumberField({
      label: "현재 레벨",
      min: WEAPON_LEVEL_RANGE.min,
      max: WEAPON_LEVEL_RANGE.max,
      value: card.state.exclusiveWeapon.currentLevel,
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.exclusiveWeapon.currentLevel = value;
      }),
    }),
    createNumberField({
      label: "목표 레벨",
      min: WEAPON_LEVEL_RANGE.min,
      max: WEAPON_LEVEL_RANGE.max,
      value: card.state.exclusiveWeapon.targetLevel,
      onChange: (value) => updateCardState(card.studentKey, (state) => {
        state.exclusiveWeapon.targetLevel = value;
      }),
    }),
  );
  return section;
}

function createControlSection(titleText) {
  const section = document.createElement("section");
  section.className = "material-control-section";
  const title = document.createElement("h3");
  title.textContent = titleText;
  section.append(title);
  return section;
}

function createNumberField({ label, min, max, value, onChange }) {
  const field = createFieldShell(label);
  const input = document.createElement("input");
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.step = "1";
  input.value = String(value);
  input.addEventListener("change", () => onChange(Number(input.value)));
  field.append(input);
  return field;
}

function createSelectField({ label, value, options, disabled = false, onChange }) {
  const field = createFieldShell(label);
  const select = document.createElement("select");
  select.disabled = disabled;

  options.forEach(([optionValue, optionLabel]) => {
    select.append(new Option(optionLabel, String(optionValue)));
  });

  select.value = String(value);
  select.addEventListener("change", () => onChange(select.value));
  field.append(select);
  return field;
}

function createFieldShell(label) {
  const field = document.createElement("label");
  field.className = "material-compact-field";
  field.append(document.createTextNode(label));
  return field;
}

function updateCardState(studentKey, updater) {
  const card = calculatorCards.find((entry) => entry.studentKey === studentKey);
  const formEntry = studentForms.find((entry) => entry.studentKey === studentKey);

  if (!card || !formEntry) {
    return;
  }

  const nextState = structuredClone(card.state);
  updater(nextState);
  card.state = normalizeMaterialCalculatorCardState(nextState, formEntry.student);
  persistAndRender();
}

function removeStudentCard(studentKey) {
  calculatorCards = calculatorCards.filter((card) => card.studentKey !== studentKey);
  persistAndRender();
}

function persistAndRender() {
  saveMaterialCalculatorCards(calculatorCards.map((card) => ({
    studentKey: card.studentKey,
    groupId: card.groupId,
    formId: card.formId,
    studentId: card.studentId,
    state: card.state,
  })));
  renderPage();
}

function updateCardCount() {
  cardCount.textContent = `추가된 학생 ${calculatorCards.length}명`;
}

function renderSearchMessage(message) {
  searchResults.replaceChildren(createNotice(message));
}

function renderCardMessage(message) {
  updateCardCount();
  cardList.replaceChildren(createNotice(message));
}

function createNotice(message) {
  const notice = document.createElement("p");
  notice.className = "material-empty-message";
  notice.textContent = message;
  return notice;
}

function createLevelOptions(min, max) {
  const options = [];

  for (let level = min; level <= max; level += 1) {
    options.push([String(level), `Lv. ${level}`]);
  }

  return options;
}

function createTierOptions(min, max) {
  const options = [];

  for (let tier = min; tier <= max; tier += 1) {
    options.push([String(tier), `T${tier}`]);
  }

  return options;
}

function createStarRankOptions(minRank = 1) {
  const options = [];

  for (let rank = minRank; rank <= 9; rank += 1) {
    options.push([String(rank), rank <= 5 ? `${rank}성` : `전용무기 ${rank - 5}성`]);
  }

  return options;
}

function getStudentDisplayName(entry) {
  const groupName = entry.group.name ?? entry.student.name ?? "학생명 확인 필요";

  if (entry.group.forms.length <= 1) {
    return groupName;
  }

  return `${groupName} (${entry.form.formName ?? entry.student.name ?? "폼"})`;
}

function getEquipmentCategoryLabel(category) {
  return EQUIPMENT_CATEGORY_LABELS[category] ?? category ?? "장비 확인 필요";
}

function getDisplayLabel(type, value) {
  if (value === null || value === undefined || value === "") {
    return "확인 필요";
  }

  return getSchaleLabel(type, value, displayLanguage);
}

function createSearchText(group, form, student) {
  return [
    group.name,
    group.groupId,
    form.formName,
    form.formId,
    student.id,
    student.name,
    student.devName,
    student.slug,
    ...(student.searchTags ?? []),
  ]
    .filter(Boolean)
    .map(normalizeSearchText)
    .join(" ");
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）]/g, "");
}

function hasUniqueItem(student) {
  const gear = student?.gear ?? student?.uniqueItem ?? null;
  return Boolean(gear?.name || gear?.Name);
}

function getBaseStar(student) {
  const baseStar = Number(student?.star ?? student?.baseStar ?? student?.raw?.StarGrade ?? 1);
  return Number.isFinite(baseStar) ? Math.min(5, Math.max(1, Math.trunc(baseStar))) : 1;
}
