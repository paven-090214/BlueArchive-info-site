import {
  getAllCurrencyByLocale,
  getAllEquipmentByLocale,
  getAllItemsByLocale,
  getStudentByIdByLocale,
  getStudentBySlugByLocale,
  getStudentGroupByIdByLocale,
  getStudentGroupByStudentIdByLocale,
} from "../data/schaledb/schaleDbStore.js";
import { items as siteItems } from "../data/items.js";
import { equipmentLevelCosts } from "../data/equipment-level-costs.js";
import { skillMaterialRequirements } from "../data/skillMaterialRequirements.js";
import { getSchaleLabel } from "../data/schaledb/schaleDbLabels.js";
import { calculateCharacterLevelMaterials } from "../utils/characterLevelCalculator.js";
import {
  calculateEquipmentMaterials,
  createEquipmentByCategory,
  CURRENT_EQUIPMENT_STATES,
  EQUIPMENT_TIER_RANGE,
} from "../utils/equipmentCalculator.js";
import { calculateExclusiveWeaponMaterials } from "../utils/exclusiveWeaponCalculator.js";
import {
  calculateSkillMaterials,
  SKILL_LEVEL_RANGES,
} from "../utils/skillMaterialCalculator.js";
import {
  ABILITY_UNLOCK_LEVEL_RANGE,
  calculateAbilityUnlockMaterials,
  DEFAULT_ABILITY_UNLOCK_STATE,
  getAbilityUnlockBonusConfigs,
  normalizeAbilityUnlockState,
} from "../utils/abilityUnlockCalculator.js";
import {
  getEffectiveTerrain,
  getExclusiveWeaponStar4Effect,
} from "../utils/studentDetailEffects.js";
import {
  getPreferredLanguage,
  getSchaleLocale,
  setPreferredLanguage,
  syncLanguageButtons,
} from "../utils/languagePreference.js";
import { getUserInventory } from "../utils/userInventoryStorage.js";

const characterProfileName = document.querySelector("#character-profile-name");
const characterProfileDescription = document.querySelector("#character-profile-description");
const characterProfileVisual = document.querySelector(".character-large-placeholder");
const characterDetailGrid = document.querySelector(".character-detail-grid");
const skillList = document.querySelector(".skill-list");
const terrainAptitudeList = document.querySelector(".terrain-aptitude-list");
const roleImage = document.querySelector("[data-role-image]");
const growthStarRow = document.querySelector("[data-growth-star-row]");
const studentCurrentLevelInput = document.querySelector("#student-current-level-input");
const studentLevelInput = document.querySelector("#student-level-input");
const studentLevelRange = document.querySelector("#student-level-range");
const equipmentList = document.querySelector("[data-equipment-list]");
const abilityUnlockList = document.querySelector("[data-ability-unlock-list]");
const materialList = document.querySelector(".material-list");
const requiredMaterialCount = document.querySelector("[data-required-material-count]");
const favoriteItemPanel = document.querySelector(".favorite-item-panel");
const favoriteItemCard = document.querySelector(".favorite-item-card");
const exclusiveWeaponName = document.querySelector("[data-exclusive-weapon-name]");
const exclusiveWeaponDesc = document.querySelector("[data-exclusive-weapon-desc]");
const exclusiveWeaponImageSlot = document.querySelector("[data-exclusive-weapon-image-slot]");
const exclusiveWeaponRank3Effect = document.querySelector("[data-exclusive-weapon-rank3-effect]");
const exclusiveWeaponRank4Effect = document.querySelector("[data-exclusive-weapon-rank4-effect]");
const exclusiveWeaponEnhancedSkill = document.querySelector("[data-exclusive-weapon-enhanced-skill]");
const exclusiveWeaponEnhancedStats = document.querySelector("[data-exclusive-weapon-enhanced-stats]");
const memorialSlot = document.querySelector("[data-memorial-slot]");
const languageButtons = [...document.querySelectorAll("[data-language-button]")];

const STAR_ICON_URL = "./images/icon/Icon_star.webp";
const BLANK_STAR_ICON_URL = "./images/icon/Icon_blank_star.webp";

let displayLanguage = getPreferredLanguage();
let selectedGrowthStar = 0;
let selectedWeaponStar = 0;
let equipmentMaterialData = null;
let equipmentStateStudentId = null;
let equipmentState = {};
let abilityUnlockStateStudentId = null;
let abilityUnlockState = structuredClone(DEFAULT_ABILITY_UNLOCK_STATE);
let growthStateStudentId = null;
let studentLevelState = { currentLevel: 1, targetLevel: 90 };
let skillLevelState = {};
let activeStudentForMaterials = null;

const TERRAIN_META = [
  ["street", "시가지", "./images/terrains/urban.webp"],
  ["outdoor", "야외", "./images/terrains/outdoor.webp"],
  ["indoor", "실내", "./images/terrains/indoor.webp"],
];

const TERRAIN_RANK_IMAGE_URLS = {
  SS: "./images/terrain-ranks/rank-ss.webp",
  S: "./images/terrain-ranks/rank-s.webp",
  A: "./images/terrain-ranks/rank-a.webp",
  B: "./images/terrain-ranks/rank-b.webp",
  C: "./images/terrain-ranks/rank-c.webp",
  D: "./images/terrain-ranks/rank-d.webp",
};

const EQUIPMENT_ICON_81PX_FILE_NAMES = new Set([
  "Equipment_Icon_Badge_Tier1",
  "Equipment_Icon_Bag_Tier5",
  "Equipment_Icon_Gloves_Tier3",
  "Equipment_Icon_Gloves_Tier4",
  "Equipment_Icon_Gloves_Tier5",
  "Equipment_Icon_Hairpin_Tier7",
  "Equipment_Icon_Hat_Tier5",
  "Equipment_Icon_Hat_Tier6",
  "Equipment_Icon_Necklace_Tier6",
  "Equipment_Icon_Shoes_Tier5",
  "Equipment_Icon_Watch_Tier2",
  "Equipment_Icon_Watch_Tier3",
  "Equipment_Icon_Watch_Tier5",
]);

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

const ROLE_IMAGE_URLS = {
  DamageDealer: "./images/role/attacker.webp",
  Tanker: "./images/role/tank.webp",
  Healer: "./images/role/healer.webp",
  Supporter: "./images/role/support.webp",
};

const SKILL_SLOT_CONFIG = [
  { key: "ex", label: "EX 스킬", iconText: "EX", maxLevel: 5 },
  { key: "normal", plusKey: "normalPlus", label: "기본 스킬", iconText: "1", maxLevel: 10 },
  { key: "passive", plusKey: "passivePlus", label: "강화 스킬", iconText: "2", maxLevel: 10 },
  { key: "sub", label: "서브 스킬", iconText: "3", maxLevel: 10 },
];

function createDefaultSkillLevelState() {
  return Object.fromEntries(
    SKILL_SLOT_CONFIG
      .filter((slot) => SKILL_LEVEL_RANGES[slot.key])
      .map((slot) => [slot.key, {
        currentLevel: SKILL_LEVEL_RANGES[slot.key].min,
        targetLevel: SKILL_LEVEL_RANGES[slot.key].max,
      }]),
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCharacterDetailPage);
} else {
  initializeCharacterDetailPage();
}

async function initializeCharacterDetailPage() {
  renderLoadingState();
  bindLanguageButtons();

  try {
    const [detailContext] = await Promise.all([
      loadSelectedStudentContext(),
      loadEquipmentMaterialData(),
    ]);

    if (!detailContext?.activeForm?.student) {
      renderErrorState("학생 정보를 찾을 수 없습니다.");
      return;
    }

    renderStudentDetailContext(detailContext);
  } catch (error) {
    console.error(error);
    renderErrorState("학생 정보를 불러오지 못했습니다.");
  }
}

