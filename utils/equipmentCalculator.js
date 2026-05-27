import { equipmentEnhancementItems } from "../data/equipment-enhancement-items.js";
import { equipmentLevelCosts } from "../data/equipment-level-costs.js";
import { equipmentMaterials } from "../data/equipment-materials.js";
import { equipmentTierMaxLevels } from "../data/equipment-tier-max-levels.js";
import { equipmentTierUpCosts } from "../data/equipment-tier-up-costs.js";

export const CURRENT_EQUIPMENT_STATES = {
  LV1: "LV1",
  MAX: "MAX",
};

export const EQUIPMENT_TIER_RANGE = {
  min: 1,
  max: 10,
};

export function calculateLevelCost(
  fromLevel,
  toLevel,
  levelCosts = equipmentLevelCosts,
  enhancementItems = equipmentEnhancementItems,
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
      needsReview: levelCosts.length === 0,
    };
  }

  const matchedRows = levelCosts.filter(
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

  const materialMap = new Map();
  let requiredExp = 0;
  let creditQuantity = 0;

  matchedRows.forEach((row) => {
    requiredExp += normalizeQuantity(row.exp);
    creditQuantity += normalizeQuantity(row.credit);
    mergeMaterials(materialMap, row.materials ?? []);
  });

  const enhancementResult = calculateEnhancementItemCost(requiredExp, enhancementItems);
  mergeMaterials(materialMap, enhancementResult.materials);

  return {
    fromLevel: normalizedFromLevel,
    toLevel: normalizedToLevel,
    requiredExp,
    providedExp: enhancementResult.providedExp,
    overflowExp: enhancementResult.overflowExp,
    materials: [...materialMap.values()],
    creditQuantity,
    missingRows,
    needsReview: levelCosts.length === 0 || missingRows.length > 0 || Boolean(enhancementResult.needsReview),
  };
}

export function calculateEnhancementItemCost(
  requiredExp,
  enhancementItems = equipmentEnhancementItems,
) {
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

  const sortedItems = [...enhancementItems]
    .filter((item) => normalizeQuantity(item.exp) > 0)
    .sort((left, right) => right.exp - left.exp);

  if (sortedItems.length === 0) {
    return {
      requiredExp: normalizedRequiredExp,
      providedExp: 0,
      overflowExp: 0,
      materials: [],
      needsReview: true,
    };
  }

  const maxExp = Math.max(...sortedItems.map((item) => item.exp));
  const limit = normalizedRequiredExp + maxExp;
  const bestByExp = Array.from({ length: limit + 1 }, () => null);

  bestByExp[0] = { count: 0, quantities: new Map() };

  for (let exp = 0; exp <= limit; exp += 1) {
    const current = bestByExp[exp];

    if (!current) {
      continue;
    }

    sortedItems.forEach((item) => {
      const nextExp = exp + item.exp;

      if (nextExp > limit) {
        return;
      }

      const nextQuantities = new Map(current.quantities);
      nextQuantities.set(item.id, (nextQuantities.get(item.id) ?? 0) + 1);
      const candidate = {
        count: current.count + 1,
        quantities: nextQuantities,
      };
      const existing = bestByExp[nextExp];

      if (!existing || candidate.count < existing.count) {
        bestByExp[nextExp] = candidate;
      }
    });
  }

  let bestExp = null;
  let bestResult = null;

  for (let exp = normalizedRequiredExp; exp <= limit; exp += 1) {
    const result = bestByExp[exp];

    if (!result) {
      continue;
    }

    if (
      !bestResult ||
      exp - normalizedRequiredExp < bestExp - normalizedRequiredExp ||
      (exp - normalizedRequiredExp === bestExp - normalizedRequiredExp && result.count < bestResult.count)
    ) {
      bestExp = exp;
      bestResult = result;
    }
  }

  const materials = sortedItems
    .map((item) => ({
      itemId: item.id,
      displayName: item.displayName,
      quantity: bestResult.quantities.get(item.id) ?? 0,
      needsReview: false,
    }))
    .filter((item) => item.quantity > 0);

  return {
    requiredExp: normalizedRequiredExp,
    providedExp: bestExp,
    overflowExp: bestExp - normalizedRequiredExp,
    materials,
    needsReview: false,
  };
}

