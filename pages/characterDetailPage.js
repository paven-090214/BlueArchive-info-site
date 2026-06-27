import {
  getAllEquipmentByLocale,
  getStudentByIdByLocale,
  getStudentBySlugByLocale,
  getStudentGroupByIdByLocale,
  getStudentGroupByStudentIdByLocale,
} from "../data/schaledb/schaleDbStore.js";
import { getSchaleLabel } from "../data/schaledb/schaleDbLabels.js";
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
import {
  applyStudentImageFallback,
  resolveStudentImage,
} from "../utils/studentImageResolver.js";

const PENDING_CALCULATOR_STORAGE_KEY = "ba-material-calculator-pending-student";

const characterProfileName = document.querySelector("#character-profile-name");
const characterProfileDescription = document.querySelector("#character-profile-description");
const characterProfileVisual = document.querySelector(".character-large-placeholder");
const characterDetailGrid = document.querySelector(".character-detail-grid");
const skillList = document.querySelector(".skill-list");
const terrainAptitudeList = document.querySelector(".terrain-aptitude-list");
const roleImage = document.querySelector("[data-role-image]");
const detailViewControls = document.querySelector("[data-detail-view-controls]");
const studentStatGrid = document.querySelector("[data-student-stat-grid]");
const addCurrentToCalculatorButton = document.querySelector("[data-add-current-to-calculator]");
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
const BLUE_STAR_ICON_URL = "./images/icon/Icon_blue_star.webp";

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

const ROLE_IMAGE_URLS = {
  DamageDealer: "./images/role/attacker.webp",
  Tanker: "./images/role/tank.webp",
  Healer: "./images/role/healer.webp",
  Supporter: "./images/role/support.webp",
};

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

const SKILL_SLOT_CONFIG = [
  { key: "ex", plusKey: null, label: "EX 스킬", iconText: "EX", maxLevel: 5 },
  { key: "normal", plusKey: "normalPlus", label: "기본 스킬", iconText: "1", maxLevel: 10 },
  { key: "passive", plusKey: "passivePlus", label: "강화 스킬", iconText: "2", maxLevel: 10 },
  { key: "sub", plusKey: null, label: "서브 스킬", iconText: "3", maxLevel: 10 },
];

const UNIQUE_WEAPON_MAX_LEVEL_BY_STAR = {
  0: 0,
  1: 30,
  2: 40,
  3: 50,
  4: 70,
};

const STAT_CONFIGS = [
  { key: "attackPower", label: "공격력", raw1: "AttackPower1", raw100: "AttackPower100" },
  { key: "defensePower", label: "방어력", raw1: "DefensePower1", raw100: "DefensePower100" },
  { key: "maxHp", label: "체력", raw1: "MaxHP1", raw100: "MaxHP100" },
  { key: "healPower", label: "치유력", raw1: "HealPower1", raw100: "HealPower100" },
  { key: "accuracyPoint", label: "명중", raw: "AccuracyPoint" },
  { key: "dodgePoint", label: "회피", raw: "DodgePoint" },
  { key: "criticalPoint", label: "치명 수치", raw: "CriticalPoint" },
  { key: "criticalDamageRate", label: "치명 대미지", raw: "CriticalDamageRate", percentBase: 10000 },
  { key: "stabilityPoint", label: "안정성", raw: "StabilityPoint" },
  { key: "range", label: "사거리", raw: "Range" },
  { key: "ccPower", label: "CC 강화력", raw: "OppressionPower" },
  { key: "ccResist", label: "CC 저항력", raw: "OppressionResist" },
  { key: "attackSpeed", label: "공격 속도", raw: "AttackSpeed" },
  { key: "moveSpeed", label: "이동 속도", raw: "MoveSpeed" },
  { key: "regenCost", label: "코스트 회복력", raw: "RegenCost" },
  { key: "ammoCount", label: "탄약", raw: "AmmoCount" },
];

const STAT_TYPE_TO_KEY = {
  AttackPower: "attackPower",
  AttackPower_Base: "attackPower",
  AttackPower_Coefficient: "attackPower",
  DefensePower: "defensePower",
  DefensePower_Base: "defensePower",
  MaxHP: "maxHp",
  MaxHP_Base: "maxHp",
  MaxHP_Coefficient: "maxHp",
  HealPower: "healPower",
  HealPower_Base: "healPower",
  HealPower_Coefficient: "healPower",
  AccuracyPoint: "accuracyPoint",
  AccuracyPoint_Base: "accuracyPoint",
  DodgePoint: "dodgePoint",
  DodgePoint_Base: "dodgePoint",
  CriticalPoint: "criticalPoint",
  CriticalPoint_Base: "criticalPoint",
  CriticalDamageRate: "criticalDamageRate",
  CriticalDamageRate_Base: "criticalDamageRate",
  StabilityPoint: "stabilityPoint",
  StabilityPoint_Base: "stabilityPoint",
};

