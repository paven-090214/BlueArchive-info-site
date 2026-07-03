import { resolveGiftCatalogEntry } from "../data/bond/giftImageMap.js";
import { STAT_KEYS, calculateStudentStats } from "../js/calculators/statCalculator.js";
import {
  getExclusiveWeaponImagePath,
  getGearIconPath,
  getRoleImagePath,
  getSkillIconPath,
  getTerrainImagePath,
  getTerrainRankImagePath,
} from "../utils/imagePaths.js";
import { applyStudentCardImageFit, getStudentImageId } from "../utils/studentImageResolver.js";
import {
  applyTypeColorVars,
  getArmorTypeColorMeta,
  getArmorTypePillClass,
  getAttackTypeColorMeta,
  getAttackTypePillClass,
  getSkillIconTypeClass,
} from "../utils/typeColors.js";

const STAT_LABELS = {
  attack: "공격력",
  defense: "방어력",
  hp: "체력",
  healing: "치유력",
  accuracy: "명중",
  evasion: "회피",
  criticalRate: "치명 수치",
  criticalDamage: "치명 대미지",
  stability: "안정성",
  range: "사거리",
  ccPower: "CC 강화력",
  ccResist: "CC 저항력",
};

const DEFAULT_OPTIONS_BY_SLUG = {
  aru: {
    level: 80,
    star: 3,
    uniqueWeapon: { level: 0 },
    abilityUnlock: { attack: 0, hp: 0, healing: 0 },
  },
  yuuka: {
    level: 80,
    star: 2,
    uniqueWeapon: { level: 0 },
    abilityUnlock: { attack: 0, hp: 0, healing: 0 },
  },
};

const CURRENT_MAX_LEVEL = 80;
const MAX_ABILITY_UNLOCK_LEVEL = 25;
const YELLOW_STAR_ICON_URL = "./images/icon/Icon_star.webp";
const BLUE_STAR_ICON_URL = "./images/icon/Icon_blue_star.webp";
const BLANK_STAR_ICON_URL = "./images/icon/Icon_blank_star.webp";

const GIFT_AFFINITY_META = {
  amazing: {
    label: "최고 선호",
    rankImage: "./images/gift-ranks/favorite.webp",
  },
  favorite: {
    label: "최고 선호",
    rankImage: "./images/gift-ranks/favorite.webp",
  },
  great: {
    label: "선호",
    rankImage: "./images/gift-ranks/preferred.webp",
  },
  preferred: {
    label: "선호",
    rankImage: "./images/gift-ranks/preferred.webp",
  },
  liked: {
    label: "좋아함",
    rankImage: "./images/gift-ranks/liked.webp",
  },
  normal: {
    label: "보통",
    rankImage: "./images/gift-ranks/normal.webp",
  },
};

const ABILITY_UNLOCK_CONTROLS = [
  { key: "attack", label: "능력개방 공격력" },
  { key: "hp", label: "능력개방 최대체력" },
  { key: "healing", label: "능력개방 치유력" },
];

const terrainEntries = [
  ["urban", "시가지"],
  ["street", "시가지"],
  ["outdoor", "야외"],
  ["indoor", "실내"],
];

const statGrid = document.querySelector("[data-student-stat-grid]");
const controlGrid = document.querySelector("[data-detail-view-controls]");
let detailControlState = null;

function fetchJson(path) {
  return fetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`${path} 로드 실패: ${response.status}`);
    }

    return response.json();
  });
}

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = value ?? "확인 필요";
  }
}

function setStudentField(fieldName, value) {
  document.querySelectorAll(`[data-student-field="${fieldName}"]`).forEach((element) => {
    element.textContent = value ?? "확인 필요";
  });
}

function renderTypePill(fieldName, label, meta, className) {
  document.querySelectorAll(`[data-student-field="${fieldName}"]`).forEach((element) => {
    const text = document.createElement("span");

    element.className = `type-pill ${className}`;
    applyTypeColorVars(element, meta);
    text.className = "type-pill__label";
    text.textContent = label ?? "확인 필요";
    element.replaceChildren(text);
  });
}

function asKoText(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return value.ko ?? value.displayKo ?? value.fullKo ?? value.textKo ?? value.nameKo ?? null;
}

function normalizeVoiceActorValue(value, locale) {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text || null;
  }

  const nameKo = value.nameKo?.trim();
  const nameJa = value.nameJa?.trim();
  const nameEn = value.nameEn?.trim();

  if (locale === "jp") {
    return [nameKo, nameJa].filter(Boolean).join(" / ") || nameKo || nameJa || nameEn || null;
  }

  return nameKo || nameEn || nameJa || null;
}