export function calculateTierUpCost(
  equipmentType,
  fromTier,
  toTier,
  tierUpCosts = equipmentTierUpCosts,
) {
  const normalizedFromTier = normalizeTier(fromTier, { allowUnequipped: true });
  const normalizedToTier = normalizeTier(toTier, { allowUnequipped: false });

  if (!equipmentType || normalizedToTier <= normalizedFromTier) {
    return {
      equipmentType,
      fromTier: normalizedFromTier,
      toTier: normalizedToTier,
      materials: [],
      creditQuantity: 0,
      transitions: [],
      missingTransitions: [],
      needsReview: false,
    };
  }

  const transitionMap = new Map(
    tierUpCosts.map((cost) => [`${cost.fromTier}->${cost.toTier}`, cost]),
  );
  const materialMap = new Map();
  let creditQuantity = 0;
  const transitions = [];
  const missingTransitions = [];

  for (let tier = normalizedFromTier; tier < normalizedToTier; tier += 1) {
    const transition = transitionMap.get(`${tier}->${tier + 1}`);

    if (!transition) {
      missingTransitions.push({
        fromTier: tier,
        toTier: tier + 1,
      });
      continue;
    }

    transitions.push(transition);
    creditQuantity += normalizeQuantity(transition.creditQuantity);

    transition.materials.forEach((material) => {
      const equipmentMaterial = findEquipmentMaterial(equipmentType, material.blueprintTier);

      mergeMaterial(materialMap, {
        itemId: equipmentMaterial?.id ?? `equipment-${equipmentType}-blueprint-t${material.blueprintTier}`,
        displayName: equipmentMaterial?.displayName ?? `${material.blueprintTier}T 설계도`,
        quantity: material.quantity,
        needsReview: equipmentMaterial ? Boolean(equipmentMaterial.needsReview) : true,
      });
    });
  }

  return {
    equipmentType,
    fromTier: normalizedFromTier,
    toTier: normalizedToTier,
    materials: [...materialMap.values()],
    creditQuantity,
    transitions,
    missingTransitions,
    needsReview: missingTransitions.length > 0,
  };
}

export function calculateEquipmentCost(input) {
  const equipmentType = input?.equipmentType ?? input?.equipmentTypeId;
  const currentTier = normalizeTier(input?.currentTier ?? input?.fromTier, { allowUnequipped: true });
  const currentState = normalizeCurrentState(input?.currentState);
  const targetTier = normalizeTier(input?.targetTier ?? input?.toTier, { allowUnequipped: false });
  const materialMap = new Map();
  let creditQuantity = 0;
  const steps = [];
  let needsReview = false;

  if (!equipmentType) {
    return createEquipmentCostResult({
      equipmentType,
      currentTier,
      currentState,
      targetTier,
      materials: [],
      creditQuantity: 0,
      steps,
      isValid: false,
      errorCode: "MISSING_EQUIPMENT_TYPE",
      needsReview: false,
    });
  }

  if (targetTier < currentTier) {
    return createEquipmentCostResult({
      equipmentType,
      currentTier,
      currentState,
      targetTier,
      materials: [],
      creditQuantity: 0,
      steps,
      isValid: false,
      errorCode: "TARGET_BELOW_CURRENT",
      needsReview: false,
    });
  }

  if (targetTier === currentTier && currentState === CURRENT_EQUIPMENT_STATES.MAX) {
    return createEquipmentCostResult({
      equipmentType,
      currentTier,
      currentState,
      targetTier,
      materials: [],
      creditQuantity: 0,
      steps,
      isValid: true,
      errorCode: null,
      needsReview: false,
    });
  }

  const startTier = currentTier === 0 ? EQUIPMENT_TIER_RANGE.min : currentTier;

  for (let tier = startTier; tier <= targetTier; tier += 1) {
    const isStartingTier = tier === startTier;
    const isTargetTier = tier === targetTier;
    const shouldSkipStartingLevel =
      currentTier !== 0 && isStartingTier && currentState === CURRENT_EQUIPMENT_STATES.MAX;

    if (!shouldSkipStartingLevel) {
      const levelResult = calculateLevelCost(1, getTierMaxLevel(tier));

      mergeMaterials(materialMap, levelResult.materials);
      creditQuantity += levelResult.creditQuantity;
      needsReview = needsReview || Boolean(levelResult.needsReview);
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
        missingRows: levelResult.missingRows,
        needsReview: levelResult.needsReview,
      });
    }

    if (!isTargetTier) {
      const tierUpResult = calculateTierUpCost(equipmentType, tier, tier + 1);
      mergeMaterials(materialMap, tierUpResult.materials);
      creditQuantity += tierUpResult.creditQuantity;
      needsReview = needsReview || Boolean(tierUpResult.needsReview);
      steps.push({
        type: "tier-up",
        fromTier: tier,
        toTier: tier + 1,
        materials: tierUpResult.materials,
        creditQuantity: tierUpResult.creditQuantity,
        missingTransitions: tierUpResult.missingTransitions,
        needsReview: tierUpResult.needsReview,
      });
    }
  }

  return createEquipmentCostResult({
    equipmentType,
    currentTier,
    currentState,
    targetTier,
    materials: [...materialMap.values()],
    creditQuantity,
    steps,
    isValid: !needsReview,
    errorCode: needsReview ? "MISSING_COST_DATA" : null,
    needsReview,
  });
}