let displayLanguage = getPreferredLanguage();
let activeContext = null;
let activeStudent = null;
let equipmentByCategory = new Map();
let detailViewState = createDefaultDetailViewState();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCharacterDetailPage);
} else {
  initializeCharacterDetailPage();
}

async function initializeCharacterDetailPage() {
  renderLoadingState();
  bindLanguageButtons();

  try {
    await loadAndRenderCurrentStudent();
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
        await loadAndRenderCurrentStudent();
      } catch (error) {
        console.error(error);
        renderErrorState("학생 정보를 불러오지 못했습니다.");
      }
    });
  });
  updateLanguageButtons();
}

async function loadAndRenderCurrentStudent() {
  const locale = getSchaleLocale(displayLanguage);
  const [detailContext, equipmentList] = await Promise.all([
    loadSelectedStudentContext(locale),
    getAllEquipmentByLocale(locale),
  ]);

  if (!detailContext?.activeForm?.student) {
    renderErrorState("학생 정보를 찾을 수 없습니다.");
    return;
  }

  equipmentByCategory = createEquipmentByCategory(equipmentList);
  activeContext = detailContext;
  renderStudentDetailContext(detailContext);
}

async function loadSelectedStudentContext(locale) {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("groupId");
  const id = params.get("id");
  const slug = params.get("slug");
  const formId = params.get("formId");

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
  activeStudent = student;
  detailViewState = createDefaultDetailViewState(student);
  document.title = `${student.name ?? "학생 상세"} | BlueArchive Info Site`;

  renderFormSwitcher(group, activeForm);
  renderProfile(student);
  renderBasicFields(student);
  renderViewControls(student);
  renderPreview(student);
  bindCalculatorButton(student);
}

function renderPreview(student) {
  renderTerrainAdaptations(student);
  renderStats(student);
  renderSkillCards(student);
  renderUniqueItem(student);
  renderWeapon(student);
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

  const buttonList = document.createElement("div");
  buttonList.className = "character-form-list";
  buttonList.dataset.characterFormList = "";

  titleGroup.append(eyebrow, title);
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
  const profileIcon = document.createElement("img");
  profileIcon.className = "character-profile-icon";
  profileIcon.src = resolveStudentImage(student, "icon");
  profileIcon.alt = `${name} 아이콘`;
  profileIcon.loading = "lazy";
  applyStudentImageFallback(profileIcon);

  const nameText = document.createElement("span");
  nameText.textContent = name;
  characterProfileName.replaceChildren(profileIcon, nameText);
  characterProfileDescription.textContent = student.profile ?? "프로필 데이터 확인 필요";

  if (roleImage) {
    roleImage.src = ROLE_IMAGE_URLS[student.role] || "./images/duuu/duuu.webp";
    roleImage.alt = getDisplayLabel("role", student.role);
  }

  characterProfileVisual.replaceChildren();
  const image = document.createElement("img");
  image.src = resolveStudentImage(student, "portrait");
  image.alt = name;
  image.className = "character-profile-image";
  applyStudentImageFallback(image);
  characterProfileVisual.append(image);
}

function renderBasicFields(student) {
  const fieldValues = {
    fullName: student.name ?? "확인 필요",
    birthday: student.birthday ?? "확인 필요",
    academyName: getAcademyDisplayName(student),
    clubName: getDisplayLabel("club", student.club),
    attackType: getDisplayLabel("attackType", student.attackType),
    defenseType: getDisplayLabel("defenseType", student.defenseType),
    role: getDisplayLabel("role", student.role),
    position: getDisplayLabel("position", student.position),
    combatClass: getDisplayLabel("squadType", student.squadType),
    age: student.age ?? "확인 필요",
    weaponType: student.weaponType ?? "확인 필요",
    equipmentSlots: getEquipmentSlotLabels(student).join(" / ") || "확인 필요",
    hobby: student.hobby ?? "확인 필요",
    designer: student.designer ?? "확인 필요",
    illustrator: student.illustrator ?? "확인 필요",
    voiceActor: student.voice ?? "확인 필요",
  };

  Object.entries(fieldValues).forEach(([field, value]) => {
    const target = document.querySelector(`[data-student-field="${field}"]`);

    if (target) {
      target.textContent = value;
    }
  });

  renderBaseStarField(student);
}