function bindLanguageButtons() {
  languageButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      displayLanguage = setPreferredLanguage(button.dataset.languageButton);
      updateLanguageButtons();
      renderLoadingState();

      try {
        equipmentMaterialData = null;
        const [detailContext] = await Promise.all([
          loadSelectedStudentContext(),
          loadEquipmentMaterialData(),
        ]);

        if (!detailContext?.activeForm?.student) {
          renderErrorState("학생 정보를 찾을 수 없습니다.");
          return;
        }

        renderStudentDetailContext(detailContext);
      } catch (error) {
        console.error(error);
        renderErrorState("학생 정보를 불러오지 못했습니다.");
      }
    });
  });
  updateLanguageButtons();
}

async function loadSelectedStudentContext() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("groupId");
  const id = params.get("id");
  const slug = params.get("slug");
  const formId = params.get("formId");
  const locale = getSchaleLocale(displayLanguage);

  if (groupId) {
    const group = await getStudentGroupByIdByLocale(groupId, locale);
    return createDetailContextFromGroup(group, formId);
  }

  if (id) {
    const student = await getStudentByIdByLocale(id, locale);
    return createDetailContextFromStudent(student, locale);
  }

  if (slug) {
    const student = await getStudentBySlugByLocale(slug, locale);
    return createDetailContextFromStudent(student, locale);
  }

  const student = await getStudentByIdByLocale(10000, locale);
  return createDetailContextFromStudent(student, locale);
}

async function loadEquipmentMaterialData() {
  const locale = getSchaleLocale(displayLanguage);
  const [equipment, items, currency] = await Promise.all([
    getAllEquipmentByLocale(locale),
    getAllItemsByLocale(locale),
    getAllCurrencyByLocale(locale),
  ]);

  equipmentMaterialData = {
    equipment,
    equipmentById: new Map(equipment.map((item) => [item.id, item])),
    equipmentByCategory: createEquipmentByCategory(equipment),
    items,
    itemsById: new Map(items.map((item) => [item.id, item])),
    displayItemsById: createDisplayItemsById(items),
    currency,
    currencyById: new Map(currency.map((item) => [item.id, item])),
    levelCostRows: equipmentLevelCosts,
  };

  return equipmentMaterialData;
}

function createDisplayItemsById(schaleItems = []) {
  return new Map([
    ...siteItems.map((item) => [String(item.id), item]),
    ...schaleItems
      .filter((item) => item?.id !== null && item?.id !== undefined)
      .map((item) => [String(item.id), item]),
  ]);
}

async function createDetailContextFromStudent(student, locale) {
  if (!student) {
    return null;
  }

  const group = await getStudentGroupByStudentIdByLocale(student.id, locale);

  if (group) {
    return createDetailContextFromGroup(group, student.id);
  }

  return {
    group: null,
    activeForm: {
      formId: student.id,
      formName: student.name ?? "기본 폼",
      student,
      order: 0,
    },
  };
}

function createDetailContextFromGroup(group, preferredFormId = null) {
  if (!group || !Array.isArray(group.forms) || group.forms.length === 0) {
    return null;
  }

  const preferredId = Number(preferredFormId);
  const activeForm = group.forms.find((form) => Number(form.formId) === preferredId) ?? group.forms[0];

  return {
    group,
    activeForm,
  };
}

function renderStudentDetailContext(detailContext) {
  renderStudentDetail(detailContext.activeForm.student, detailContext.group, detailContext.activeForm);
}

function renderStudentDetail(student, group = null, activeForm = null) {
  activeStudentForMaterials = student;
  document.title = `${student.name ?? "학생 상세"} | BlueArchive Info Site`;
  selectedGrowthStar = getBaseStar(student);
  selectedWeaponStar = clampStarValue(selectedWeaponStar, 0, 4);
  ensureGrowthStateForStudent(student);
  renderFormSwitcher(group, activeForm);
  renderProfile(student);
  renderBasicFields(student);
  renderTerrainAdaptations(student);
  renderUniqueItem(student);
  renderSkillCards(student);
  renderStudentLevelControls(student);
  renderGrowthStars(student);
  renderEquipmentCards(student);
  renderAbilityUnlockSection(student);
  renderWeapon(student);
  updateRequiredMaterials(student);
  renderMemorialPlaceholder();
}

function renderFormSwitcher(group, activeForm) {
  const existingSwitcher = document.querySelector("[data-character-form-switcher]");

  if (!group || group.forms.length <= 1) {
    existingSwitcher?.remove();
    return;
  }

  const switcher = existingSwitcher ?? createFormSwitcherShell();
  const buttonList = switcher.querySelector("[data-character-form-list]");
  buttonList.replaceChildren(...group.forms.map((form) => createFormButton(group, form, activeForm)));

  if (!existingSwitcher) {
    characterDetailGrid.before(switcher);
  }
}

function createFormSwitcherShell() {
  const section = document.createElement("section");
  section.className = "panel character-form-switcher";
  section.dataset.characterFormSwitcher = "";
  section.setAttribute("aria-label", "캐릭터 폼 선택");

  const heading = document.createElement("div");
  heading.className = "panel-heading character-form-heading";

  const titleGroup = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "FORM";

  const title = document.createElement("h2");
  title.textContent = "폼 선택";

  titleGroup.append(eyebrow, title);

  const buttonList = document.createElement("div");
  buttonList.className = "character-form-list";
  buttonList.dataset.characterFormList = "";

  heading.append(titleGroup, buttonList);
  section.append(heading);
  return section;
}

function createFormButton(group, form, activeForm) {
  const button = document.createElement("button");
  button.className = "character-form-button";
  button.type = "button";
  button.textContent = form.formName ?? form.student?.name ?? `폼 ${form.order + 1}`;
  button.dataset.formId = String(form.formId);

  if (Number(form.formId) === Number(activeForm?.formId)) {
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");
  } else {
    button.setAttribute("aria-pressed", "false");
  }

  button.addEventListener("click", () => {
    updateFormUrl(group, form);
    resetGrowthState(form.student);
    renderStudentDetail(form.student, group, form);
  });

  return button;
}