function normalizeVoiceActors(voiceActors) {
  return {
    jp: normalizeVoiceActorValue(voiceActors?.ja ?? voiceActors?.jp, "jp"),
    kr: normalizeVoiceActorValue(voiceActors?.ko ?? voiceActors?.kr, "kr"),
  };
}

function normalizeDetail(detail) {
  const names = detail.names ?? detail.name ?? {};
  const baseInfo = detail.baseInfo ?? detail.basicInfo ?? {};
  const combatInfo = detail.combatInfo ?? {};
  const birthday = baseInfo.birthday ?? {};
  const profile = detail.profile ?? {};
  const weaponType = combatInfo.weaponType ?? {};
  const role = baseInfo.combatRole ?? combatInfo.role ?? {};
  const position = baseInfo.position ?? combatInfo.combatPosition ?? {};
  const attackType = combatInfo.attackType ?? {};
  const defenseType = combatInfo.armorType ?? {};
  const equipmentSlots = combatInfo.equipmentSlots ?? [];
  const voiceActors = normalizeVoiceActors(baseInfo.voiceActors);

  return {
    raw: detail,
    Id: detail.Id ?? detail.id ?? detail.characterId,
    characterId: detail.characterId,
    slug: detail.slug,
    displayName: names.displayKo ?? names.ko ?? names.fullKo ?? "학생",
    fullName: names.ko ?? names.fullKo ?? names.displayKo ?? "확인 필요",
    description: profile.summaryKo ?? profile.description?.ko ?? "소개 정보를 준비 중입니다.",
    combatClass: asKoText(baseInfo.squadType) ?? asKoText(baseInfo.positionType) ?? "확인 필요",
    role: role.ko ?? role.siteRoleCategory ?? "확인 필요",
    roleKey: role.gameRole ?? role.en ?? role.siteRoleCategory ?? role.ko ?? null,
    position: position.ko ?? position.raw ?? "확인 필요",
    attackType: attackType.ko ?? "확인 필요",
    attackTypeKey: attackType.code ?? attackType.en ?? attackType.ko ?? null,
    defenseType: defenseType.ko ?? "확인 필요",
    defenseTypeKey: defenseType.code ?? defenseType.en ?? defenseType.ko ?? null,
    birthday: birthday.textKo ?? birthday.ko ?? "확인 필요",
    academyName: asKoText(baseInfo.school),
    clubName: asKoText(baseInfo.club),
    age: asKoText(baseInfo.age),
    weaponType: weaponType.code ?? weaponType.ko ?? "확인 필요",
    equipmentSlots: equipmentSlots.map((slot) => slot.ko ?? slot.type?.ko).filter(Boolean).join(" / "),
    designer: asKoText(baseInfo.designer),
    voiceActors,
    illustrator: asKoText(baseInfo.illustrator),
    baseStar: baseInfo.baseStar ?? baseInfo.defaultStar ?? detail.stats?.mainStatSets?.level1BaseStar?.star,
    hobby: asKoText(baseInfo.hobby),
    terrain: combatInfo.terrain ?? {},
    skills: detail.skills,
    uniqueItem: detail.uniqueItem,
    uniqueWeapon: detail.uniqueWeapon,
    preferredGifts: detail.preferredGifts,
    memorial: detail.memorial,
  };
}

function renderBaseStars(star) {
  const container = document.querySelector("[data-student-field=\"baseStar\"]");

  if (!container) {
    return;
  }

  const safeStar = Number(star) || 0;
  const stars = Array.from({ length: safeStar }, () => {
    const image = document.createElement("img");
    image.className = "base-star-icon";
    image.src = YELLOW_STAR_ICON_URL;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    return image;
  });

  const wrapper = document.createElement("span");
  wrapper.className = "base-star-display";
  wrapper.setAttribute("aria-label", `기본 ${safeStar}성`);
  wrapper.append(...stars);

  if (!stars.length) {
    wrapper.textContent = "확인 필요";
  }

  container.replaceChildren(wrapper);
}

