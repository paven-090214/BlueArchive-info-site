export const CURRENT_EQUIPMENT_STATES = {
  LV1: "LV1",
  MAX: "MAX",
};

export const EQUIPMENT_TIER_RANGE = {
  min: 1,
  max: 10,
};

const CREDIT_ITEM_ID = "currency:1";
const EQUIPMENT_ICON_81PX_FILE_NAMES = new Set([
  "Equipment_Icon_Badge_Tier2_Piece",
  "Equipment_Icon_Bag_Tier3_Piece",
  "Equipment_Icon_Bag_Tier4_Piece",
  "Equipment_Icon_Bag_Tier5_Piece",
  "Equipment_Icon_Charm_Tier4_Piece",
  "Equipment_Icon_Gloves_Tier7_Piece",
  "Equipment_Icon_Hat_Tier5_Piece",
  "Equipment_Icon_Necklace_Tier4_Piece",
  "Equipment_Icon_Shoes_Tier2_Piece",
]);

export function createEquipmentByCategory(equipmentList = []) {
  const categoryMap = new Map();

  toArray(equipmentList).forEach((equipment) => {
    const category = equipment?.category ?? equipment?.Category;
    const tier = Number(equipment?.tier ?? equipment?.Tier);
    const maxLevel = Number(equipment?.maxLevel ?? equipment?.MaxLevel);

    if (!category || !Number.isFinite(tier)) {
      return;
    }

    if (!categoryMap.has(category)) {
      categoryMap.set(category, new Map());
    }

    if (category !== "Exp" && (!Number.isFinite(maxLevel) || maxLevel <= 1)) {
      return;
    }

    categoryMap.get(category).set(tier, equipment);
  });

  return categoryMap;
}

export function calculateEquipmentMaterials({
  student,
  equipmentState,
  equipmentByCategory,
  equipmentById,
  itemsById,
  currencyById,
  inventory,
  levelCostRows = [],
} = {}) {
  const slots = Array.isArray(student?.equipmentSlots) ? student.equipmentSlots : [];
  const materialMap = new Map();
  const slotResults = slots.map((equipmentCategory, index) => {
    const slotKey = `slot${index + 1}`;
    const slotState = equipmentState?.[slotKey] ?? {};
    const result = calculateEquipmentSlotMaterials({
      slotIndex: index,
      equipmentCategory,
      equipmentState: slotState,
      equipmentByCategory,
      equipmentById,
      itemsById,
      currencyById,
      levelCostRows,
    });

    mergeMaterials(materialMap, result.materials);
    return result;
  });

  const requiredMaterials = withOwnedQuantities([...materialMap.values()], inventory);
  const hasData = slotResults.length > 0 && slotResults.every((result) => result.hasData);
  const needsReview = slotResults.some((result) => result.needsReview);

  return {
    requiredMaterials,
    slotResults: slotResults.map((result) => ({
      ...result,
      materials: withOwnedQuantities(result.materials, inventory),
    })),
    hasData,
    needsReview,
  };
}