function updateFormUrl(group, form) {
  const params = new URLSearchParams(window.location.search);
  params.delete("id");
  params.delete("slug");
  params.set("groupId", group.groupId);
  params.set("formId", form.formId);
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

function renderProfile(student) {
  const name = student.name ?? "학생명 확인 필요";
  characterProfileName.textContent = name;
  characterProfileDescription.textContent = student.profile ?? "프로필 데이터 확인 필요";

  if (roleImage) {
    roleImage.src = ROLE_IMAGE_URLS[student.role] || "./images/duuu/duuu.webp";
    roleImage.alt = getDisplayLabel("role", student.role);
  }

  characterProfileVisual.replaceChildren();
  const imageUrl = getStudentImageUrl(student);

  if (!imageUrl) {
    const fallback = document.createElement("span");
    fallback.textContent = name;
    characterProfileVisual.append(fallback);
    return;
  }

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = name;
  image.className = "character-profile-image";
  characterProfileVisual.append(image);
}

function renderBasicFields(student) {
  const fieldValues = {
    fullName: student.name ?? "확인 필요",
    birthday: student.birthday ?? "확인 필요",
    academyName: getAcademyDisplayName(student),
    attackType: getDisplayLabel("attackType", student.attackType),
    defenseType: getDisplayLabel("defenseType", student.defenseType),
    role: getDisplayLabel("role", student.role),
    position: getDisplayLabel("position", student.position),
    combatClass: getDisplayLabel("squadType", student.squadType),
    age: student.age ?? "확인 필요",
    weaponType: student.weaponType ?? "확인 필요",
    hobby: student.hobby ?? "확인 필요",
    designer: student.designer ?? "확인 필요",
    illustrator: student.illustrator ?? "확인 필요",
    voiceActor: student.voice ?? "확인 필요",
    releaseDate: "확인 필요",
  };

  Object.entries(fieldValues).forEach(([field, value]) => {
    const target = document.querySelector(`[data-student-field="${field}"]`);

    if (target) {
      target.textContent = value;
    }
  });
}

function renderTerrainAdaptations(student) {
  const effectiveTerrain = getEffectiveTerrain(student, selectedWeaponStar);
  const cards = TERRAIN_META.map(([key, label, imageUrl]) => {
    const terrainEntry = effectiveTerrain?.[key] ?? null;
    const rank = getTerrainRank(terrainEntry);
    const card = document.createElement("article");
    card.className = "terrain-aptitude-card";

    const terrainImage = document.createElement("img");
    terrainImage.className = "terrain-place-image";
    terrainImage.src = imageUrl;
    terrainImage.alt = label;

    const body = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = label;
    body.append(title);

    if (rank && TERRAIN_RANK_IMAGE_URLS[rank]) {
      const rankImage = document.createElement("img");
      rankImage.className = "terrain-rank-image";
      rankImage.src = TERRAIN_RANK_IMAGE_URLS[rank];
      rankImage.alt = rank;
      body.append(rankImage);

      if (terrainEntry?.boosted) {
        const bonus = document.createElement("span");
        bonus.className = "skill-review-note";
        bonus.textContent = `전용무기 3성 +${terrainEntry.bonusValue}`;
        body.append(bonus);
      }
    } else {
      const empty = document.createElement("span");
      empty.textContent = "확인 필요";
      body.append(empty);
    }

    card.append(terrainImage, body);
    return card;
  });

  terrainAptitudeList.replaceChildren(...cards);
}

function renderSkillCards(student) {
  const skills = getDisplaySkillSlotEntries(student);

  if (skills.length === 0) {
    replaceWithNotice(skillList, "스킬 데이터 확인 필요");
    return;
  }

  skillList.replaceChildren(...skills.map(createSkillSlotCard));
}

function getDisplaySkillSlotEntries(student) {
  const skills = student.skills;

  if (isNormalizedSkillGroups(skills)) {
    return SKILL_SLOT_CONFIG.map((slot) => {
      const slotSkills = getDisplaySkillsForSlot(skills, slot);

      return {
        slot,
        skills: sortSkillsByOrder(slotSkills),
      };
    }).filter((entry) => entry.skills.length > 0);
  }

  const slotMap = new Map();
  normalizeLegacySkills(skills).forEach((skill, index) => {
    const slot = getFallbackSkillSlot(index);
    const key = slot.key;
    const entry = slotMap.get(key) ?? { slot, skills: [] };
    entry.skills.push(skill);
    slotMap.set(key, entry);
  });

  return [...slotMap.values()];
}

function isNormalizedSkillGroups(skills) {
  return Boolean(
    skills &&
    typeof skills === "object" &&
    !Array.isArray(skills) &&
    SKILL_SLOT_CONFIG.some((slot) => Array.isArray(skills[slot.key])),
  );
}

function getDisplaySkillsForSlot(skills, slot) {
  const baseSkills = Array.isArray(skills[slot.key]) ? skills[slot.key] : [];
  const plusSkills = slot.plusKey && Array.isArray(skills[slot.plusKey]) ? skills[slot.plusKey] : [];

  if (slot.key === "passive" && shouldDisplayPassivePlus() && plusSkills.length > 0) {
    return plusSkills;
  }

  return baseSkills;
}

function shouldDisplayPassivePlus() {
  return selectedWeaponStar >= 2;
}

function sortSkillsByOrder(skills) {
  return [...skills].sort((left, right) => {
    return Number(left?.order ?? 0) - Number(right?.order ?? 0);
  });
}

function normalizeLegacySkills(skills) {
  if (Array.isArray(skills)) {
    return skills;
  }

  if (skills && typeof skills === "object") {
    return Object.entries(skills)
      .filter(([key]) => key !== "rawSkills")
      .flatMap(([, value]) => Array.isArray(value) ? value : [value]);
  }

  return [];
}

function createSkillSlotCard({ skills, slot }) {
  const card = document.createElement("article");
  card.className = "skill-card";

  const body = document.createElement("div");
  body.className = "skill-card-body";

  const icon = document.createElement("div");
  icon.className = "skill-icon-placeholder";
  icon.textContent = slot.iconText;

  const content = document.createElement("div");
  content.className = "skill-content";

  const titleRow = document.createElement("div");
  titleRow.className = "skill-title-row";

  const title = document.createElement("h3");
  title.textContent = slot.label;

  const levelControls = createSkillLevelControlGroup(slot);
  titleRow.append(title, levelControls);

  const variantList = document.createElement("div");
  variantList.className = "skill-variant-list";
  variantList.append(...skills.map((skill) => createSkillInfoBlock(skill, slot)));

  content.append(titleRow, variantList);

  body.append(icon, content);
  card.append(body);
  return card;
}

function createSkillInfoBlock(skill, slot) {
  const block = document.createElement("div");
  block.className = "skill-info-block";

  const name = document.createElement("p");
  name.className = "skill-name";
  name.textContent = getSkillName(skill, slot);

  const description = document.createElement("p");
  description.textContent = getSkillDescription(skill);

  block.append(name, description);

  if (skill?.changeRule || skill?.trigger || skill?.needsReview) {
    block.append(createSkillMeta(skill));
  }

  return block;
}

function createEnhancedSkillSection({ title, skills, emptyMessage }) {
  const section = document.createElement("div");
  section.className = "enhanced-skill-section";

  const heading = document.createElement("h4");
  heading.textContent = title;
  section.append(heading);

  if (!skills || skills.length === 0) {
    const empty = document.createElement("p");
    empty.className = "skill-review-note";
    empty.textContent = emptyMessage;
    section.append(empty);
    return section;
  }

  const list = document.createElement("div");
  list.className = "skill-variant-list";
  list.append(...sortSkillsByOrder(skills).map((skill) => createSkillInfoBlock(skill, {
    label: title,
    iconText: "",
  })));
  section.append(list);
  return section;
}

function getEnhancedSkills(student, skillKey) {
  const skills = student?.skills;

  if (!skills || typeof skills !== "object" || !Array.isArray(skills[skillKey])) {
    return [];
  }

  return skills[skillKey];
}

function getFallbackSkillSlot(index) {
  return SKILL_SLOT_CONFIG[index] ?? {
    key: "unknown",
    label: "스킬",
    iconText: "S",
    maxLevel: 10,
  };
}

function createSkillLevelControlGroup(slot) {
  const group = document.createElement("div");
  group.className = "skill-level-control-group";
  group.append(
    createSkillLevelSelect({
      slot,
      label: `${slot.label} 현재 레벨`,
      value: skillLevelState[slot.key]?.currentLevel ?? SKILL_LEVEL_RANGES[slot.key]?.min ?? 1,
      onChange: (value) => updateSkillLevelState(slot.key, { currentLevel: Number(value) }),
    }),
    createSkillLevelSelect({
      slot,
      label: `${slot.label} 목표 레벨`,
      value: skillLevelState[slot.key]?.targetLevel ?? slot.maxLevel,
      onChange: (value) => updateSkillLevelState(slot.key, { targetLevel: Number(value) }),
    }),
  );
  return group;
}

function createSkillLevelSelect({ slot, label, value, onChange }) {
  const select = document.createElement("select");
  select.className = "skill-level-select";
  select.setAttribute("aria-label", label);

  for (let level = 1; level <= slot.maxLevel; level += 1) {
    select.append(new Option(`Lv. ${level}`, String(level)));
  }

  select.value = String(value);
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function createSkillMeta(skill) {
  const meta = document.createElement("p");
  meta.className = "skill-review-note";

  if (skill.changeRule) {
    meta.textContent = skill.changeRule;
    return meta;
  }

  if (skill.trigger) {
    meta.textContent = skill.trigger;
    return meta;
  }

  meta.textContent = "스킬 슬롯 검수 필요";
  return meta;
}

function renderStudentLevelControls(student) {
  ensureGrowthStateForStudent(student);

  if (!studentCurrentLevelInput || !studentLevelInput || !studentLevelRange) {
    return;
  }

  const maxLevel = getMaxStudentLevel();
  studentCurrentLevelInput.max = String(maxLevel);
  studentLevelInput.max = String(maxLevel);
  studentLevelRange.max = String(maxLevel);
  studentCurrentLevelInput.value = String(studentLevelState.currentLevel);
  studentLevelInput.value = String(studentLevelState.targetLevel);
  studentLevelRange.value = String(studentLevelState.targetLevel);

  bindStudentLevelControls(student);
}

function bindStudentLevelControls(student) {
  if (studentCurrentLevelInput.dataset.boundLevelControl === "true") {
    return;
  }

  studentCurrentLevelInput.dataset.boundLevelControl = "true";
  studentLevelInput.dataset.boundLevelControl = "true";
  studentLevelRange.dataset.boundLevelControl = "true";

  studentCurrentLevelInput.addEventListener("input", () => {
    updateStudentLevelState({ currentLevel: Number(studentCurrentLevelInput.value) });
  });
  studentLevelInput.addEventListener("input", () => {
    updateStudentLevelState({ targetLevel: Number(studentLevelInput.value) });
  });
  studentLevelRange.addEventListener("input", () => {
    updateStudentLevelState({ targetLevel: Number(studentLevelRange.value) });
  });
}

function renderGrowthStars(student) {
  const baseStar = getBaseStar(student);
  selectedGrowthStar = baseStar;
  const controls = [];

  for (let index = 1; index <= 5; index += 1) {
    controls.push(createStarButton({
      value: index,
      isActive: index <= baseStar,
      iconUrl: STAR_ICON_URL,
      blankIconUrl: BLANK_STAR_ICON_URL,
      label: `기본 ${index}성`,
    }));
  }

  for (let index = 1; index <= 4; index += 1) {
    controls.push(createStarButton({
      value: index,
      isActive: index <= selectedWeaponStar,
      iconUrl: "./images/icon/Icon_blue_star.webp",
      blankIconUrl: "./images/icon/Icon_blank_star.webp",
      label: `전용무기 ${index}성`,
      onClick: () => {
        selectedGrowthStar = baseStar;
        selectedWeaponStar = index;
        renderGrowthStars(student);
        renderSkillCards(student);
        renderTerrainAdaptations(student);
        renderWeapon(student);
        updateRequiredMaterials(student);
      },
    }));
  }

  growthStarRow.replaceChildren(...controls);
}

function createStarButton({ value, isActive, iconUrl, blankIconUrl, label, onClick }) {
  const button = document.createElement("button");
  button.className = "star-button";
  button.type = "button";
  button.dataset.starValue = String(value);
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", isActive ? "true" : "false");

  const image = document.createElement("img");
  image.className = "star-icon student-star-icon";
  image.src = isActive ? iconUrl : blankIconUrl;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");

  button.append(image);
  if (typeof onClick === "function") {
    button.addEventListener("click", onClick);
  } else {
    button.disabled = true;
  }
  return button;
}

function renderEquipmentCards(student) {
  const slots = Array.isArray(student.equipmentSlots) ? student.equipmentSlots : [];

  if (slots.length === 0) {
    replaceWithNotice(equipmentList, "장비 데이터 확인 필요");
    return;
  }

  ensureEquipmentStateForStudent(student);
  equipmentList.replaceChildren(...slots.map((slot, index) => createEquipmentCard(slot, index, student)));
}

function renderAbilityUnlockSection(student) {
  ensureAbilityUnlockStateForStudent(student);

  if (!abilityUnlockList) {
    return;
  }

  abilityUnlockList.replaceChildren(
    ...getAbilityUnlockBonusConfigs().map((bonus) => createAbilityUnlockCard(bonus, student)),
  );
}

function createAbilityUnlockCard(bonus, student) {
  const card = document.createElement("article");
  card.className = "equipment-card ability-unlock-card";
  const bonusState = abilityUnlockState[bonus.key] ?? { currentLevel: 0, targetLevel: 0 };

  const content = document.createElement("div");
  content.className = "equipment-content";

  const titleRow = document.createElement("div");
  titleRow.className = "equipment-title-row";

  const title = document.createElement("h3");
  title.textContent = bonus.displayName;
  titleRow.append(title);

  const controls = document.createElement("div");
  controls.className = "ability-unlock-control-group";
  controls.append(
    createAbilityUnlockSelect({
      label: `${bonus.displayName} 현재 단계`,
      value: bonusState.currentLevel,
      onChange: (value) => updateAbilityUnlockState(student, bonus.key, { currentLevel: Number(value) }),
    }),
    createAbilityUnlockSelect({
      label: `${bonus.displayName} 목표 단계`,
      value: bonusState.targetLevel,
      minLevel: bonusState.currentLevel,
      onChange: (value) => updateAbilityUnlockState(student, bonus.key, { targetLevel: Number(value) }),
    }),
  );

  content.append(titleRow, controls);
  card.append(content);
  return card;
}

function createAbilityUnlockSelect({ label, value, minLevel = ABILITY_UNLOCK_LEVEL_RANGE.min, onChange }) {
  const field = document.createElement("label");
  field.className = "compact-field";
  field.textContent = label;

  const select = document.createElement("select");
  select.className = "equipment-tier-select";
  select.setAttribute("aria-label", label);

  for (let level = minLevel; level <= ABILITY_UNLOCK_LEVEL_RANGE.max; level += 1) {
    select.append(new Option(`${level}단계`, String(level)));
  }

  select.value = String(Math.max(minLevel, Number(value) || 0));
  select.addEventListener("change", () => onChange(select.value));
  field.append(select);
  return field;
}

function createEquipmentCard(slot, index, student) {
  const card = document.createElement("article");
  card.className = "equipment-card";
  const slotState = equipmentState[`slot${index + 1}`] ?? createDefaultEquipmentSlotState();

  const content = document.createElement("div");
  content.className = "equipment-content";

  const titleRow = document.createElement("div");
  titleRow.className = "equipment-title-row";

  const title = document.createElement("h3");
  title.textContent = `${index + 1}번 장비 / ${getEquipmentCategoryLabel(slot)}`;

  const category = document.createElement("p");
  category.className = "equipment-slot-note";
  category.textContent = getEquipmentCategoryLabel(slot);

  const visualRow = document.createElement("div");
  visualRow.className = "equipment-visual-row";
  visualRow.append(
    createEquipmentVisual({
      label: "현재 장비",
      category: slot,
      tier: Number(slotState.currentTier) === 0 ? EQUIPMENT_TIER_RANGE.min : slotState.currentTier,
      isUnequipped: Number(slotState.currentTier) === 0,
    }),
    createEquipmentVisual({
      label: "목표 장비",
      category: slot,
      tier: slotState.targetTier,
      isUnequipped: false,
    }),
  );

  const controls = document.createElement("div");
  controls.className = "equipment-control-group";
  controls.append(
    createEquipmentSelect({
      label: `${index + 1}번 장비 현재 티어`,
      value: slotState.currentTier,
      options: [
        ["0", "미착용"],
        ...createTierOptions({ maxTier: getMaxEquipmentTierByCategory(slot) }),
      ],
      onChange: (value) => updateEquipmentSlotState(student, index, { currentTier: Number(value) }),
    }),
    createEquipmentSelect({
      label: `${index + 1}번 장비 현재 레벨 상태`,
      value: slotState.currentState,
      options: [
        [CURRENT_EQUIPMENT_STATES.LV1, "Lv.1"],
        [CURRENT_EQUIPMENT_STATES.MAX, "현재 티어 MAX"],
      ],
      disabled: Number(slotState.currentTier) === 0,
      onChange: (value) => updateEquipmentSlotState(student, index, { currentState: value }),
    }),
    createEquipmentSelect({
      label: `${index + 1}번 장비 목표 티어`,
      value: slotState.targetTier,
      options: createTierOptions({
        minTier: Math.max(EQUIPMENT_TIER_RANGE.min, Number(slotState.currentTier) || 0),
        maxTier: getMaxEquipmentTierByCategory(slot),
      }),
      onChange: (value) => updateEquipmentSlotState(student, index, { targetTier: Number(value) }),
    }),
  );

  titleRow.append(title);
  content.append(titleRow, category, visualRow, controls);
  card.append(content);
  return card;
}

function createEquipmentVisual({ label, category, tier, isUnequipped }) {
  const visual = document.createElement("div");
  visual.className = "equipment-visual";

  if (isUnequipped) {
    visual.classList.add("is-unequipped");
  }

  const imageUrl = getEquipmentImageUrl(category, tier);
  const image = imageUrl ? document.createElement("img") : null;

  if (image) {
    image.className = "equipment-image";
    image.src = imageUrl;
    image.alt = `${getEquipmentCategoryLabel(category)} T${tier}`;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      const fallback = createEquipmentImagePlaceholder(category);
      image.replaceWith(fallback);
    }, { once: true });
  }

  const text = document.createElement("div");
  text.className = "equipment-visual-copy";

  const labelText = document.createElement("span");
  labelText.textContent = label;

  const tierText = document.createElement("strong");
  tierText.textContent = isUnequipped ? "미착용" : `T${tier}`;

  text.append(labelText, tierText);
  visual.append(image ?? createEquipmentImagePlaceholder(category), text);
  return visual;
}