function renderVoiceActors(detail) {
  const container = document.querySelector("[data-student-field=\"voiceActor\"]");

  if (!container) {
    return;
  }

  const jpVoice = detail.voiceActors.jp;
  const krVoice = detail.voiceActors.kr;

  if (!jpVoice) {
    console.warn(`${detail.slug} 학생의 JP 성우 정보가 없습니다.`);
  }

  if (!krVoice) {
    console.warn(`${detail.slug} 학생의 KR 성우 정보가 없습니다.`);
  }

  const list = document.createElement("ul");
  list.className = "voice-actor-list";

  [
    ["JP", jpVoice ?? "없음"],
    ["KR", krVoice ?? "없음"],
  ].forEach(([label, value]) => {
    const item = document.createElement("li");
    const labelElement = document.createElement("strong");
    const valueElement = document.createElement("span");

    labelElement.textContent = `${label}:`;
    valueElement.textContent = value;
    item.append(labelElement, valueElement);
    list.append(item);
  });

  container.replaceChildren(list);
}

function renderProfileImage(detail) {
  const slot = document.querySelector(".character-large-placeholder");

  if (!slot) {
    return;
  }

  const studentId = getStudentImageId(detail);

  if (studentId === null) {
    slot.textContent = detail.displayName;
    return;
  }

  const image = document.createElement("img");

  slot.classList.add("student-card-image-wrap");
  image.className = "character-profile-image student-card-image";
  image.alt = `${detail.displayName} 이미지`;
  image.src = `./images/students/portraits/${studentId}.webp`;
  applyStudentCardImageFit(image, detail);
  image.onerror = () => {
    console.warn(`${detail.slug} 학생 portrait 이미지가 없습니다: ${image.src}`);
    slot.textContent = detail.displayName;
  };

  slot.replaceChildren(image);
}

function renderLocalImage(slot, src, { alt, fallbackText, missingMessage, className }) {
  if (!slot) {
    return;
  }

  slot.replaceChildren();

  if (!src) {
    slot.textContent = fallbackText;
    console.warn(missingMessage);
    return;
  }

  const image = document.createElement("img");
  image.className = className;
  image.src = src;
  image.alt = alt;
  image.addEventListener("error", () => {
    console.warn(`${missingMessage}: ${src}`);
    image.remove();
    slot.textContent = fallbackText;
    slot.classList.remove("has-image", "has-weapon-image");
  }, { once: true });
  slot.removeAttribute("aria-hidden");
  slot.classList.add("has-image");
  slot.append(image);
}

function renderRoleImage(detail) {
  const image = document.querySelector("[data-role-image]");
  const src = getRoleImagePath(detail.roleKey) ?? getRoleImagePath(detail.role);

  if (!image) {
    return;
  }

  if (!src) {
    console.warn(`${detail.slug} 역할 이미지 매핑이 없습니다: ${detail.roleKey ?? detail.role}`);
    image.hidden = true;
    image.removeAttribute("src");
    return;
  }

  image.hidden = false;
  image.src = src;
  image.alt = `${detail.role} 아이콘`;
  image.addEventListener("error", () => {
    console.warn(`${detail.slug} 역할 이미지가 없습니다: ${src}`);
    image.hidden = true;
  }, { once: true });
}

function renderTerrain(terrain) {
  const cards = [...document.querySelectorAll(".terrain-aptitude-card")];
  const renderedKeys = new Set();

  cards.forEach((card, index) => {
    const [terrainKey, fallbackLabel] =
      terrainEntries.find(([key]) => terrain[key] && !renderedKeys.has(key)) ?? terrainEntries[index] ?? [];
    const terrainInfo = terrain?.[terrainKey] ?? {};
    const label = terrainInfo.ko ?? fallbackLabel ?? "지역";
    const rank = terrainInfo.rank ?? terrainInfo.gradeLabel ?? "확인 필요";

    if (terrainKey) {
      renderedKeys.add(terrainKey);
    }

    const visualSlot = card.querySelector(".terrain-image-placeholder");
    const content = card.querySelector(":scope > div:last-child");
    const terrainImagePath = getTerrainImagePath(terrainKey);
    const rankImagePath = getTerrainRankImagePath(rank);

    renderLocalImage(visualSlot, terrainImagePath, {
      alt: `${label} 이미지`,
      fallbackText: label.slice(0, 1),
      missingMessage: `${label} 지역 이미지가 없습니다`,
      className: "terrain-place-image",
    });

    if (!content) {
      return;
    }

    const strong = document.createElement("strong");
    const rankRow = document.createElement("div");
    const span = document.createElement("span");

    strong.textContent = label;
    rankRow.className = "terrain-rank-row";
    span.textContent = rank;

    if (rankImagePath) {
      const rankImage = document.createElement("img");
      rankImage.className = "terrain-rank-image";
      rankImage.src = rankImagePath;
      rankImage.alt = `${rank} 적성 이미지`;
      rankImage.addEventListener("error", () => {
        console.warn(`${label} ${rank} 적성 이미지가 없습니다: ${rankImagePath}`);
        rankImage.remove();
      }, { once: true });
      rankRow.append(rankImage);
    } else {
      console.warn(`${label} ${rank} 적성 이미지 매핑이 없습니다.`);
    }

    rankRow.append(span);
    content.replaceChildren(strong, rankRow);
  });
}

