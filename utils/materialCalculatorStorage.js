export const MATERIAL_CALCULATOR_STORAGE_KEY = "bluearchive:material-calculator:v1";

export const STUDENT_LEVEL_RANGE = {
  min: 1,
  max: 90,
};

export const WEAPON_LEVEL_RANGE = {
  min: 1,
  max: 70,
};

export const SKILL_LEVEL_RANGES = {
  ex: { min: 1, max: 5 },
  normal: { min: 1, max: 10 },
  passive: { min: 1, max: 10 },
  sub: { min: 1, max: 10 },
};

export const EQUIPMENT_TIER_RANGE = {
  min: 0,
  max: 10,
};

export const EQUIPMENT_CURRENT_STATES = {
  LV1: "LV1",
  MAX: "MAX",
};

export const UNIQUE_ITEM_TIERS = ["none", "tier1", "tier2"];

export function createMaterialCalculatorStudentKey({ groupId, formId, studentId } = {}) {
  if (groupId !== null && groupId !== undefined && formId !== null && formId !== undefined) {
    return `group:${groupId}:form:${formId}`;
  }

  return `student:${studentId ?? ""}`;
}

export function createDefaultMaterialCalculatorCardState(student = {}) {
  return normalizeMaterialCalculatorCardState({
    studentLevel: {
      currentLevel: STUDENT_LEVEL_RANGE.min,
      targetLevel: STUDENT_LEVEL_RANGE.max,
    },
    skills: Object.fromEntries(
      Object.entries(SKILL_LEVEL_RANGES).map(([key, range]) => [
        key,
        {
          currentLevel: range.min,
          targetLevel: range.max,
        },
      ]),
    ),
    equipment: createDefaultEquipmentState(student.equipmentSlots),
    uniqueItem: {
      currentTier: "none",
      targetTier: hasUniqueItem(student) ? "tier2" : "none",
    },
    starRank: {
      currentRank: normalizeBaseStar(student),
      targetRank: 9,
    },
    exclusiveWeapon: {
      currentLevel: WEAPON_LEVEL_RANGE.min,
      targetLevel: WEAPON_LEVEL_RANGE.max,
    },
  }, student);
}

export function loadMaterialCalculatorCards({
  storage = globalThis.window?.localStorage,
  storageKey = MATERIAL_CALCULATOR_STORAGE_KEY,
} = {}) {
  if (!storage) {
    return [];
  }

  try {
    const payload = JSON.parse(storage.getItem(storageKey) || "[]");
    return Array.isArray(payload) ? payload.map(normalizeSavedCardRecord).filter(Boolean) : [];
  } catch (error) {
    console.warn("재화 계산기 목록을 불러오지 못했습니다.", error);
    return [];
  }
}

export function saveMaterialCalculatorCards(
  cards,
  {
    storage = globalThis.window?.localStorage,
    storageKey = MATERIAL_CALCULATOR_STORAGE_KEY,
  } = {},
) {
  if (!storage) {
    return;
  }

  const records = Array.isArray(cards)
    ? cards.map(normalizeSavedCardRecord).filter(Boolean)
    : [];
  storage.setItem(storageKey, JSON.stringify(records));
}

export function normalizeMaterialCalculatorCardState(state = {}, student = {}) {
  const studentLevel = normalizeRangePair(state.studentLevel, STUDENT_LEVEL_RANGE);
  const skills = Object.fromEntries(
    Object.entries(SKILL_LEVEL_RANGES).map(([key, range]) => [
      key,
      normalizeRangePair(state.skills?.[key], range),
    ]),
  );
  const equipment = normalizeEquipmentState(state.equipment, student.equipmentSlots);
  const hasGear = hasUniqueItem(student);
  const uniqueItem = {
    currentTier: normalizeUniqueItemTier(state.uniqueItem?.currentTier, "none", hasGear),
    targetTier: normalizeUniqueItemTier(state.uniqueItem?.targetTier, hasGear ? "tier2" : "none", hasGear),
  };
  const baseStar = normalizeBaseStar(student);
  const starCurrent = clampInteger(state.starRank?.currentRank, baseStar, 9, baseStar);
  const starTarget = clampInteger(state.starRank?.targetRank, 1, 9, 9);
  const exclusiveWeapon = normalizeRangePair(state.exclusiveWeapon, WEAPON_LEVEL_RANGE);

  return {
    studentLevel,
    skills,
    equipment,
    uniqueItem: {
      currentTier: uniqueItem.currentTier,
      targetTier: getUniqueItemTierOrder(uniqueItem.targetTier) < getUniqueItemTierOrder(uniqueItem.currentTier)
        ? uniqueItem.currentTier
        : uniqueItem.targetTier,
    },
    starRank: {
      currentRank: starCurrent,
      targetRank: Math.max(starCurrent, starTarget),
    },
    exclusiveWeapon,
  };
}

function createDefaultEquipmentState(equipmentSlots = []) {
  return Object.fromEntries(
    toArray(equipmentSlots).map((slot, index) => [
      `slot${index + 1}`,
      {
        currentTier: EQUIPMENT_TIER_RANGE.min,
        currentState: EQUIPMENT_CURRENT_STATES.LV1,
        targetTier: 10,
      },
    ]),
  );
}

function normalizeEquipmentState(equipmentState = {}, equipmentSlots = []) {
  return Object.fromEntries(
    toArray(equipmentSlots).map((slot, index) => {
      const key = `slot${index + 1}`;
      const source = equipmentState?.[key] ?? {};
      const currentTier = clampInteger(source.currentTier, EQUIPMENT_TIER_RANGE.min, EQUIPMENT_TIER_RANGE.max, 0);
      const targetTier = clampInteger(source.targetTier, 1, EQUIPMENT_TIER_RANGE.max, EQUIPMENT_TIER_RANGE.max);
      const currentState = source.currentState === EQUIPMENT_CURRENT_STATES.MAX
        ? EQUIPMENT_CURRENT_STATES.MAX
        : EQUIPMENT_CURRENT_STATES.LV1;

      return [key, {
        currentTier,
        currentState,
        targetTier: Math.max(currentTier, targetTier),
      }];
    }),
  );
}

function normalizeRangePair(source = {}, range) {
  const currentLevel = clampInteger(source.currentLevel, range.min, range.max, range.min);
  const targetLevel = clampInteger(source.targetLevel, range.min, range.max, range.max);

  return {
    currentLevel,
    targetLevel: Math.max(currentLevel, targetLevel),
  };
}

function normalizeSavedCardRecord(record) {
  if (!record || typeof record !== "object" || !record.studentKey) {
    return null;
  }

  return {
    studentKey: String(record.studentKey),
    groupId: record.groupId ?? null,
    formId: record.formId ?? null,
    studentId: record.studentId ?? null,
    state: record.state && typeof record.state === "object" ? record.state : {},
  };
}

function normalizeUniqueItemTier(value, fallback, hasGear) {
  if (!hasGear) {
    return "none";
  }

  return UNIQUE_ITEM_TIERS.includes(value) ? value : fallback;
}

function getUniqueItemTierOrder(tier) {
  return UNIQUE_ITEM_TIERS.indexOf(tier);
}

function normalizeBaseStar(student) {
  return clampInteger(student?.star ?? student?.baseStar ?? student?.raw?.StarGrade, 1, 5, 1);
}

function hasUniqueItem(student) {
  const gear = student?.gear ?? student?.uniqueItem ?? null;
  return Boolean(gear?.name || gear?.Name);
}

function clampInteger(value, min, max, fallback) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(numberValue)));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}