function createEquipmentImagePlaceholder(category) {
  const placeholder = document.createElement("div");
  placeholder.className = "equipment-icon-placeholder";
  placeholder.textContent = getEquipmentCategoryLabel(category).slice(0, 1);
  return placeholder;
}

function createEquipmentSelect({ label, value, options, disabled = false, onChange }) {
  const field = document.createElement("label");
  field.className = "compact-field";
  field.textContent = label;

  const select = document.createElement("select");
  select.className = "equipment-tier-select";
  select.setAttribute("aria-label", label);
  select.append(...options.map(([optionValue, optionLabel]) => new Option(optionLabel, optionValue)));
  select.value = String(value);
  select.disabled = disabled;
  select.addEventListener("change", () => onChange(select.value));

  field.append(select);
  return field;
}

function createTierOptions({ minTier = EQUIPMENT_TIER_RANGE.min, maxTier = EQUIPMENT_TIER_RANGE.max } = {}) {
  const options = [];

  for (let tier = EQUIPMENT_TIER_RANGE.min; tier <= maxTier; tier += 1) {
    if (tier >= minTier) {
      options.push([String(tier), `T${tier}`]);
    }
  }

  return options;
}

function getEquipmentImageUrl(category, tier) {
  const equipment = getEquipmentByCategoryAndTier(category, tier);
  const icon = equipment?.icon ?? equipment?.Icon ?? equipment?.raw?.Icon;

  if (!icon) {
    return "";
  }

  if (String(icon).startsWith("./") || String(icon).startsWith("http")) {
    return icon;
  }

  const fileName = toEquipmentIconFileName(icon);
  const filePrefix = EQUIPMENT_ICON_81PX_FILE_NAMES.has(fileName) ? "81px-" : "";
  return `./images/items/Equipment_Icon/${filePrefix}${fileName}.png`;
}