export function calculateStudentEquipmentCost({ slots }) {
  const results = slots.map((slot) => calculateEquipmentCost(slot));
  const materialMap = new Map();

  results.forEach((result) => {
    mergeMaterials(materialMap, result.materials);
  });

  return {
    isValid: results.every((result) => result.isValid),
    needsReview: results.some((result) => result.needsReview),
    results,
    materials: [...materialMap.values()],
  };
}

export const calculateStudentEquipmentMaterials = calculateStudentEquipmentCost;

// Shared helper for comparing required materials with owned inventory.
export function calculateMissingMaterials(requiredMaterials, userInventory) {
  const inventoryMap = createInventoryMap(userInventory);

  return requiredMaterials.map((material) => {
    const requiredQuantity = normalizeQuantity(material.quantity);
    const ownedQuantity = inventoryMap.get(material.itemId) ?? 0;

    return {
      ...material,
      requiredQuantity,
      ownedQuantity,
      missingQuantity: Math.max(0, requiredQuantity - ownedQuantity),
    };
  });
}

function createEquipmentCostResult({
  equipmentType,
  currentTier,
  currentState,
  targetTier,
  materials,
  creditQuantity,
  steps,
  isValid,
  errorCode,
  needsReview,
}) {
  const finalMaterials = [...materials];

  if (creditQuantity > 0) {
    finalMaterials.push({
      itemId: "credit",
      displayName: "크레딧",
      quantity: creditQuantity,
      needsReview: false,
    });
  }

  return {
    equipmentType,
    currentTier,
    currentState,
    targetTier,
    isValid,
    errorCode,
    needsReview,
    materials: finalMaterials,
    steps,
  };
}

function findEquipmentMaterial(equipmentType, tier) {
  return equipmentMaterials.find(
    (material) => material.equipmentTypeId === equipmentType && material.tier === Number(tier),
  );
}

function getTierMaxLevel(tier) {
  return equipmentTierMaxLevels.find((row) => row.tier === Number(tier))?.maxLevel ?? 1;
}

function normalizeTier(value, { allowUnequipped }) {
  if (allowUnequipped && (value === "none" || value === 0 || value === "0")) {
    return 0;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return allowUnequipped ? 0 : 1;
  }

  const minTier = allowUnequipped ? 0 : 1;
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

function mergeMaterials(materialMap, materials) {
  materials.forEach((material) => mergeMaterial(materialMap, material));
}

function mergeMaterial(materialMap, material) {
  const existing = materialMap.get(material.itemId);
  const quantity = normalizeQuantity(material.quantity);

  if (existing) {
    existing.quantity += quantity;
    existing.needsReview = existing.needsReview || Boolean(material.needsReview);
    return;
  }

  materialMap.set(material.itemId, {
    ...material,
    quantity,
    needsReview: Boolean(material.needsReview),
  });
}

function createInventoryMap(userInventory) {
  if (userInventory instanceof Map) {
    return new Map(
      [...userInventory.entries()].map(([itemId, quantity]) => [itemId, normalizeQuantity(quantity)]),
    );
  }

  if (!Array.isArray(userInventory)) {
    return new Map();
  }

  return new Map(
    userInventory
      .filter((item) => item?.itemId)
      .map((item) => [item.itemId, normalizeQuantity(item.quantity)]),
  );
}