export function calculateEquipmentSlotMaterials({
  slotIndex = 0,
  equipmentCategory,
  equipmentState,
  equipmentByCategory,
  equipmentById,
  itemsById,
  currencyById,
  levelCostRows = [],
} = {}) {
  const currentTier = normalizeTier(equipmentState?.currentTier, { allowUnequipped: true });
  const targetTier = normalizeTier(equipmentState?.targetTier, { allowUnequipped: false });
  const currentState = normalizeCurrentState(equipmentState?.currentState);
  const materialMap = new Map();
  const steps = [];
  const missingData = [];

  if (!equipmentCategory) {
    missingData.push("MISSING_EQUIPMENT_CATEGORY");
  }

  if (targetTier < currentTier) {
    missingData.push("TARGET_BELOW_CURRENT");
  }

  const startTier = currentTier === 0 ? EQUIPMENT_TIER_RANGE.min : currentTier;

  if (equipmentCategory && targetTier >= currentTier) {
    for (let tier = startTier; tier <= targetTier; tier += 1) {
      const isStartingTier = tier === startTier;
      const isTargetTier = tier === targetTier;
      const shouldSkipStartingLevel =
        currentTier !== 0 && isStartingTier && currentState === CURRENT_EQUIPMENT_STATES.MAX;

      if (!shouldSkipStartingLevel) {
        const equipment = getEquipmentByCategoryAndTier(equipmentByCategory, equipmentCategory, tier);
        const levelResult = calculateLevelCost(1, getEquipmentMaxLevel(equipment, tier), {
          levelCostRows,
          enhancementItems: getEnhancementItems(equipmentByCategory),
        });

        mergeMaterials(materialMap, levelResult.materials);
        addCredit(materialMap, levelResult.creditQuantity, currencyById);

        if (levelResult.needsReview) {
          missingData.push("MISSING_LEVEL_COST_DATA");
        }

        steps.push({
          type: "level",
          tier,
          fromLevel: levelResult.fromLevel,
          toLevel: levelResult.toLevel,
          requiredExp: levelResult.requiredExp,
          providedExp: levelResult.providedExp,
          overflowExp: levelResult.overflowExp,
          materials: levelResult.materials,
          creditQuantity: levelResult.creditQuantity,
          needsReview: levelResult.needsReview,
        });
      }

      if (!isTargetTier) {
        const nextEquipment = getEquipmentByCategoryAndTier(equipmentByCategory, equipmentCategory, tier + 1);

        if (!nextEquipment) {
          missingData.push(`MISSING_EQUIPMENT_TIER_${tier + 1}`);
          continue;
        }

        const tierUpResult = calculateTierUpCostFromEquipment(nextEquipment, { equipmentById, itemsById });
        mergeMaterials(materialMap, tierUpResult.materials);
        addCredit(materialMap, tierUpResult.creditQuantity, currencyById);

        if (tierUpResult.needsReview) {
          missingData.push(`MISSING_RECIPE_TIER_${tier + 1}`);
        }

        steps.push({
          type: "tier-up",
          fromTier: tier,
          toTier: tier + 1,
          materials: tierUpResult.materials,
          creditQuantity: tierUpResult.creditQuantity,
          needsReview: tierUpResult.needsReview,
        });
      }
    }
  }

  return {
    slotIndex,
    equipmentCategory,
    currentTier,
    targetTier,
    currentState,
    materials: [...materialMap.values()],
    steps,
    hasData: missingData.length === 0,
    needsReview: missingData.length > 0,
    missingData,
  };
}

export function calculateLevelCost(
  fromLevel,
  toLevel,
  { levelCostRows = [], enhancementItems = [] } = {},
) {
  const normalizedFromLevel = normalizeLevel(fromLevel);
  const normalizedToLevel = normalizeLevel(toLevel);

  if (normalizedToLevel <= normalizedFromLevel) {
    return {
      fromLevel: normalizedFromLevel,
      toLevel: normalizedToLevel,
      requiredExp: 0,
      providedExp: 0,
      overflowExp: 0,
      materials: [],
      creditQuantity: 0,
      missingRows: [],
      needsReview: levelCostRows.length === 0,
    };
  }

  const matchedRows = levelCostRows.filter(
    (row) => row.fromLevel >= normalizedFromLevel && row.toLevel <= normalizedToLevel,
  );
  const matchedRowMap = new Map(matchedRows.map((row) => [`${row.fromLevel}->${row.toLevel}`, row]));
  const missingRows = [];

  for (let level = normalizedFromLevel; level < normalizedToLevel; level += 1) {
    const key = `${level}->${level + 1}`;

    if (!matchedRowMap.has(key)) {
      missingRows.push({
        fromLevel: level,
        toLevel: level + 1,
      });
    }
  }

  let requiredExp = 0;
  let creditQuantity = 0;

  matchedRows.forEach((row) => {
    requiredExp += normalizeQuantity(row.exp);
    creditQuantity += normalizeQuantity(row.credit);
  });

  const enhancementResult = calculateEnhancementItemCost(requiredExp, enhancementItems);

  return {
    fromLevel: normalizedFromLevel,
    toLevel: normalizedToLevel,
    requiredExp,
    providedExp: enhancementResult.providedExp,
    overflowExp: enhancementResult.overflowExp,
    materials: enhancementResult.materials,
    creditQuantity,
    missingRows,
    needsReview: levelCostRows.length === 0 || missingRows.length > 0 || Boolean(enhancementResult.needsReview),
  };
}

