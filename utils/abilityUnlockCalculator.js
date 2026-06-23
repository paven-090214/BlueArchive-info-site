export const ABILITY_UNLOCK_LEVEL_RANGE = {
  min: 0,
  max: 25,
};

export const DEFAULT_ABILITY_UNLOCK_STATE = {
  maxHpBonus: {
    currentLevel: 0,
    targetLevel: ABILITY_UNLOCK_LEVEL_RANGE.max,
  },
  attackBonus: {
    currentLevel: 0,
    targetLevel: ABILITY_UNLOCK_LEVEL_RANGE.max,
  },
  healBonus: {
    currentLevel: 0,
    targetLevel: ABILITY_UNLOCK_LEVEL_RANGE.max,
  },
};

const ABILITY_UNLOCK_BONUSES = [
  {
    key: "maxHpBonus",
    category: "ability_unlock_hp",
    displayName: "최대체력 보너스",
    materialName: "교양 체육 WB",
    itemNameCandidates: ["교양 체육 WB", "Applied Fitness Workbook"],
    iconNameCandidates: ["Item_Icon_WorkBook_PotentialMaxHP"],
  },
  {
    key: "attackBonus",
    category: "ability_unlock_attack",
    displayName: "공격력 보너스",
    materialName: "교양 사격 WB",
    itemNameCandidates: ["교양 사격 WB", "Applied Marksmanship Workbook"],
    iconNameCandidates: ["Item_Icon_WorkBook_PotentialAttack"],
  },
  {
    key: "healBonus",
    category: "ability_unlock_heal",
    displayName: "치유력 보너스",
    materialName: "교양 위생 WB",
    itemNameCandidates: ["교양 위생 WB", "Applied First Aid Workbook"],
    iconNameCandidates: ["Item_Icon_WorkBook_PotentialHealPower"],
  },
];

// WB quantities follow the current extracted ability opening table shape.
const ABILITY_UNLOCK_WB_REQUIREMENTS_BY_LEVEL = [
  2, 2, 2, 2, 2,
  2, 2, 2, 2, 2,
  3, 3, 3, 3, 3,
  3, 3, 3, 3, 3,
  4, 4, 4, 4, 4,
];

export function calculateAbilityUnlockMaterials({
  student,
  abilityUnlockState,
  itemsById,
  inventory,
} = {}) {
  const normalizedState = normalizeAbilityUnlockState(abilityUnlockState);
  const materialMap = new Map();
  const missingData = [];

  ABILITY_UNLOCK_BONUSES.forEach((bonus) => {
    const state = normalizedState[bonus.key];
    const requiredQuantity = calculateWorkbookQuantity(state.currentLevel, state.targetLevel);

    if (state.targetLevel > state.currentLevel && requiredQuantity <= 0) {
      missingData.push(`MISSING_REQUIREMENT_${bonus.key}`);
    }

    if (requiredQuantity <= 0) {
      return;
    }

    const item = findAbilityUnlockItem(itemsById, bonus);

    if (!item) {
      missingData.push(`MISSING_ITEM_${bonus.key}`);
    }

    mergeMaterial(materialMap, {
      itemId: item?.id ?? null,
      name: bonus.materialName,
      requiredQuantity,
      icon: resolveItemIcon(item),
      category: bonus.category,
      needsReview: !item || Boolean(item.needsReview),
    });
  });

  return {
    requiredMaterials: withOwnedQuantities([...materialMap.values()], inventory),
    hasData: Boolean(student) && missingData.length === 0,
    needsReview: missingData.length > 0,
    missingData,
  };
}

export function normalizeAbilityUnlockState(abilityUnlockState = {}) {
  return Object.fromEntries(
    ABILITY_UNLOCK_BONUSES.map((bonus) => {
      const state = abilityUnlockState?.[bonus.key] ?? DEFAULT_ABILITY_UNLOCK_STATE[bonus.key];
      const currentLevel = normalizeLevel(state.currentLevel);
      const targetLevel = normalizeLevel(state.targetLevel);

      return [bonus.key, {
        currentLevel,
        targetLevel: Math.max(currentLevel, targetLevel),
      }];
    }),
  );
}