function renderDetail(detail) {
  setText("#character-profile-name", detail.fullName);
  setText("#character-profile-description", detail.description);
  setStudentField("role", detail.role);
  setStudentField("position", detail.position);
  setStudentField("combatClass", detail.combatClass);
  setStudentField("fullName", detail.fullName);
  setStudentField("birthday", detail.birthday);
  setStudentField("academyName", detail.academyName);
  setStudentField("clubName", detail.clubName);
  setStudentField("age", detail.age);
  setStudentField("weaponType", detail.weaponType);
  setStudentField("equipmentSlots", detail.equipmentSlots || "확인 필요");
  setStudentField("designer", detail.designer);
  setStudentField("illustrator", detail.illustrator);
  setStudentField("hobby", detail.hobby);

  renderTypePill(
    "attackType",
    detail.attackType,
    getAttackTypeColorMeta(detail.attackTypeKey ?? detail.attackType),
    getAttackTypePillClass(detail.attackTypeKey ?? detail.attackType),
  );
  renderTypePill(
    "defenseType",
    detail.defenseType,
    getArmorTypeColorMeta(detail.defenseTypeKey ?? detail.defenseType),
    getArmorTypePillClass(detail.defenseTypeKey ?? detail.defenseType),
  );
  renderVoiceActors(detail);
  renderRoleImage(detail);
  renderBaseStars(detail.baseStar);
  renderProfileImage(detail);
  renderTerrain(detail.terrain);
  renderSkills(detail.skills, detail);
  renderUniqueItem(detail);
  renderPreferredGifts(detail.preferredGifts ?? detail.raw?.preferredGifts, detail);
  renderUniqueWeapon(detail);
  renderMemorial(detail.memorial);
}

function getSkillEntries(skills) {
  if (Array.isArray(skills)) {
    return skills;
  }

  if (skills && typeof skills === "object") {
    return ["ex", "normal", "passive", "sub"].map((slot) => ({ slot, ...skills[slot] })).filter(Boolean);
  }

  return [];
}

function getSkillDescription(skill) {
  const firstLevel = Array.isArray(skill.levels)
    ? skill.levels[0]
    : skill.levels?.["1"];

  if (skill.templateKo) {
    return skill.templateKo;
  }

  return firstLevel?.ko ?? "스킬 설명을 준비 중입니다.";
}

function renderSkills(skills, detail) {
  const cards = [...document.querySelectorAll(".skill-list .skill-card")];
  const entries = getSkillEntries(skills);

  cards.forEach((card, index) => {
    const skill = entries[index];

    if (!skill) {
      return;
    }

    const title = card.querySelector("h3");
    const description = card.querySelector("p");
    const iconSlot = card.querySelector(".skill-icon-placeholder");
    const slot = skill.slot ?? ["ex", "normal", "passive", "sub"][index];
    const iconPath = getSkillIconPath(skill, {
      characterId: detail.characterId,
      slug: detail.slug,
      slot,
    });
    const attackTypeMeta = getAttackTypeColorMeta(detail.attackTypeKey ?? detail.attackType);

    renderLocalImage(iconSlot, iconPath, {
      alt: `${skill.name?.ko ?? skill.typeKo ?? skill.type?.ko ?? slot} 아이콘`,
      fallbackText: iconSlot?.textContent?.trim() || "이미지 없음",
      missingMessage: `${detail.slug} ${slot} 스킬 이미지가 없습니다`,
      className: "skill-icon-image",
    });
    iconSlot?.classList.remove(
      "skill-icon--explosion",
      "skill-icon--penetration",
      "skill-icon--mystic",
      "skill-icon--sonic",
      "skill-icon--neutral",
    );
    iconSlot?.classList.add("skill-icon", getSkillIconTypeClass(detail));
    applyTypeColorVars(iconSlot, attackTypeMeta);

    if (title) {
      title.textContent = skill.name?.ko ?? skill.typeKo ?? skill.type?.ko ?? title.textContent;
    }

    if (description) {
      description.textContent = getSkillDescription(skill);
    }
  });
}