export function calculateEnhancementItemCost(requiredExp, enhancementItems = []) {
  const normalizedRequiredExp = normalizeQuantity(requiredExp);

  if (normalizedRequiredExp <= 0) {
    return {
      requiredExp: normalizedRequiredExp,
      providedExp: 0,
      overflowExp: 0,
      materials: [],
      needsReview: false,
    };
  }

  const sortedItems = toArray(enhancementItems)
    .filter((item) => normalizeQuantity(item.levelUpFeedExp ?? item.LevelUpFeedExp) > 0)
    .sort((left, right) => {
      return normalizeQuantity(right.levelUpFeedExp ?? right.LevelUpFeedExp) -
        normalizeQuantity(left.levelUpFeedExp ?? left.LevelUpFeedExp);
    });

  if (sortedItems.length === 0) {
    return {
      requiredExp: normalizedRequiredExp,
      providedExp: 0,
      overflowExp: 0,
      materials: [],
      needsReview: true,
    };
  }

  const bestResult = calculateMinimumEnhancementItems(normalizedRequiredExp, sortedItems);
  const materials = bestResult.items.map(({ item, quantity }) => createMaterial({
    source: item,
    quantity,
    category: "equipment-enhancement",
    needsReview: false,
  }));

  return {
    requiredExp: normalizedRequiredExp,
    providedExp: bestResult.providedExp,
    overflowExp: bestResult.overflowExp,
    materials,
    needsReview: false,
  };
}

export function calculateTierUpCostFromEquipment(equipment, { equipmentById, itemsById } = {}) {
  const recipeSource = equipment?.recipe ?? equipment?.Recipe ?? equipment?.raw?.Recipe;
  const recipes = Array.isArray(recipeSource) ? recipeSource : [];
  const materialMap = new Map();
  const creditQuantity = normalizeQuantity(equipment?.recipeCost ?? equipment?.RecipeCost ?? equipment?.raw?.RecipeCost);

  recipes.forEach(([itemId, quantity]) => {
    const recipeItem = getEquipmentById(itemId) ?? getItemById(itemId);

    mergeMaterial(materialMap, createMaterial({
      source: recipeItem ?? { id: itemId, Id: itemId },
      quantity,
      category: "equipment-blueprint",
      needsReview: !recipeItem,
    }));
  });

  return {
    materials: [...materialMap.values()],
    creditQuantity,
    needsReview: recipes.length === 0 && Number(equipment?.tier ?? equipment?.Tier) > 1,
  };

  function getEquipmentById(itemId) {
    return getFromMapLike(equipmentById, Number(itemId)) ?? getFromMapLike(equipmentById, String(itemId));
  }

  function getItemById(itemId) {
    return getFromMapLike(itemsById, Number(itemId)) ?? getFromMapLike(itemsById, String(itemId));
  }
}

export function calculateEquipmentCost(input = {}) {
  const student = {
    equipmentSlots: [input.equipmentCategory ?? input.equipmentType ?? input.equipmentTypeId],
  };
  const result = calculateEquipmentMaterials({
    student,
    equipmentState: {
      slot1: input,
    },
    equipmentByCategory: input.equipmentByCategory,
    equipmentById: input.equipmentById,
    itemsById: input.itemsById,
    currencyById: input.currencyById,
    inventory: input.inventory,
    levelCostRows: input.levelCostRows,
  });

  return result.slotResults[0] ?? {
    isValid: false,
    needsReview: true,
    materials: [],
  };
}

export function calculateStudentEquipmentCost(input = {}) {
  return calculateEquipmentMaterials({
    student: {
      equipmentSlots: toArray(input.slots).map((slot) => slot.equipmentCategory ?? slot.equipmentType ?? slot.equipmentTypeId),
    },
    equipmentState: Object.fromEntries(
      toArray(input.slots).map((slot, index) => [`slot${index + 1}`, slot]),
    ),
    equipmentByCategory: input.equipmentByCategory,
    equipmentById: input.equipmentById,
    itemsById: input.itemsById,
    currencyById: input.currencyById,
    inventory: input.inventory,
    levelCostRows: input.levelCostRows,
  });
}

export const calculateStudentEquipmentMaterials = calculateStudentEquipmentCost;

export function calculateMissingMaterials(requiredMaterials, userInventory) {
  return withOwnedQuantities(requiredMaterials, userInventory);
}