function renderBaseStarField(student) {
  const target = document.querySelector('[data-student-field="baseStar"]');

  if (!target) {
    return;
  }

  const baseStar = getBaseStar(student);
  const starList = document.createElement("span");
  starList.className = "base-star-display";
  starList.setAttribute("aria-label", `기본 ${baseStar}성`);

  for (let index = 1; index <= baseStar; index += 1) {
    const image = document.createElement("img");
    image.className = "base-star-icon";
    image.src = STAR_ICON_URL;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    starList.append(image);
  }

  target.replaceChildren(starList);
}

function renderViewControls(student) {
  if (!detailViewControls) {
    return;
  }

  const equipmentSlots = Array.isArray(student.equipmentSlots) ? student.equipmentSlots.slice(0, 3) : [];
  const controls = [
    createNumberField({
      label: "학생 레벨",
      value: detailViewState.studentLevel,
      min: 1,
      max: 90,
      onChange: (value) => updateDetailViewState({ studentLevel: value }),
    }),
    createStarRankField({
      label: "학생 성급",
      baseStar: getBaseStar(student),
      value: getCombinedStarRank(detailViewState),
      onChange: (value) => updateDetailViewState(createStateFromCombinedStarRank(value)),
    }),
    createNumberField({
      label: "전용무기 레벨",
      value: detailViewState.uniqueWeaponLevel,
      min: detailViewState.uniqueWeaponStar > 0 ? 1 : 0,
      max: getUniqueWeaponMaxLevel(detailViewState.uniqueWeaponStar),
      disabled: detailViewState.uniqueWeaponStar === 0,
      onChange: (value) => updateDetailViewState({ uniqueWeaponLevel: value }),
    }),
  ];

  equipmentSlots.forEach((slot, index) => {
    const slotKey = `slot${index + 1}`;
    controls.push(createEquipmentControlCard({
      slot,
      slotIndex: index + 1,
      tier: detailViewState.equipment[slotKey] ?? 0,
      onChange: (value) => updateDetailViewState({
        equipment: {
          ...detailViewState.equipment,
          [slotKey]: Number(value),
        },
      }),
    }));
  });

  detailViewControls.replaceChildren(...controls);
}

function updateDetailViewState(partialState) {
  detailViewState = normalizeDetailViewState({
    ...detailViewState,
    ...partialState,
  }, activeStudent);
  renderViewControls(activeStudent);
  renderPreview(activeStudent);
}

function renderTerrainAdaptations(student) {
  const effectiveTerrain = getEffectiveTerrain(student, detailViewState.uniqueWeaponStar);
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

function renderStats(student) {
  const stats = calculateDisplayStats(student, detailViewState);
  const items = STAT_CONFIGS.map((config) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = config.label;
    description.textContent = formatStatValue(stats[config.key], config);
    row.append(term, description);
    return row;
  });

  studentStatGrid.replaceChildren(...items);
}

function calculateDisplayStats(student, state) {
  const raw = student?.raw ?? {};
  const stats = {};

  STAT_CONFIGS.forEach((config) => {
    if (config.raw1 && config.raw100) {
      stats[config.key] = interpolateLevelValue(raw[config.raw1], raw[config.raw100], state.studentLevel);
      return;
    }

    stats[config.key] = toNullableNumber(raw[config.raw]);
  });

  applyEquipmentStats(stats, student, state);
  applyUniqueItemStats(stats, student, state);
  applyExclusiveWeaponStats(stats, student, state);
  return stats;
}

function applyEquipmentStats(stats, student, state) {
  const slots = Array.isArray(student?.equipmentSlots) ? student.equipmentSlots : [];

  slots.forEach((category, index) => {
    const slotKey = `slot${index + 1}`;
    const tier = Number(state.equipment?.[slotKey] ?? 0);

    if (tier <= 0) {
      return;
    }

    const equipment = equipmentByCategory.get(category)?.get(tier);
    applyStatTypeValues(stats, equipment?.statType, equipment?.statValue);
  });
}

function applyUniqueItemStats(stats, student, state) {
  if (Number(state.favoriteItemTier) <= 0) {
    return;
  }

  const gear = student?.gear ?? student?.uniqueItem ?? null;
  applyStatTypeValues(stats, gear?.statTypes ?? gear?.StatType, gear?.statValues ?? gear?.StatValue);
}