function renderUniqueItem(detail) {
  const uniqueItem = detail.uniqueItem;
  const iconSlot = document.querySelector(".favorite-icon-placeholder");

  if (!uniqueItem) {
    renderLocalImage(iconSlot, null, {
      alt: "",
      fallbackText: "애장품 없음",
      missingMessage: `${detail.slug} 애장품 데이터가 없습니다.`,
      className: "equipment-icon-image",
    });
    return;
  }

  const title = document.querySelector(".favorite-item-card h3");
  const description = document.querySelector(".favorite-item-card p");

  if (title) {
    title.textContent = uniqueItem.name?.ko ?? "애장품";
  }

  if (description) {
    description.textContent = uniqueItem.descriptionKo ?? uniqueItem.description?.ko ?? "애장품 설명을 준비 중입니다.";
  }

  renderLocalImage(iconSlot, getGearIconPath(detail), {
    alt: `${uniqueItem.name?.ko ?? "애장품"} 아이콘`,
    fallbackText: "이미지 없음",
    missingMessage: `${detail.slug} 애장품 아이콘 이미지가 없습니다`,
    className: "equipment-icon-image",
  });
}

function getPreferredGiftName(gift) {
  return gift.name?.ko ?? gift.nameKo ?? gift.displayNameKo ?? gift.aliases?.[0] ?? gift.code ?? "선물";
}

function createPreferredGiftImage(src, alt, className, fallbackText) {
  if (!src) {
    const placeholder = document.createElement("span");
    placeholder.className = "preferred-gift-placeholder";
    placeholder.textContent = fallbackText;
    return placeholder;
  }

  const image = document.createElement("img");
  image.className = className;
  image.src = src;
  image.alt = alt;
  image.addEventListener("error", () => {
    const placeholder = document.createElement("span");
    placeholder.className = "preferred-gift-placeholder";
    placeholder.textContent = fallbackText;
    image.replaceWith(placeholder);
  }, { once: true });

  return image;
}

function renderPreferredGifts(preferredGifts, detail) {
  const container = document.querySelector("[data-preferred-gift-list]");

  if (!container) {
    return;
  }

  const gifts = Array.isArray(preferredGifts?.gifts) ? preferredGifts.gifts : [];

  if (!gifts.length) {
    const empty = document.createElement("p");
    empty.className = "preferred-gift-empty";
    empty.textContent = "선호 선물 데이터가 없습니다.";
    container.replaceChildren(empty);
    return;
  }

  const cards = gifts.map((gift) => {
    const catalogEntry = resolveGiftCatalogEntry(gift);
    const giftName = getPreferredGiftName(gift);
    const affinity = gift.affinity ?? "preferred";
    const affinityMeta = GIFT_AFFINITY_META[affinity] ?? GIFT_AFFINITY_META.preferred;
    const card = document.createElement("article");
    const visualSlot = document.createElement("div");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const affinityText = document.createElement("p");
    const giftImage = createPreferredGiftImage(
      catalogEntry?.imageUrl,
      `${giftName} 이미지`,
      "preferred-gift-image",
      "이미지 없음",
    );
    const rankImage = createPreferredGiftImage(
      affinityMeta.rankImage,
      gift.affinityKo ?? affinityMeta.label,
      "preferred-gift-rank-image",
      gift.affinityKo ?? affinityMeta.label,
    );

    if (!catalogEntry) {
      console.warn(`${detail.slug} 선물 이미지 매핑을 찾지 못했습니다: ${gift.code ?? giftName}`);
    }

    card.className = "preferred-gift-card";
    visualSlot.className = "preferred-gift-visual-slot";
    content.className = "preferred-gift-content";
    title.textContent = giftName;
    affinityText.textContent = gift.affinityKo ?? affinityMeta.label;

    visualSlot.append(giftImage, rankImage);
    content.append(title, affinityText);
    card.append(visualSlot, content);

    return card;
  });

  container.replaceChildren(...cards);
}