function getEquipmentByCategoryAndTier(category, tier) {
  const categoryRows = equipmentMaterialData?.equipmentByCategory?.get(category);

  if (categoryRows instanceof Map) {
    return categoryRows.get(Number(tier)) ?? categoryRows.get(String(tier));
  }

  return undefined;
}

function getMaxEquipmentTierByCategory(category) {
  const categoryRows = equipmentMaterialData?.equipmentByCategory?.get(category);

  if (categoryRows instanceof Map) {
    const tiers = [...categoryRows.keys()]
      .map((tier) => Number(tier))
      .filter((tier) => Number.isFinite(tier) && tier >= EQUIPMENT_TIER_RANGE.min);

    if (tiers.length > 0) {
      return Math.max(...tiers);
    }
  }

  return EQUIPMENT_TIER_RANGE.max;
}

function getEquipmentCategoryLabel(category) {
  return EQUIPMENT_CATEGORY_LABELS[category] ?? category ?? "장비";
}

function toEquipmentIconFileName(icon) {
  return String(icon)
    .split("_")
    .map((part) => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
    .join("_");
}

function calculateCurrentEquipmentMaterials(student) {
  ensureEquipmentStateForStudent(student);

  if (!equipmentMaterialData) {
    return {
      requiredMaterials: [],
      slotResults: [],
      hasData: false,
      needsReview: true,
    };
  }

  return calculateEquipmentMaterials({
    student,
    equipmentState,
    equipmentById: equipmentMaterialData.equipmentById,
    equipmentByCategory: equipmentMaterialData.equipmentByCategory,
    itemsById: equipmentMaterialData.itemsById,
    currencyById: equipmentMaterialData.currencyById,
    inventory: getUserInventory(),
    levelCostRows: equipmentMaterialData.levelCostRows,
  });
}

function calculateCurrentAbilityUnlockMaterials(student) {
  ensureAbilityUnlockStateForStudent(student);

  return calculateAbilityUnlockMaterials({
    student,
    abilityUnlockState,
    itemsById: equipmentMaterialData?.displayItemsById ?? equipmentMaterialData?.itemsById,
    inventory: getUserInventory(),
  });
}

function calculateCurrentCharacterLevelMaterials(student) {
  ensureGrowthStateForStudent(student);
  const result = calculateCharacterLevelMaterials({
    currentLevel: studentLevelState.currentLevel,
    targetLevel: studentLevelState.targetLevel,
  });

  const levelMaterialResult = normalizeMaterialResult({
    materials: result.materials,
    source: "level",
    hasData: result.hasCompleteData,
    needsReview: result.needsReview,
    missingData: result.missingLevels?.map((level) => `MISSING_STUDENT_LEVEL_${level}`) ?? [],
  });
  console.log("[required materials] level result", levelMaterialResult);
  return levelMaterialResult;
}

function calculateCurrentSkillMaterials(student) {
  ensureGrowthStateForStudent(student);
  const skillRequirementStudentId = getSkillRequirementStudentId(student);
  const slotResults = SKILL_SLOT_CONFIG
    .filter((slot) => SKILL_LEVEL_RANGES[slot.key])
    .map((slot) => calculateSkillMaterials({
      studentId: skillRequirementStudentId,
      skillType: slot.key,
      currentLevel: skillLevelState[slot.key]?.currentLevel,
      targetLevel: skillLevelState[slot.key]?.targetLevel,
      requirements: skillMaterialRequirements,
    }));

  const skillMaterialResult = normalizeMaterialResult({
    materials: slotResults.flatMap((result) => result.materials),
    source: "skill",
    hasData: slotResults.every((result) => result.hasData && result.hasCompleteData),
    needsReview: slotResults.some((result) => result.needsReview || !result.hasData),
    missingData: slotResults.flatMap((result) => [
      ...(!result.hasData ? [`MISSING_SKILL_DATA_${result.skillType}`] : []),
      ...result.missingRows.map((row) => `MISSING_SKILL_${result.skillType}_${row.fromLevel}_${row.toLevel}`),
    ]),
  });
  console.log("[required materials] skill result", {
    activeStudent: student,
    skillRequirementStudentId,
    skillLevelState,
    slotResults,
    skillMaterialResult,
  });
  return skillMaterialResult;
}

function getSkillRequirementStudentId(student) {
  const directId = Number(student?.id);

  if (skillMaterialRequirements.some((row) => Number(row.studentId) === directId)) {
    return directId;
  }

  const candidates = new Set([
    student?.slug,
    student?.pathName,
    student?.name,
    student?.devName,
    student?.raw?.PathName,
    student?.raw?.DevName,
    student?.raw?.Name,
    student?.raw?.NameEn,
  ].filter(Boolean).map((value) => normalizeSearchText(value)));

  const matchedRequirement = skillMaterialRequirements.find((row) => {
    return candidates.has(normalizeSearchText(row.studentName));
  });

  return Number(matchedRequirement?.studentId ?? directId);
}

function calculateCurrentExclusiveWeaponMaterials(student) {
  const result = calculateExclusiveWeaponMaterials({
    weaponType: student?.weaponType,
    targetWeaponStar: selectedWeaponStar,
  });

  return normalizeMaterialResult({
    materials: result.materials,
    source: "exclusive_weapon",
    hasData: result.hasCompleteData,
    needsReview: result.needsReview,
    missingData: result.missingRows?.map((row) => `MISSING_WEAPON_LEVEL_${row.fromLevel}_${row.toLevel}`) ?? [],
  });
}

function calculateCurrentRequiredMaterials(student) {
  console.log("[required materials] active student", student);
  const characterLevelResult = calculateCurrentCharacterLevelMaterials(student);
  const skillResult = calculateCurrentSkillMaterials(student);
  const starMaterialResult = {
    requiredMaterials: [],
    hasData: true,
    needsReview: false,
    skipped: true,
    reason: "성급 상승 재화는 현재 필요한 재화 합산 대상에서 제외",
  };
  console.log("[required materials] star result", starMaterialResult);
  const equipmentResult = calculateCurrentEquipmentMaterials(student);
  const abilityUnlockResult = calculateCurrentAbilityUnlockMaterials(student);
  const exclusiveWeaponResult = calculateCurrentExclusiveWeaponMaterials(student);
  const mergedRequiredMaterials = mergeRequiredMaterials({
    results: [
      characterLevelResult,
      skillResult,
      equipmentResult,
      abilityUnlockResult,
      exclusiveWeaponResult,
    ],
    itemsById: equipmentMaterialData?.displayItemsById,
    inventory: getUserInventory(),
  });
  console.log("[required materials] merged", mergedRequiredMaterials);
  return mergedRequiredMaterials;
}

function ensureEquipmentStateForStudent(student) {
  if (equipmentStateStudentId === Number(student?.id)) {
    return;
  }

  const slots = Array.isArray(student?.equipmentSlots) ? student.equipmentSlots : [];
  equipmentStateStudentId = Number(student?.id);
  equipmentState = Object.fromEntries(
    slots.map((category, index) => [`slot${index + 1}`, createDefaultEquipmentSlotState(category)]),
  );
}

function ensureAbilityUnlockStateForStudent(student) {
  if (abilityUnlockStateStudentId === Number(student?.id)) {
    return;
  }

  abilityUnlockStateStudentId = Number(student?.id);
  abilityUnlockState = structuredClone(DEFAULT_ABILITY_UNLOCK_STATE);
}

function ensureGrowthStateForStudent(student) {
  if (growthStateStudentId === Number(student?.id)) {
    return;
  }

  growthStateStudentId = Number(student?.id);
  studentLevelState = {
    currentLevel: 1,
    targetLevel: getMaxStudentLevel(),
  };
  skillLevelState = createDefaultSkillLevelState();
}

function createDefaultEquipmentSlotState(category) {
  return {
    currentTier: 1,
    currentState: CURRENT_EQUIPMENT_STATES.LV1,
    targetTier: getMaxEquipmentTierByCategory(category),
  };
}

function updateEquipmentSlotState(student, slotIndex, partialState) {
  ensureEquipmentStateForStudent(student);
  const slotKey = `slot${slotIndex + 1}`;
  const category = student?.equipmentSlots?.[slotIndex];
  equipmentState[slotKey] = {
    ...createDefaultEquipmentSlotState(category),
    ...(equipmentState[slotKey] ?? {}),
    ...partialState,
  };

  if (equipmentState[slotKey].targetTier < equipmentState[slotKey].currentTier) {
    equipmentState[slotKey].targetTier = equipmentState[slotKey].currentTier;
  }

  renderEquipmentCards(student);
  updateRequiredMaterials(student);
}

function updateStudentLevelState(partialState) {
  if (!activeStudentForMaterials) {
    return;
  }

  ensureGrowthStateForStudent(activeStudentForMaterials);
  studentLevelState = normalizeStudentLevelState({
    ...studentLevelState,
    ...partialState,
  });
  renderStudentLevelControls(activeStudentForMaterials);
  updateRequiredMaterials(activeStudentForMaterials);
}

function updateSkillLevelState(skillType, partialState) {
  if (!activeStudentForMaterials) {
    return;
  }

  ensureGrowthStateForStudent(activeStudentForMaterials);
  skillLevelState[skillType] = normalizeSkillSlotState(skillType, {
    ...(skillLevelState[skillType] ?? {}),
    ...partialState,
  });
  renderSkillCards(activeStudentForMaterials);
  updateRequiredMaterials(activeStudentForMaterials);
}

function updateAbilityUnlockState(student, bonusKey, partialState) {
  ensureAbilityUnlockStateForStudent(student);
  abilityUnlockState[bonusKey] = {
    ...(abilityUnlockState[bonusKey] ?? { currentLevel: 0, targetLevel: 0 }),
    ...partialState,
  };
  abilityUnlockState = normalizeAbilityUnlockState(abilityUnlockState);

  renderAbilityUnlockSection(student);
  updateRequiredMaterials(student);
}

function updateRequiredMaterials(student) {
  console.log("[required materials] update called", {
    student,
    container: materialList,
  });
  renderRequiredMaterialsSection(calculateCurrentRequiredMaterials(student));
}

function renderRequiredMaterialsSection(requiredMaterialResult) {
  console.log("[required materials] container", materialList);
  console.log("[required materials] render input", requiredMaterialResult);
  if (!requiredMaterialResult) {
    updateRequiredMaterialSummary(null);
    replaceWithNotice(materialList, "재화 데이터를 불러오지 못했습니다.");
    return;
  }

  if (requiredMaterialResult.requiredMaterials.length === 0) {
    updateRequiredMaterialSummary(requiredMaterialResult);
    replaceWithNotice(
      materialList,
      requiredMaterialResult.needsReview ? "재화 데이터 확인 필요" : "필요 재화 없음",
    );
    return;
  }

  const cards = requiredMaterialResult.requiredMaterials.map(createMaterialCard);
  updateRequiredMaterialSummary(requiredMaterialResult);

  if (requiredMaterialResult.needsReview) {
    cards.push(createNotice("일부 재화 데이터는 검수 필요 상태입니다."));
  }

  materialList.replaceChildren(...cards);
}

function updateRequiredMaterialSummary(requiredMaterialResult) {
  if (!requiredMaterialCount) {
    return;
  }

  if (!requiredMaterialResult) {
    requiredMaterialCount.textContent = "계산 실패";
    return;
  }

  const materials = requiredMaterialResult.requiredMaterials ?? [];
  const skillCount = materials.filter((material) => material.sources?.includes("skill")).length;

  if (materials.length === 0) {
    requiredMaterialCount.textContent = requiredMaterialResult.needsReview ? "검수 필요" : "필요 재화 없음";
    return;
  }

  requiredMaterialCount.textContent = skillCount > 0
    ? `총 ${materials.length}개 · 스킬 ${skillCount}개 포함`
    : `총 ${materials.length}개`;
}

function normalizeMaterialResult({ materials = [], source, hasData = true, needsReview = false, missingData = [] } = {}) {
  return {
    requiredMaterials: materials.map((material) => ({
      itemId: material.itemId ?? "",
      name: material.name ?? material.itemName ?? null,
      requiredQuantity: Number(material.requiredQuantity ?? material.quantity ?? 0),
      icon: material.icon ?? "",
      category: material.category ?? source,
      sources: [source],
      needsReview: Boolean(material.needsReview),
    })),
    hasData,
    needsReview,
    missingData,
  };
}

function mergeRequiredMaterials({ results = [], itemsById, inventory } = {}) {
  const materialMap = new Map();
  const missingData = [];
  const inventoryMap = createInventoryMap(inventory);

  results.forEach((result) => {
    if (!result) {
      return;
    }

    if (Array.isArray(result.missingData)) {
      missingData.push(...result.missingData);
    }

    (result.requiredMaterials ?? []).forEach((material) => {
      const materialKey = material.itemId || material.category;

      if (!materialKey) {
        return;
      }

      const existing = materialMap.get(String(materialKey));
      const item = getItemFromMapLike(itemsById, material.itemId);
      const requiredQuantity = Number(material.requiredQuantity ?? 0);

      if (existing) {
        existing.requiredQuantity += requiredQuantity;
        existing.sources = mergeSources(existing.sources, material.sources ?? material.category);
        existing.ownedQuantity = getOwnedQuantity(inventoryMap, existing.itemId);
        existing.missingQuantity = Math.max(0, existing.requiredQuantity - existing.ownedQuantity);
        existing.needsReview = existing.needsReview || Boolean(material.needsReview);
        return;
      }

      const itemId = material.itemId ? String(material.itemId) : "";
      const ownedQuantity = getOwnedQuantity(inventoryMap, itemId);
      materialMap.set(String(materialKey), {
        ...material,
        itemId,
        name: item?.name ?? item?.Name ?? material.name ?? "재화 이름 확인 필요",
        icon: resolveDisplayItemIcon(item) || material.icon || "",
        requiredQuantity,
        ownedQuantity,
        missingQuantity: Math.max(0, requiredQuantity - ownedQuantity),
        sources: mergeSources([], material.sources ?? material.category),
        needsReview: Boolean(material.needsReview) || Boolean(item?.needsReview),
      });
    });
  });

  const requiredMaterials = [...materialMap.values()];
  return {
    requiredMaterials,
    materials: requiredMaterials,
    hasData: results.every((result) => result?.hasData),
    needsReview: results.some((result) => result?.needsReview),
    missingData,
  };
}

function normalizeStudentLevelState(state) {
  const maxLevel = getMaxStudentLevel();
  const currentLevel = clampInteger(state.currentLevel, 1, maxLevel);
  const targetLevel = clampInteger(state.targetLevel, 1, maxLevel);

  return {
    currentLevel,
    targetLevel: Math.max(currentLevel, targetLevel),
  };
}

function normalizeSkillSlotState(skillType, state) {
  const range = SKILL_LEVEL_RANGES[skillType] ?? { min: 1, max: 10 };
  const currentLevel = clampInteger(state.currentLevel, range.min, range.max);
  const targetLevel = clampInteger(state.targetLevel, range.min, range.max);

  return {
    currentLevel,
    targetLevel: Math.max(currentLevel, targetLevel),
  };
}

function getMaxStudentLevel() {
  const maxLevel = Number(studentLevelInput?.max ?? studentLevelRange?.max ?? 90);
  return Number.isFinite(maxLevel) ? maxLevel : 90;
}

function getItemFromMapLike(source, itemId) {
  if (itemId === null || itemId === undefined || itemId === "") {
    return null;
  }

  if (source instanceof Map) {
    return source.get(String(itemId)) ?? source.get(Number(itemId)) ?? null;
  }

  if (source && typeof source === "object") {
    return source[itemId] ?? null;
  }

  return null;
}

function resolveDisplayItemIcon(item) {
  const icon = item?.imageUrl ?? item?.icon ?? item?.Icon ?? "";

  if (!icon) {
    return "";
  }

  if (String(icon).startsWith("./") || String(icon).startsWith("http")) {
    return icon;
  }

  return `./images/items/${icon}.png`;
}

function createInventoryMap(userInventory) {
  if (userInventory instanceof Map) {
    return new Map([...userInventory.entries()].map(([itemId, quantity]) => [
      String(itemId),
      Number(quantity) || 0,
    ]));
  }

  if (Array.isArray(userInventory)) {
    return new Map(userInventory
      .filter((item) => item?.itemId)
      .map((item) => [String(item.itemId), Number(item.quantity) || 0]));
  }

  if (userInventory && typeof userInventory === "object") {
    return new Map(Object.entries(userInventory).map(([itemId, quantity]) => [
      String(itemId),
      Number(quantity) || 0,
    ]));
  }

  return new Map();
}

function getOwnedQuantity(inventoryMap, itemId) {
  if (!itemId) {
    return 0;
  }

  return inventoryMap.get(String(itemId)) ?? 0;
}

function mergeSources(existingSources = [], source) {
  const sources = Array.isArray(source) ? source : [source];
  return [...new Set([
    ...existingSources.filter(Boolean),
    ...sources.filter(Boolean),
  ])];
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）]/g, "");
}