function applyExclusiveWeaponStats(stats, student, state) {
  if (Number(state.uniqueWeaponStar) <= 0) {
    return;
  }

  const weaponStats = student?.exclusiveWeapon?.stats ?? {};
  addStat(stats, "attackPower", interpolateLevelValue(
    weaponStats.attackPower?.level1,
    weaponStats.attackPower?.level100,
    state.uniqueWeaponLevel,
  ));
  addStat(stats, "maxHp", interpolateLevelValue(
    weaponStats.maxHp?.level1,
    weaponStats.maxHp?.level100,
    state.uniqueWeaponLevel,
  ));
  addStat(stats, "healPower", interpolateLevelValue(
    weaponStats.healPower?.level1,
    weaponStats.healPower?.level100,
    state.uniqueWeaponLevel,
  ));
}

function applyStatTypeValues(stats, statTypes = [], statValues = []) {
  if (!Array.isArray(statTypes) || !Array.isArray(statValues)) {
    return;
  }

  statTypes.forEach((statType, index) => {
    const key = STAT_TYPE_TO_KEY[statType];

    if (!key) {
      return;
    }

    const rawValue = statValues[index];
    const value = Array.isArray(rawValue)
      ? toNullableNumber(rawValue[rawValue.length - 1])
      : toNullableNumber(rawValue);
    addStat(stats, key, normalizeStatModifierValue(stats, key, statType, value));
  });
}

function normalizeStatModifierValue(stats, key, statType, value) {
  if (value === null) {
    return null;
  }

  if (String(statType).includes("_Coefficient")) {
    const baseValue = Number(stats[key]);
    return Number.isFinite(baseValue) ? baseValue * (value / 10000) : null;
  }

  return value;
}

function addStat(stats, key, value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return;
  }

  const current = Number(stats[key]);
  stats[key] = Number.isFinite(current) ? current + Number(value) : Number(value);
}

function renderSkillCards(student) {
  const entries = SKILL_SLOT_CONFIG.map((slot) => {
    const skills = getDisplaySkillsForSlot(student.skills, slot);
    return { slot, skills };
  }).filter((entry) => entry.skills.length > 0);

  if (entries.length === 0) {
    replaceWithNotice(skillList, "스킬 데이터 확인 필요");
    return;
  }

  skillList.replaceChildren(...entries.map(createSkillSlotCard));
}

function getDisplaySkillsForSlot(skills, slot) {
  if (!skills || typeof skills !== "object") {
    return [];
  }

  const baseSkills = Array.isArray(skills[slot.key]) ? skills[slot.key] : [];
  const plusSkills = slot.plusKey && Array.isArray(skills[slot.plusKey]) ? skills[slot.plusKey] : [];

  if (slot.key === "normal" && detailViewState.favoriteItemTier >= 2 && plusSkills.length > 0) {
    return sortSkillsByOrder(plusSkills);
  }

  if (slot.key === "passive" && detailViewState.uniqueWeaponStar >= 2 && plusSkills.length > 0) {
    return sortSkillsByOrder(plusSkills);
  }

  return sortSkillsByOrder(baseSkills);
}

function createSkillSlotCard({ skills, slot }) {
  const card = document.createElement("article");
  card.className = "skill-card detail-skill-card";

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

  const levelBadge = document.createElement("span");
  levelBadge.className = "skill-level-badge";
  levelBadge.textContent = `Lv. ${detailViewState.skills[slot.key] ?? 1}`;

  const levelSelect = createSkillLevelSelect(slot);

  titleRow.append(title, levelBadge, levelSelect);
  content.append(titleRow, ...skills.map((skill) => createSkillInfoBlock(skill, slot)));
  body.append(icon, content);
  card.append(body);
  return card;
}

function createSkillInfoBlock(skill, slot) {
  const selectedLevel = detailViewState.skills[slot.key] ?? 1;
  const block = document.createElement("div");
  block.className = "skill-info-block";

  const name = document.createElement("h4");
  name.className = "skill-name";
  name.textContent = getSkillName(skill, slot);

  const meta = document.createElement("p");
  meta.className = "skill-review-note";
  meta.textContent = `${slot.label} · Lv. ${selectedLevel}`;

  const currentEffect = document.createElement("p");
  currentEffect.className = "skill-current-effect";
  currentEffect.textContent = formatSkillDescriptionForLevel(skill, selectedLevel);

  block.append(name, meta, currentEffect);

  if (skill?.changeRule || skill?.trigger || skill?.needsReview) {
    block.append(createSkillMeta(skill));
  }

  return block;
}