function renderUniqueWeapon(detail) {
  const uniqueWeapon = detail.uniqueWeapon;
  const imageSlot = document.querySelector("[data-exclusive-weapon-image-slot]");

  if (!uniqueWeapon) {
    renderLocalImage(imageSlot, null, {
      alt: "",
      fallbackText: "이미지 없음",
      missingMessage: `${detail.slug} 전용무기 데이터가 없습니다.`,
      className: "weapon-image",
    });
    return;
  }

  setText("[data-exclusive-weapon-name]", uniqueWeapon.name?.ko ?? uniqueWeapon.name?.en ?? "전용무기");
  setText(
    "[data-exclusive-weapon-desc]",
    uniqueWeapon.descriptionKo ?? uniqueWeapon.description?.ko ?? "전용무기 설명을 준비 중입니다.",
  );

  renderLocalImage(imageSlot, getExclusiveWeaponImagePath(detail), {
    alt: `${uniqueWeapon.name?.ko ?? uniqueWeapon.name?.en ?? "전용무기"} 이미지`,
    fallbackText: "이미지 없음",
    missingMessage: `${detail.slug} 전용무기 이미지가 없습니다`,
    className: "weapon-image",
  });
  imageSlot?.classList.add("has-weapon-image");
}

function renderMemorial(memorial) {
  const slot = document.querySelector("[data-memorial-slot]");

  if (!slot || !memorial) {
    return;
  }

  slot.textContent = memorial.name?.ko ?? "메모리얼";
}

function getDefaultOptions(slug, baseStar) {
  const defaults = DEFAULT_OPTIONS_BY_SLUG[slug] ?? DEFAULT_OPTIONS_BY_SLUG.aru;

  return {
    level: getCurrentMaxLevel(),
    star: defaults.star ?? baseStar,
    uniqueWeapon: { ...defaults.uniqueWeapon },
    abilityUnlock: { ...defaults.abilityUnlock },
  };
}

function readCurrentOptions(slug, baseStar) {
  const options = detailControlState ?? getDefaultOptions(slug, baseStar);

  return {
    ...options,
    uniqueWeapon: {
      star: getExclusiveWeaponStar(options.star),
      level: options.uniqueWeapon.level,
    },
    uniqueItem: { tier: 0 },
  };
}

function getCurrentMaxLevel() {
  return CURRENT_MAX_LEVEL;
}

function getExclusiveWeaponStar(studentStar) {
  return Math.max(0, Number(studentStar) - 5);
}

function canUseUniqueWeaponLevel(state) {
  return Number(state.star) >= 6;
}

function canUseAbilityUnlock(state) {
  return Number(state.star) >= 5 && Number(state.level) >= getCurrentMaxLevel();
}

function clampInteger(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(number), min), max);
}

function renderControls(options) {
  if (!controlGrid) {
    return;
  }

  detailControlState = {
    level: clampInteger(options.level, 1, getCurrentMaxLevel()),
    star: clampInteger(options.star, 1, 9),
    uniqueWeapon: { level: 0 },
    abilityUnlock: { attack: 0, hp: 0, healing: 0 },
  };
  controlGrid.replaceChildren(
    createLevelControl(),
    createStarControl(),
    createUniqueWeaponLevelControl(),
    ...ABILITY_UNLOCK_CONTROLS.map(createAbilityUnlockControl),
  );
  updateControlState();
}

function createLevelControl() {
  const label = document.createElement("label");
  const input = document.createElement("input");

  label.className = "detail-control-field";
  label.textContent = "레벨";
  input.type = "number";
  input.min = "1";
  input.max = String(getCurrentMaxLevel());
  input.value = String(detailControlState.level);
  input.dataset.statOption = "level";
  input.addEventListener("input", () => {
    detailControlState.level = clampInteger(input.value, 1, getCurrentMaxLevel());
    input.value = String(detailControlState.level);
    updateControlState();
  });
  label.append(input);

  return label;
}

function createStarControl() {
  const field = document.createElement("div");
  const label = document.createElement("span");
  const row = document.createElement("div");
  const value = document.createElement("span");

  field.className = "detail-control-field star-rank-control-field";
  field.dataset.statOption = "star";
  label.textContent = "성급";
  row.className = "detail-star-rank-row";
  row.setAttribute("role", "radiogroup");
  row.setAttribute("aria-label", "학생 성급");
  value.className = "detail-star-rank-value";
  value.dataset.starRankValue = "";
  field.append(label, row, value);

  for (let star = 1; star <= 9; star += 1) {
    row.append(createStarButton(star));
  }

  return field;
}

function createStarButton(star) {
  const button = document.createElement("button");
  const image = document.createElement("img");

  button.className = "detail-star-rank-button";
  button.type = "button";
  button.dataset.starRank = String(star);
  button.setAttribute("role", "radio");
  button.setAttribute("aria-label", formatStarRankLabel(star));
  button.addEventListener("click", () => {
    detailControlState.star = star;
    updateControlState();
  });
  image.className = "detail-star-rank-icon";
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  button.append(image);

  return button;
}