function createMaterialCard(material) {
  const card = document.createElement("article");
  card.className = "material-card";

  const image = createMaterialImage(material);
  const content = document.createElement("div");

  const titleRow = document.createElement("div");
  titleRow.className = "material-title-row";

  const title = document.createElement("h3");
  title.textContent = material.name ?? "재화 이름 확인 필요";
  titleRow.append(title);

  if (material.needsReview) {
    const badge = document.createElement("span");
    badge.className = "material-review-badge";
    badge.textContent = "검수 필요";
    titleRow.append(badge);
  }

  const required = document.createElement("p");
  const requiredLabel = document.createElement("strong");
  requiredLabel.textContent = "필요";
  required.append(requiredLabel, ` ${formatQuantity(material.requiredQuantity)}`);

  const owned = document.createElement("p");
  owned.className = "material-owned-quantity";
  owned.textContent = `보유 ${formatQuantity(material.ownedQuantity)}`;

  const missing = document.createElement("p");
  missing.className = "material-shortage-quantity";
  missing.textContent = `부족 ${formatQuantity(material.missingQuantity)}`;

  content.append(titleRow, required, owned, missing);
  card.append(image, content);
  return card;
}

function createMaterialImage(material) {
  const icon = material?.icon;

  if (!icon) {
    const fallback = document.createElement("div");
    fallback.className = "material-image-placeholder";
    fallback.textContent = "재";
    return fallback;
  }

  const image = document.createElement("img");
  image.className = "material-image";
  image.src = icon;
  image.alt = material.name ?? "재화";
  image.loading = "lazy";
  image.addEventListener("error", () => {
    const fallback = document.createElement("div");
    fallback.className = "material-image-placeholder";
    fallback.textContent = "재";
    image.replaceWith(fallback);
  }, { once: true });
  return image;
}