function formatSkillDescriptionForLevel(skill, level) {
  return replaceSkillParameters(getSkillDescription(skill), getSkillParameters(skill), level);
}

function replaceSkillParameters(template, parameters, level) {
  if (!template || parameters.length === 0) {
    return template || "스킬 효과 확인 필요";
  }

  return String(template).replace(/<\?(\d+)>/g, (match, indexText) => {
    const paramIndex = Number(indexText) - 1;
    return parameters[paramIndex]?.[level - 1] ?? match;
  });
}

function getSkillParameters(skill) {
  return Array.isArray(skill?.raw?.Parameters) ? skill.raw.Parameters : [];
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

function renderUniqueItem(student) {
  const gear = student.gear ?? student.uniqueItem ?? null;

  if (!favoriteItemPanel || !favoriteItemCard) {
    return;
  }

  favoriteItemPanel.hidden = false;

  if (!gear) {
    favoriteItemCard.replaceChildren(createNotice("애장품 없음"));
    return;
  }

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
  const selected = document.createElement("span");
  selected.className = "skill-level-badge";
  selected.textContent = "보유 정보";
  titleRow.append(title, selected);

  const desc = document.createElement("p");
  desc.textContent = gear.desc || gear.Desc || "애장품 설명 확인 필요";

  const tierList = document.createElement("div");
  tierList.className = "favorite-item-tier-list";
  tierList.append(
    createFavoriteItemTierCard("T1 효과", formatUniqueItemStats(gear)),
    createFavoriteItemTierCard("T2 효과", getUniqueItemTier2EffectText(student)),
  );

  content.append(titleRow, desc, tierList);

  favoriteItemCard.replaceChildren(icon, content);
}

function renderWeapon(student) {
  const exclusiveWeapon = student.exclusiveWeapon ?? {};
  const weaponName = exclusiveWeapon.name || student.weapon?.Name || student.weapon?.name || "전용무기 확인 필요";
  const weaponStar = detailViewState.uniqueWeaponStar;
  const star4Effect = getExclusiveWeaponStar4Effect(student, 4);

  exclusiveWeaponName.textContent = weaponName;
  exclusiveWeaponDesc.textContent = [
    `무기 타입: ${student.weaponType ?? "확인 필요"}`,
    "1성: 전용무기 개방 및 기본 스탯 보정이 캐릭터 스탯에 반영됩니다.",
    exclusiveWeapon.desc || student.weapon?.Desc || "전용무기 설명 확인 필요",
  ].join("\n");

  exclusiveWeaponRank3Effect.textContent = `3성: ${formatTerrainBonus(exclusiveWeapon.star3TerrainBonus)}`;
  exclusiveWeaponRank4Effect.textContent = `4성: ${star4Effect?.label ?? "전용무기 4성 효과 확인 필요"}`;
  exclusiveWeaponEnhancedSkill.textContent = `2성: ${getWeaponRank2EffectText(student)}`;
  exclusiveWeaponEnhancedStats.replaceChildren();

  exclusiveWeaponImageSlot.replaceChildren();
  exclusiveWeaponImageSlot.textContent = weaponStar > 0 ? `${weaponStar}성` : "미개방";
  exclusiveWeaponImageSlot.classList.toggle("is-disabled", weaponStar <= 0);
}

function bindCalculatorButton(student) {
  if (!addCurrentToCalculatorButton) {
    return;
  }

  addCurrentToCalculatorButton.onclick = () => {
    const pendingStudent = {
      studentId: student.id,
      slug: student.slug,
      target: createCalculatorTargetState(detailViewState),
    };

    localStorage.setItem(PENDING_CALCULATOR_STORAGE_KEY, JSON.stringify(pendingStudent));
    location.href = "material-calculator.html";
  };
}

function createCalculatorTargetState(state) {
  return {
    studentLevel: state.studentLevel,
    studentStar: state.studentStar,
    uniqueWeaponStar: state.uniqueWeaponStar,
    uniqueWeaponLevel: state.uniqueWeaponLevel,
    equipment: { ...state.equipment },
    skills: { ...state.skills },
    favoriteItemTier: state.favoriteItemTier,
  };
}

function createDefaultDetailViewState(student = {}) {
  return normalizeDetailViewState({
    studentLevel: 90,
    studentStar: Math.max(getBaseStar(student), 5),
    uniqueWeaponStar: 0,
    uniqueWeaponLevel: 0,
    equipment: createDefaultEquipmentState(student),
    skills: {
      ex: 5,
      normal: 10,
      passive: 10,
      sub: 10,
    },
    favoriteItemTier: hasUniqueItem(student) ? 2 : 0,
  }, student);
}

function normalizeDetailViewState(state, student = {}) {
  const baseStar = getBaseStar(student);
  const studentLevel = clampInteger(state.studentLevel, 1, 90, 90);
  const studentStar = clampInteger(state.studentStar, baseStar, 5, Math.max(baseStar, 5));
  const uniqueWeaponStar = clampInteger(state.uniqueWeaponStar, 0, 4, 0);
  const maxWeaponLevel = getUniqueWeaponMaxLevel(uniqueWeaponStar);
  const uniqueWeaponLevel = uniqueWeaponStar > 0
    ? clampInteger(state.uniqueWeaponLevel, 1, maxWeaponLevel, maxWeaponLevel)
    : 0;
  const equipment = Object.fromEntries(
    (student.equipmentSlots ?? []).map((slot, index) => {
      const key = `slot${index + 1}`;
      const maxTier = getMaxEquipmentTier(slot);
      return [key, clampInteger(state.equipment?.[key], 0, maxTier, maxTier)];
    }),
  );

  return {
    studentLevel,
    studentStar,
    uniqueWeaponStar,
    uniqueWeaponLevel,
    equipment,
    skills: {
      ex: clampInteger(state.skills?.ex, 1, 5, 5),
      normal: clampInteger(state.skills?.normal, 1, 10, 10),
      passive: clampInteger(state.skills?.passive, 1, 10, 10),
      sub: clampInteger(state.skills?.sub, 1, 10, 10),
    },
    favoriteItemTier: hasUniqueItem(student)
      ? clampInteger(state.favoriteItemTier, 0, 2, 2)
      : 0,
  };
}

function createEquipmentByCategory(equipmentList = []) {
  const result = new Map();

  equipmentList.forEach((equipment) => {
    if (!equipment?.category || !Number.isFinite(Number(equipment.tier))) {
      return;
    }

    if (!result.has(equipment.category)) {
      result.set(equipment.category, new Map());
    }

    result.get(equipment.category).set(Number(equipment.tier), equipment);
  });

  return result;
}

function createDefaultEquipmentState(student = {}) {
  return Object.fromEntries(
    (student.equipmentSlots ?? []).map((slot, index) => [`slot${index + 1}`, getMaxEquipmentTier(slot)]),
  );
}

function getMaxEquipmentTier(category) {
  const categoryRows = equipmentByCategory.get(category);

  if (!categoryRows || categoryRows.size === 0) {
    return 0;
  }

  return Math.max(...[...categoryRows.keys()].map((tier) => Number(tier)).filter(Number.isFinite));
}

function getEnhancedSkills(student, skillKey) {
  const skills = student?.skills;

  if (!skills || typeof skills !== "object" || !Array.isArray(skills[skillKey])) {
    return [];
  }

  return sortSkillsByOrder(skills[skillKey]);
}

function sortSkillsByOrder(skills) {
  return [...skills].sort((left, right) => {
    return (Number(left.order) || 0) - (Number(right.order) || 0);
  });
}

function getSkillName(skill, slot) {
  return skill?.Name || skill?.name || slot.label;
}

function getSkillDescription(skill) {
  return skill?.Desc || skill?.Description || skill?.desc || skill?.description || "스킬 효과 확인 필요";
}

function formatUniqueItemStats(gear) {
  const types = gear?.statTypes ?? gear?.StatType ?? [];
  const values = gear?.statValues ?? gear?.StatValue ?? [];

  if (!Array.isArray(types) || types.length === 0) {
    return "스탯 효과 확인 필요";
  }

  return types.map((type, index) => {
    const label = getStatLabel(STAT_TYPE_TO_KEY[type]) ?? type;
    const value = Array.isArray(values[index]) ? values[index].join(" / ") : values[index];
    return `${label} ${value ?? "확인 필요"}`;
  }).join(", ");
}

function getWeaponRank2EffectText(student) {
  const passivePlus = getEnhancedSkills(student, "passivePlus");

  if (passivePlus.length === 0) {
    return "강화 스킬이 + 버전으로 변경됩니다. 강화 스킬+ 데이터 확인 필요";
  }

  return `강화 스킬이 ${passivePlus.map((skill) => getSkillName(skill, SKILL_SLOT_CONFIG[2])).join(", ")}로 변경됩니다.`;
}

function createFavoriteItemTierCard(titleText, bodyText) {
  const card = document.createElement("article");
  card.className = "favorite-item-tier-card";

  const title = document.createElement("h4");
  title.textContent = titleText;

  const body = document.createElement("p");
  body.textContent = bodyText;

  card.append(title, body);
  return card;
}

function getUniqueItemTier2EffectText(student) {
  const normalPlus = getEnhancedSkills(student, "normalPlus");

  if (normalPlus.length === 0) {
    return "기본 스킬+ 데이터 확인 필요";
  }

  return `기본 스킬이 ${normalPlus.map((skill) => getSkillName(skill, SKILL_SLOT_CONFIG[1])).join(", ")}로 변경됩니다.`;
}

function getStatLabel(statKey) {
  return STAT_CONFIGS.find((config) => config.key === statKey)?.label ?? null;
}

function getEquipmentSlotLabels(student) {
  return (student.equipmentSlots ?? []).map(getEquipmentCategoryLabel);
}

function getEquipmentCategoryLabel(category) {
  return EQUIPMENT_CATEGORY_LABELS[category] ?? category ?? "장비 확인 필요";
}

function resolveEquipmentIconUrl(equipment) {
  const icon = equipment?.icon ?? equipment?.Icon ?? "";

  if (!icon) {
    return "";
  }

  if (String(icon).startsWith("./") || String(icon).startsWith("http")) {
    return icon;
  }

  return `./images/items/Equipment_Icon/${toEquipmentIconFileName(icon)}.png`;
}

function toEquipmentIconFileName(icon) {
  return String(icon)
    .split("_")
    .map((part) => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
    .join("_");
}

function createEquipmentFallback(label) {
  const fallback = document.createElement("span");
  fallback.className = "detail-equipment-fallback";
  fallback.textContent = String(label ?? "장비").slice(0, 1);
  return fallback;
}

function createNumberField({ label, value, min, max, disabled = false, onChange }) {
  const field = document.createElement("label");
  field.className = "detail-control-field";
  field.append(document.createTextNode(label));

  const input = document.createElement("input");
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.step = "1";
  input.value = String(value);
  input.disabled = disabled;
  input.addEventListener("change", () => onChange(Number(input.value)));
  field.append(input);
  return field;
}

function createSelectField({ label, value, options, disabled = false, onChange }) {
  const field = document.createElement("label");
  field.className = "detail-control-field";
  field.append(document.createTextNode(label));

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

function createEquipmentControlCard({ slot, slotIndex, tier, onChange }) {
  const categoryLabel = getEquipmentCategoryLabel(slot);
  const selectedTier = Number(tier) || 0;
  const equipment = selectedTier > 0 ? equipmentByCategory.get(slot)?.get(selectedTier) : null;
  const card = document.createElement("article");
  card.className = "detail-equipment-control-card";

  const visual = document.createElement("div");
  visual.className = "detail-equipment-visual";
  const imageUrl = resolveEquipmentIconUrl(equipment);

  if (imageUrl) {
    const image = document.createElement("img");
    image.className = "detail-equipment-image";
    image.src = imageUrl;
    image.alt = equipment?.name ?? categoryLabel;
    image.addEventListener("error", () => {
      if (!image.src.includes("/81px-")) {
        image.src = image.src.replace("/Equipment_Icon/", "/Equipment_Icon/81px-");
        return;
      }

      image.replaceWith(createEquipmentFallback(categoryLabel));
    }, { once: false });
    visual.append(image);
  } else {
    visual.append(createEquipmentFallback(categoryLabel));
  }

  const content = document.createElement("div");
  content.className = "detail-equipment-content";

  const title = document.createElement("strong");
  title.textContent = `${slotIndex}번 장비`;

  const name = document.createElement("span");
  name.textContent = equipment?.name ?? categoryLabel;

  const select = document.createElement("select");
  select.setAttribute("aria-label", `${slotIndex}번 장비 티어`);
  select.append(new Option("미착용", "0"));
  createTierOptions(1, getMaxEquipmentTier(slot)).forEach(([optionValue, optionLabel]) => {
    select.append(new Option(optionLabel, String(optionValue)));
  });
  select.value = String(selectedTier);
  select.addEventListener("change", () => onChange(Number(select.value)));

  content.append(title, name, select);
  card.append(visual, content);
  return card;
}

function createSkillLevelSelect(slot) {
  const select = document.createElement("select");
  select.className = "skill-level-select";
  select.setAttribute("aria-label", `${slot.label} 레벨`);
  createLevelOptions(1, slot.maxLevel).forEach(([value, label]) => {
    select.append(new Option(label, String(value)));
  });
  select.value = String(detailViewState.skills[slot.key] ?? 1);
  select.addEventListener("change", () => updateDetailViewState({
    skills: {
      ...detailViewState.skills,
      [slot.key]: Number(select.value),
    },
  }));
  return select;
}

function createStarRankField({ label, baseStar, value, onChange }) {
  const field = document.createElement("div");
  field.className = "detail-control-field star-rank-control-field";

  const title = document.createElement("span");
  title.textContent = label;

  const row = document.createElement("div");
  row.className = "detail-star-rank-row";
  row.setAttribute("role", "radiogroup");
  row.setAttribute("aria-label", label);

  for (let rank = 1; rank <= 9; rank += 1) {
    const button = document.createElement("button");
    button.className = "detail-star-rank-button";
    button.type = "button";
    button.disabled = rank < baseStar;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", rank === value ? "true" : "false");
    button.setAttribute("aria-label", formatCombinedStarRankLabel(rank));
    button.title = formatCombinedStarRankLabel(rank);

    if (rank === value) {
      button.classList.add("is-selected");
    }

    if (rank <= value) {
      button.classList.add("is-active");
    }

    const image = document.createElement("img");
    image.className = "detail-star-rank-icon";
    image.src = rank <= value ? getStarRankIconUrl(rank) : BLANK_STAR_ICON_URL;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    button.append(image);

    button.addEventListener("click", () => onChange(rank));
    row.append(button);
  }

  const valueLabel = document.createElement("span");
  valueLabel.className = "detail-star-rank-value";
  valueLabel.textContent = formatCombinedStarRankLabel(value);

  field.append(title, row, valueLabel);
  return field;
}

function createLevelOptions(min, max) {
  const options = [];

  for (let level = min; level <= max; level += 1) {
    options.push([level, `Lv. ${level}`]);
  }

  return options;
}

function createTierOptions(min, max) {
  const options = [];

  for (let tier = min; tier <= max; tier += 1) {
    options.push([tier, `T${tier}`]);
  }

  return options;
}

function getCombinedStarRank(state) {
  const weaponStar = Number(state.uniqueWeaponStar);
  return weaponStar > 0 ? 5 + weaponStar : Number(state.studentStar);
}

function createStateFromCombinedStarRank(rank) {
  const normalizedRank = clampInteger(rank, 1, 9, 5);

  if (normalizedRank > 5) {
    return {
      studentStar: 5,
      uniqueWeaponStar: normalizedRank - 5,
    };
  }

  return {
    studentStar: normalizedRank,
    uniqueWeaponStar: 0,
  };
}

function formatCombinedStarRankLabel(rank) {
  return rank <= 5 ? `${rank}성` : `전용무기 ${rank - 5}성`;
}

function getStarRankIconUrl(rank) {
  return rank <= 5 ? STAR_ICON_URL : BLUE_STAR_ICON_URL;
}

function interpolateLevelValue(level1, level100, level) {
  const start = toNullableNumber(level1);
  const end = toNullableNumber(level100);

  if (start === null || end === null) {
    return null;
  }

  const normalizedLevel = clampInteger(level, 1, 100, 1);
  return Math.round(start + ((end - start) * (normalizedLevel - 1)) / 99);
}

function getUniqueWeaponMaxLevel(weaponStar) {
  return UNIQUE_WEAPON_MAX_LEVEL_BY_STAR[Number(weaponStar)] ?? 0;
}

function formatStatValue(value, config) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "확인 필요";
  }

  if (config.percentBase) {
    return `${Math.round((Number(value) / config.percentBase) * 100)}%`;
  }

  return formatQuantity(value);
}

function formatQuantity(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "확인 필요";
  }

  return Math.round(Number(value)).toLocaleString("ko-KR");
}

function toNullableNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getBaseStar(student) {
  const star = Number(student?.star ?? student?.baseStar ?? student?.raw?.StarGrade ?? 1);
  return Number.isFinite(star) ? Math.min(5, Math.max(1, Math.trunc(star))) : 1;
}

function clampInteger(value, min, max, fallback) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(numberValue)));
}

function hasUniqueItem(student) {
  const gear = student?.gear ?? student?.uniqueItem ?? null;
  return Boolean(gear?.name || gear?.Name);
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