function createUniqueWeaponLevelControl() {
  const label = document.createElement("label");
  const input = document.createElement("input");

  label.className = "detail-control-field";
  label.textContent = "전용무기 레벨";
  input.type = "number";
  input.min = "0";
  input.max = "100";
  input.value = "0";
  input.dataset.statOption = "uniqueWeapon.level";
  input.addEventListener("input", () => {
    detailControlState.uniqueWeapon.level = clampInteger(input.value, 0, 100);
    input.value = String(detailControlState.uniqueWeapon.level);
  });
  label.append(input);

  return label;
}

function createAbilityUnlockControl(control) {
  const field = document.createElement("div");
  const label = document.createElement("span");
  const row = document.createElement("div");
  const decreaseButton = document.createElement("button");
  const value = document.createElement("span");
  const increaseButton = document.createElement("button");

  field.className = "detail-control-field ability-unlock-control";
  field.dataset.abilityUnlockControl = control.key;
  label.textContent = control.label;
  row.className = "ability-unlock-stepper";
  decreaseButton.type = "button";
  decreaseButton.className = "ability-unlock-button";
  decreaseButton.textContent = "-";
  decreaseButton.setAttribute("aria-label", `${control.label} 감소`);
  decreaseButton.addEventListener("click", () => updateAbilityUnlockValue(control.key, -1));
  value.className = "ability-unlock-value";
  value.dataset.abilityUnlockValue = control.key;
  increaseButton.type = "button";
  increaseButton.className = "ability-unlock-button";
  increaseButton.textContent = "+";
  increaseButton.setAttribute("aria-label", `${control.label} 증가`);
  increaseButton.addEventListener("click", () => updateAbilityUnlockValue(control.key, 1));
  row.append(decreaseButton, value, increaseButton);
  field.append(label, row);

  return field;
}

function updateAbilityUnlockValue(key, delta) {
  if (!canUseAbilityUnlock(detailControlState)) {
    detailControlState.abilityUnlock[key] = 0;
    updateControlState();
    return;
  }

  detailControlState.abilityUnlock[key] = clampInteger(
    detailControlState.abilityUnlock[key] + delta,
    0,
    MAX_ABILITY_UNLOCK_LEVEL,
  );
  updateControlState();
}

function updateControlState() {
  if (!controlGrid || !detailControlState) {
    return;
  }

  const uniqueWeaponEnabled = canUseUniqueWeaponLevel(detailControlState);
  const abilityEnabled = canUseAbilityUnlock(detailControlState);
  const uniqueWeaponLevelInput = controlGrid.querySelector("[data-stat-option=\"uniqueWeapon.level\"]");

  controlGrid.dataset.studentStar = String(detailControlState.star);
  controlGrid.dataset.exclusiveWeaponStar = String(getExclusiveWeaponStar(detailControlState.star));
  controlGrid.dataset.abilityUnlockEnabled = String(abilityEnabled);

  if (uniqueWeaponLevelInput) {
    uniqueWeaponLevelInput.disabled = !uniqueWeaponEnabled;

    if (!uniqueWeaponEnabled) {
      detailControlState.uniqueWeapon.level = 0;
      uniqueWeaponLevelInput.value = "0";
    }
  }

  if (!abilityEnabled) {
    ABILITY_UNLOCK_CONTROLS.forEach(({ key }) => {
      detailControlState.abilityUnlock[key] = 0;
    });
  }

  updateStarButtons();
  updateAbilityUnlockControls(abilityEnabled);
}

function updateStarButtons() {
  const buttons = [...controlGrid.querySelectorAll("[data-star-rank]")];
  const selectedStar = detailControlState.star;
  const value = controlGrid.querySelector("[data-star-rank-value]");

  buttons.forEach((button) => {
    const star = Number(button.dataset.starRank);
    const isActive = star <= selectedStar;
    const image = button.querySelector("img");

    button.classList.toggle("is-selected", star === selectedStar);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", star === selectedStar ? "true" : "false");

    if (image) {
      image.src = isActive ? getStarIconUrl(star) : BLANK_STAR_ICON_URL;
      image.className = `detail-star-rank-icon ${star <= 5 ? "yellow-star" : "blue-star"}`;
    }
  });

  if (value) {
    value.textContent = formatStarRankLabel(selectedStar);
  }
}