function formatQuantity(value) {
  return Number(value ?? 0).toLocaleString("ko-KR");
}

function renderUniqueItem(student) {
  const gear = student.gear ?? student.uniqueItem ?? null;

  if (!favoriteItemPanel || !favoriteItemCard) {
    return;
  }

  if (!gear) {
    favoriteItemPanel.hidden = true;
    favoriteItemCard.replaceChildren();
    return;
  }

  favoriteItemPanel.hidden = false;
  const selectedTier = favoriteItemCard.querySelector(".equipment-tier-select")?.value ?? "none";

  const icon = document.createElement("div");
  icon.className = "equipment-icon-placeholder favorite-icon-placeholder";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "애";

  const content = document.createElement("div");
  content.className = "equipment-content";

  const titleRow = document.createElement("div");
  titleRow.className = "equipment-title-row";

  const title = document.createElement("h3");
  title.textContent = gear.name || gear.Name || "애장품 이름 확인 필요";

  const tierSelect = document.createElement("select");
  tierSelect.className = "equipment-tier-select";
  tierSelect.setAttribute("aria-label", "애장품 티어");
  tierSelect.append(
    new Option("미선택", "none"),
    new Option("1티어", "tier1"),
    new Option("2티어", "tier2"),
  );
  tierSelect.value = selectedTier;
  tierSelect.addEventListener("change", () => renderUniqueItem(student));

  const note = document.createElement("p");
  note.textContent = gear.desc || gear.Desc || "애장품 효과 확인 필요";

  const enhancedSkillSection = createEnhancedSkillSection({
    title: "애장품 2티어 강화 스킬",
    skills: selectedTier === "tier2" ? getEnhancedSkills(student, "normalPlus") : [],
    emptyMessage: selectedTier === "tier2"
      ? "애장품 강화 스킬 데이터 확인 필요"
      : "2티어 선택 시 강화 스킬 정보를 표시합니다.",
  });

  titleRow.append(title, tierSelect);
  content.append(titleRow, note, enhancedSkillSection);
  favoriteItemCard.replaceChildren(icon, content);
}