function getEquipmentByCategoryAndTier(equipmentByCategory, category, tier) {
  const categoryRows = getFromMapLike(equipmentByCategory, category);
  return getFromMapLike(categoryRows, Number(tier)) ?? getFromMapLike(categoryRows, String(tier));
}

function getEnhancementItems(equipmentByCategory) {
  const expRows = getFromMapLike(equipmentByCategory, "Exp");

  if (expRows instanceof Map) {
    return [...expRows.values()];
  }

  if (Array.isArray(expRows)) {
    return expRows;
  }

  if (expRows && typeof expRows === "object") {
    return Object.values(expRows);
  }

  return [];
}

function getEquipmentMaxLevel(equipment, tier) {
  const maxLevel = Number(equipment?.maxLevel ?? equipment?.MaxLevel);

  if (Number.isFinite(maxLevel) && maxLevel > 0) {
    return maxLevel;
  }

  return [0, 10, 20, 30, 40, 45, 50, 55, 60, 65, 70][Number(tier)] ?? 1;
}

function calculateMinimumEnhancementItems(requiredExp, enhancementItems) {
  const maxItemExp = Math.max(
    ...enhancementItems.map((item) => normalizeQuantity(item.levelUpFeedExp ?? item.LevelUpFeedExp)),
  );
  const targetLimit = requiredExp + maxItemExp;
  const dp = Array.from({ length: targetLimit + 1 }, () => null);
  dp[0] = {
    count: 0,
    itemQuantities: new Map(),
  };

  for (let exp = 0; exp <= targetLimit; exp += 1) {
    if (!dp[exp]) {
      continue;
    }

    enhancementItems.forEach((item) => {
      const itemExp = normalizeQuantity(item.levelUpFeedExp ?? item.LevelUpFeedExp);
      const nextExp = exp + itemExp;

      if (nextExp > targetLimit) {
        return;
      }

      const nextCount = dp[exp].count + 1;
      const existing = dp[nextExp];

      if (existing && existing.count <= nextCount) {
        return;
      }

      const itemId = String(item.id ?? item.Id);
      const itemQuantities = new Map(dp[exp].itemQuantities);
      itemQuantities.set(itemId, (itemQuantities.get(itemId) ?? 0) + 1);
      dp[nextExp] = {
        count: nextCount,
        itemQuantities,
      };
    });
  }

  let bestExp = requiredExp;

  for (let exp = requiredExp; exp <= targetLimit; exp += 1) {
    if (!dp[exp]) {
      continue;
    }

    if (!dp[bestExp]) {
      bestExp = exp;
      continue;
    }

    const overflow = exp - requiredExp;
    const bestOverflow = bestExp - requiredExp;

    if (overflow < bestOverflow || (overflow === bestOverflow && dp[exp].count < dp[bestExp].count)) {
      bestExp = exp;
    }
  }

  const itemById = new Map(enhancementItems.map((item) => [String(item.id ?? item.Id), item]));
  const items = [...(dp[bestExp]?.itemQuantities ?? new Map()).entries()]
    .map(([itemId, quantity]) => ({
      item: itemById.get(itemId),
      quantity,
    }))
    .filter((entry) => entry.item && entry.quantity > 0);

  return {
    providedExp: bestExp,
    overflowExp: Math.max(0, bestExp - requiredExp),
    items,
  };
}

function addCredit(materialMap, creditQuantity, currencyById) {
  const quantity = normalizeQuantity(creditQuantity);

  if (quantity <= 0) {
    return;
  }

  const credit = getFromMapLike(currencyById, 1) ?? getFromMapLike(currencyById, "1") ?? {};
  mergeMaterial(materialMap, {
    itemId: CREDIT_ITEM_ID,
    name: credit.name ?? credit.Name ?? "크레딧",
    requiredQuantity: quantity,
    icon: resolveCurrencyIcon(credit),
    category: "currency",
    needsReview: false,
  });
}

function createMaterial({ source, quantity, category, needsReview }) {
  const itemId = source?.id ?? source?.Id;

  return {
    itemId: createMaterialItemId(itemId, category),
    name: source?.name ?? source?.Name ?? "재화 이름 확인 필요",
    requiredQuantity: normalizeQuantity(quantity),
    icon: resolveMaterialIcon(source),
    category,
    needsReview: Boolean(needsReview),
  };
}