function updateAbilityUnlockControls(enabled) {
  ABILITY_UNLOCK_CONTROLS.forEach(({ key }) => {
    const field = controlGrid.querySelector(`[data-ability-unlock-control="${key}"]`);
    const value = controlGrid.querySelector(`[data-ability-unlock-value="${key}"]`);
    const buttons = [...(field?.querySelectorAll("button") ?? [])];

    field?.classList.toggle("is-disabled", !enabled);
    buttons.forEach((button) => {
      button.disabled = !enabled;
    });

    if (value) {
      value.textContent = String(detailControlState.abilityUnlock[key]);
    }
  });
}

function getStarIconUrl(star) {
  return star <= 5 ? YELLOW_STAR_ICON_URL : BLUE_STAR_ICON_URL;
}

function formatStarRankLabel(star) {
  return star <= 5 ? `${star}성` : `전용무기 ${star - 5}성`;
}

function formatStatValue(statKey, value) {
  if (statKey === "criticalDamage") {
    return `${value}%`;
  }

  return Number(value).toLocaleString("ko-KR");
}

function renderStats(stats) {
  if (!statGrid) {
    return;
  }

  const rows = STAT_KEYS.map((statKey) => {
    const wrapper = document.createElement("div");
    const label = document.createElement("dt");
    const value = document.createElement("dd");

    wrapper.dataset.statKey = statKey;
    label.textContent = STAT_LABELS[statKey];
    value.textContent = formatStatValue(statKey, stats[statKey]);
    wrapper.append(label, value);

    return wrapper;
  });

  statGrid.replaceChildren(...rows);
}

function renderStatError(message) {
  if (!statGrid) {
    return;
  }

  const row = document.createElement("div");
  const value = document.createElement("dd");

  value.textContent = message;
  row.append(value);
  statGrid.replaceChildren(row);
}

function renderPageError(message) {
  setText("#character-profile-name", "오류");
  setText("#character-profile-description", message);
  renderStatError(message);
}

function findStudent(index, slug, id) {
  if (slug) {
    return index.find((student) => student.slug === slug);
  }

  if (id) {
    const characterId = Number(id);
    return index.find((student) => Number(student.characterId) === characterId);
  }

  return null;
}

async function loadMaterials(slug) {
  try {
    return await fetchJson(`./data/students/materials/${slug}.json`);
  } catch (error) {
    console.warn("학생 재화 정보를 불러오지 못했습니다.", error);
    return null;
  }
}

async function initCharacterDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get("slug");
  const idParam = params.get("id");
  let index;

  try {
    index = await fetchJson("./data/students/index.json");
  } catch (error) {
    console.error("학생 목록을 불러오지 못했습니다.", error);
    renderPageError("학생 목록을 불러오지 못했습니다.");
    return;
  }

  const student = findStudent(index, slugParam, idParam);

  if (!student) {
    console.error("학생을 찾지 못했습니다.", { slug: slugParam, id: idParam });
    renderPageError("학생을 찾지 못했습니다.");
    return;
  }

  const slug = student.slug;
  let materialsPromise;

  try {
    materialsPromise = loadMaterials(slug);
  } catch (error) {
    console.warn("학생 재화 정보를 불러오지 못했습니다.", error);
  }

  let detail;

  try {
    detail = await fetchJson(`./data/students/detail/${slug}.json`);
  } catch (error) {
    console.error("학생 상세 정보를 불러오지 못했습니다.", error);
    renderPageError("학생 상세 정보를 불러오지 못했습니다.");
    return;
  }

  const normalizedDetail = normalizeDetail(detail);

  renderDetail(normalizedDetail);

  let statData;

  try {
    statData = await fetchJson(`./data/students/stats/${slug}.json`);
  } catch (error) {
    console.error("스탯 정보를 불러오지 못했습니다.", error);
    renderStatError("스탯 정보를 불러오지 못했습니다.");
    return;
  }

  const renderCalculatedStats = () => {
    try {
      const options = readCurrentOptions(slug, statData.baseStar);
      renderStats(calculateStudentStats(statData, options));
    } catch (error) {
      console.error("스탯 정보를 불러오지 못했습니다.", error);
      renderStatError("스탯 정보를 불러오지 못했습니다.");
    }
  };

  renderControls(getDefaultOptions(slug, statData.baseStar));
  renderCalculatedStats();

  await materialsPromise;
}

initCharacterDetailPage();