export function getAbilityUnlockBonusConfigs() {
  return ABILITY_UNLOCK_BONUSES.map(({ key, displayName }) => ({
    key,
    displayName,
  }));
}

function calculateWorkbookQuantity(currentLevel, targetLevel) {
  let quantity = 0;

  for (let level = currentLevel + 1; level <= targetLevel; level += 1) {
    quantity += ABILITY_UNLOCK_WB_REQUIREMENTS_BY_LEVEL[level - 1] ?? 0;
  }

  return quantity;
}

function findAbilityUnlockItem(itemsById, bonus) {
  return toArray(itemsById).find((item) => {
    const name = String(item?.name ?? item?.Name ?? "");
    const icon = String(item?.icon ?? item?.Icon ?? item?.imageUrl ?? "");

    return bonus.itemNameCandidates.some((candidate) => name.includes(candidate)) ||
      bonus.iconNameCandidates.some((candidate) => icon.includes(candidate));
  });
}

function resolveItemIcon(item) {
  const icon = item?.imageUrl ?? item?.icon ?? item?.Icon ?? "";

  if (!icon) {
    return "";
  }

  if (String(icon).startsWith("./") || String(icon).startsWith("http")) {
    return icon;
  }

  return `./images/items/${icon}.png`;
}

function withOwnedQuantities(materials, inventory) {
  const inventoryMap = createInventoryMap(inventory);

  return materials.map((material) => {
    const requiredQuantity = normalizeQuantity(material.requiredQuantity);
    const ownedQuantity = material.itemId ? inventoryMap.get(String(material.itemId)) ?? 0 : 0;

    return {
      ...material,
      requiredQuantity,
      ownedQuantity,
      missingQuantity: Math.max(0, requiredQuantity - ownedQuantity),
    };
  });
}

function mergeMaterial(materialMap, material) {
  const materialKey = material.itemId ?? material.category;

  if (!materialKey) {
    return;
  }

  const existing = materialMap.get(String(materialKey));
  const quantity = normalizeQuantity(material.requiredQuantity);

  if (existing) {
    existing.requiredQuantity += quantity;
    existing.needsReview = existing.needsReview || Boolean(material.needsReview);
    return;
  }

  materialMap.set(String(materialKey), {
    ...material,
    itemId: material.itemId ? String(material.itemId) : "",
    requiredQuantity: quantity,
    needsReview: Boolean(material.needsReview),
  });
}

function createInventoryMap(userInventory) {
  if (userInventory instanceof Map) {
    return new Map([...userInventory.entries()].map(([itemId, quantity]) => [
      String(itemId),
      normalizeQuantity(quantity),
    ]));
  }

  if (Array.isArray(userInventory)) {
    return new Map(userInventory
      .filter((item) => item?.itemId)
      .map((item) => [String(item.itemId), normalizeQuantity(item.quantity)]));
  }

  if (userInventory && typeof userInventory === "object") {
    return new Map(Object.entries(userInventory).map(([itemId, quantity]) => [
      String(itemId),
      normalizeQuantity(quantity),
    ]));
  }

  return new Map();
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value instanceof Map) {
    return [...value.values()];
  }

  if (value && typeof value === "object") {
    return Object.values(value);
  }

  return [];
}

function normalizeLevel(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return ABILITY_UNLOCK_LEVEL_RANGE.min;
  }

  return Math.min(
    ABILITY_UNLOCK_LEVEL_RANGE.max,
    Math.max(ABILITY_UNLOCK_LEVEL_RANGE.min, Math.trunc(numberValue)),
  );
}

function normalizeQuantity(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.trunc(numberValue));
}
