export function normalizeStudentSkills(rawStudent) {
  const rawSkills = toSkillEntries(rawStudent?.Skills).map(({ skill, key, index }) => {
    return normalizeSkillVariant(skill, key, index);
  });
  const skillGroups = createEmptySkillGroups(rawSkills);

  rawSkills.forEach((skill) => {
    const slot = getSkillSlot(skill);

    if (slot && skillGroups[slot]) {
      skillGroups[slot].push(skill);
    }
  });

  return skillGroups;
}

function createEmptySkillGroups(rawSkills = []) {
  return {
    ex: [],
    normal: [],
    normalPlus: [],
    passive: [],
    passivePlus: [],
    sub: [],
    rawSkills,
  };
}

function normalizeSkillVariant(rawSkill, sourceKey, sourceIndex) {
  const id = rawSkill?.Id ?? rawSkill?.id ?? rawSkill?.SkillId ?? rawSkill?.skillId ?? null;
  const name = rawSkill?.Name ?? rawSkill?.name ?? null;
  const description =
    rawSkill?.Desc ??
    rawSkill?.Description ??
    rawSkill?.desc ??
    rawSkill?.description ??
    null;

  return {
    id,
    sourceKey: sourceKey ?? null,
    order: getSkillOrder(rawSkill, sourceIndex),
    name,
    description,
    icon: rawSkill?.Icon ?? rawSkill?.icon ?? null,
    cost: rawSkill?.Cost ?? rawSkill?.cost ?? null,
    trigger: rawSkill?.Trigger ?? rawSkill?.trigger ?? null,
    changeRule: rawSkill?.ChangeRule ?? rawSkill?.changeRule ?? null,
    slotHint: getSkillSlotHint(rawSkill, sourceKey),
    needsReview: !hasKnownSlotHint(rawSkill, sourceKey),
    raw: rawSkill,
  };
}

function getSkillSlot(skill) {
  const sourceSlot = getSkillSlotBySourceKey(skill.sourceKey);

  if (sourceSlot === "hidden") {
    return null;
  }

  if (sourceSlot) {
    return sourceSlot;
  }

  const hint = normalizeText(skill.slotHint);
  const name = normalizeText(skill.name);
  const text = `${hint} ${name}`;

  if (isAutoAttackSkill(text)) {
    return null;
  }

  if (isExSkill(text)) {
    return "ex";
  }

  if (isPlusSkill(text)) {
    if (isPassiveSkill(text)) {
      return "passivePlus";
    }

    if (isNormalSkill(text)) {
      return "normalPlus";
    }
  }

  if (isPassiveSkill(text)) {
    return "passive";
  }

  if (isSubSkill(text)) {
    return "sub";
  }

  if (isNormalSkill(text)) {
    return "normal";
  }

  return fallbackSlotByOrder(skill.order);
}

function getSkillSlotBySourceKey(sourceKey) {
  const key = normalizeText(sourceKey);
  const slotMap = {
    normal: "hidden",
    ex: "ex",
    public: "normal",
    gearpublic: "normalPlus",
    passive: "passive",
    weaponpassive: "passivePlus",
    extrapassive: "sub",
  };

  return slotMap[key] ?? null;
}

function getSkillSlotHint(rawSkill, sourceKey) {
  return [
    sourceKey,
    rawSkill?.Slot,
    rawSkill?.slot,
    rawSkill?.Type,
    rawSkill?.type,
    rawSkill?.SkillType,
    rawSkill?.skillType,
    rawSkill?.Category,
    rawSkill?.category,
    rawSkill?.SkillCategory,
    rawSkill?.skillCategory,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" ");
}

function hasKnownSlotHint(rawSkill, sourceKey) {
  const hint = normalizeText(getSkillSlotHint(rawSkill, sourceKey));
  return (
    isExSkill(hint) ||
    isNormalSkill(hint) ||
    isPassiveSkill(hint) ||
    isSubSkill(hint)
  );
}

function getSkillOrder(rawSkill, sourceIndex) {
  const order = rawSkill?.Order ?? rawSkill?.order ?? rawSkill?.SortOrder ?? rawSkill?.sortOrder;
  return Number.isFinite(Number(order)) ? Number(order) : sourceIndex;
}

function fallbackSlotByOrder(order) {
  return ["ex", "normal", "passive", "sub"][Number(order)] ?? "normal";
}

function isExSkill(text) {
  return /\bex\b/.test(text) || text.includes("exskill");
}

function isPlusSkill(text) {
  return (
    text.includes("+") ||
    text.includes("＋") ||
    text.includes("plus") ||
    text.includes("enhance") ||
    text.includes("gearnormal") ||
    text.includes("weaponpassive")
  );
}

function isNormalSkill(text) {
  return (
    text.includes("normal") ||
    text.includes("basic") ||
    text.includes("기본") ||
    text.includes("노말")
  );
}

function isPassiveSkill(text) {
  return (
    text.includes("passive") ||
    text.includes("enhanced") ||
    text.includes("강화") ||
    text.includes("패시브")
  );
}

function isSubSkill(text) {
  return text.includes("sub") || text.includes("extra") || text.includes("서브");
}

function isAutoAttackSkill(text) {
  return text.includes("autoattack");
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toSkillEntries(rawSkills) {
  if (Array.isArray(rawSkills)) {
    return rawSkills.flatMap((skill, index) => toSkillEntriesByValue(skill, String(index), index));
  }

  if (rawSkills && typeof rawSkills === "object") {
    return Object.entries(rawSkills).flatMap(([key, value], index) => {
      return toSkillEntriesByValue(value, key, index);
    });
  }

  return [];
}

function toSkillEntriesByValue(value, key, index) {
  if (Array.isArray(value)) {
    return value.map((skill, childIndex) => ({
      skill,
      key,
      index: childIndex,
    })).flatMap(({ skill, key: childKey, index: childIndex }) => {
      return toSkillEntryWithExtraSkills(skill, childKey, childIndex);
    });
  }

  if (value && typeof value === "object") {
    return toSkillEntryWithExtraSkills(value, key, index);
  }

  return [];
}

function toSkillEntryWithExtraSkills(skill, key, index) {
  const entries = [{ skill, key, index }];

  if (Array.isArray(skill?.ExtraSkills)) {
    skill.ExtraSkills.forEach((extraSkill, extraIndex) => {
      entries.push({
        skill: extraSkill,
        key,
        index: index + (extraIndex + 1) / 10,
      });
    });
  }

  return entries;
}