function resetGrowthState(student) {
  selectedGrowthStar = getBaseStar(student);
  selectedWeaponStar = 0;
}

function getBaseStar(student) {
  const star = Number(student?.star ?? student?.baseStar ?? student?.raw?.StarGrade ?? 0);
  return Number.isFinite(star) ? clampStarValue(star, 0, 5) : 0;
}

function clampStarValue(value, min, max) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return min;
  }

  return Math.min(Math.max(numberValue, min), max);
}

function clampInteger(value, min, max) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(numberValue)));
}

function renderWeapon(student) {
  const exclusiveWeapon = student.exclusiveWeapon ?? {};
  const weaponName = exclusiveWeapon.name || student.weapon?.Name || student.weapon?.name || "전용무기 확인 필요";
  const star4Effect = getExclusiveWeaponStar4Effect(student, selectedWeaponStar);
  exclusiveWeaponName.textContent = weaponName;

  if (exclusiveWeaponDesc) {
    exclusiveWeaponDesc.textContent = exclusiveWeapon.desc || student.weapon?.Desc || "전용무기 설명 확인 필요";
  }

  if (exclusiveWeaponRank3Effect) {
    exclusiveWeaponRank3Effect.textContent = formatTerrainBonus(exclusiveWeapon.star3TerrainBonus);
  }

  exclusiveWeaponRank4Effect.textContent = star4Effect?.label ?? "전용무기 4성 이상 선택 시 효과를 표시합니다.";
  exclusiveWeaponEnhancedSkill.textContent = selectedWeaponStar >= 2
    ? "전용무기 2성 강화 스킬"
    : "전용무기 2성 이상 선택 시 강화 스킬 정보를 표시합니다.";
  exclusiveWeaponEnhancedStats.replaceChildren(createEnhancedSkillSection({
    title: "강화 스킬+",
    skills: selectedWeaponStar >= 2 ? getEnhancedSkills(student, "passivePlus") : [],
    emptyMessage: selectedWeaponStar >= 2
      ? "전용무기 강화 스킬 데이터 확인 필요"
      : "전용무기 2성 이상 선택 시 표시됩니다.",
  }));

  exclusiveWeaponImageSlot.replaceChildren();
  exclusiveWeaponImageSlot.textContent = "W";
  exclusiveWeaponImageSlot.classList.remove("has-weapon-image");
}

function renderMemorialPlaceholder() {
  if (!memorialSlot) {
    return;
  }

  memorialSlot.replaceChildren(createNotice("메모리얼 데이터 확인 필요"));
}

function renderLoadingState() {
  renderFormSwitcher(null);
  characterProfileName.textContent = "학생 정보를 불러오는 중...";
  characterProfileDescription.textContent = "";
}

function renderErrorState(message) {
  renderFormSwitcher(null);
  characterProfileName.textContent = message;
  characterProfileDescription.textContent = "잠시 후 다시 시도해주세요.";
  replaceWithNotice(skillList, message);
  replaceWithNotice(materialList, message);
}

function getStudentImageUrl(student) {
  return student.raw?.PortraitImageUrl ?? student.raw?.portraitImageUrl ?? null;
}

function getAcademyDisplayName(student) {
  const schoolName = getDisplayLabel("school", student.school);
  return schoolName === "확인 필요" ? schoolName : `${schoolName} 학원`;
}

function getTerrainRank(terrainEntry) {
  if (typeof terrainEntry === "string") {
    return terrainEntry;
  }

  return terrainEntry?.rank ?? null;
}

function formatTerrainBonus(bonus) {
  if (!bonus || bonus.needsReview || !bonus.terrain || bonus.value === null || bonus.value === undefined) {
    return "전용무기 3성 지역 적성 효과 확인 필요";
  }

  const label = TERRAIN_META.find(([key]) => key === bonus.terrain)?.[1] ?? "지역";
  return `${label} 적성 +${bonus.value}`;
}

function getDisplayLabel(type, value) {
  if (value === null || value === undefined || value === "") {
    return "확인 필요";
  }

  return getSchaleLabel(type, value, displayLanguage);
}

function updateLanguageButtons() {
  syncLanguageButtons(displayLanguage, languageButtons);
}

function getSkillName(skill, slot) {
  return skill?.Name || skill?.name || slot.label;
}

function getSkillDescription(skill) {
  return skill?.Desc || skill?.Description || skill?.desc || skill?.description || "스킬 효과 확인 필요";
}

function replaceWithNotice(target, message) {
  if (!target) {
    return;
  }

  target.replaceChildren(createNotice(message));
}

function createNotice(message) {
  const notice = document.createElement("p");
  notice.className = "material-empty-message";
  notice.textContent = message;
  return notice;
}