function createMaterialItemId(itemId, category) {
  if (itemId === null || itemId === undefined) {
    return null;
  }

  if (category === "equipment-enhancement") {
    return `equipment:${itemId}`;
  }

  return String(itemId);
}

function resolveMaterialIcon(source) {
  const icon = source?.icon ?? source?.Icon ?? "";

  if (!icon) {
    return "";
  }

  if (String(icon).startsWith("./") || String(icon).startsWith("http")) {
    return icon;
  }

  if (String(icon).startsWith("equipment_icon_exp_")) {
    return `./images/items/equipment-enhancement-stones/${icon}.webp`;
  }

  const fileName = toEquipmentIconFileName(icon);
  const filePrefix = EQUIPMENT_ICON_81PX_FILE_NAMES.has(fileName) ? "81px-" : "";
  return `./images/items/Equipment_Icon/${filePrefix}${fileName}.png`;
}

function resolveCurrencyIcon(currency) {
  const icon = currency?.icon ?? currency?.Icon ?? "";

  if (String(icon).startsWith("./") || String(icon).startsWith("http")) {
    return icon;
  }

  return "./images/items/common/credit.png";
}

function toEquipmentIconFileName(icon) {
  return String(icon)
    .split("_")
    .map((part) => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
    .join("_");
}

function withOwnedQuantities(materials, inventory) {
  const inventoryMap = createInventoryMap(inventory);

  return toArray(materials).map((material) => {
    const requiredQuantity = normalizeQuantity(material.requiredQuantity ?? material.quantity);
    const ownedQuantity = inventoryMap.get(String(material.itemId)) ?? 0;

    return {
      ...material,
      requiredQuantity,
      ownedQuantity,
      missingQuantity: Math.max(0, requiredQuantity - ownedQuantity),
    };
  });
}

function mergeMaterials(materialMap, materials) {
  toArray(materials).forEach((material) => mergeMaterial(materialMap, material));
}

function mergeMaterial(materialMap, material) {
  const itemId = material?.itemId;

  if (itemId === null || itemId === undefined || itemId === "") {
    return;
  }

  const existing = materialMap.get(String(itemId));
  const quantity = normalizeQuantity(material.requiredQuantity ?? material.quantity);

  if (existing) {
    existing.requiredQuantity += quantity;
    existing.needsReview = existing.needsReview || Boolean(material.needsReview);
    return;
  }

  materialMap.set(String(itemId), {
    ...material,
    itemId: String(itemId),
    requiredQuantity: quantity,
    needsReview: Boolean(material.needsReview),
  });
}

function createInventoryMap(userInventory) {
  if (userInventory instanceof Map) {
    return new Map(
      [...userInventory.entries()].map(([itemId, quantity]) => [String(itemId), normalizeQuantity(quantity)]),
    );
  }

  if (Array.isArray(userInventory)) {
    return new Map(
      userInventory
        .filter((item) => item?.itemId)
        .map((item) => [String(item.itemId), normalizeQuantity(item.quantity)]),
    );
  }

  if (userInventory && typeof userInventory === "object") {
    return new Map(
      Object.entries(userInventory).map(([itemId, quantity]) => [String(itemId), normalizeQuantity(quantity)]),
    );
  }

  return new Map();
}

function getFromMapLike(source, key) {
  if (source instanceof Map) {
    return source.get(key);
  }

  if (source && typeof source === "object") {
    return source[key];
  }

  return undefined;
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

function normalizeTier(value, { allowUnequipped }) {
  if (allowUnequipped && (value === "none" || value === 0 || value === "0")) {
    return 0;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return allowUnequipped ? 0 : EQUIPMENT_TIER_RANGE.min;
  }

  const minTier = allowUnequipped ? 0 : EQUIPMENT_TIER_RANGE.min;
  return Math.min(EQUIPMENT_TIER_RANGE.max, Math.max(minTier, Math.trunc(numberValue)));
}

function normalizeCurrentState(value) {
  if (value === CURRENT_EQUIPMENT_STATES.MAX) {
    return CURRENT_EQUIPMENT_STATES.MAX;
  }

  return CURRENT_EQUIPMENT_STATES.LV1;
}

function normalizeLevel(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 1;
  }

  return Math.max(1, Math.trunc(numberValue));
}

function normalizeQuantity(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.trunc(numberValue));
}
