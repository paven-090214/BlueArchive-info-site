import { exclusiveWeaponEnhancementItems } from "../data/growth/exclusiveWeaponEnhancementItems.js";
import { exclusiveWeaponLevelCosts } from "../data/growth/exclusiveWeaponLevelCosts.js";

const INITIAL_WEAPON_LEVEL = 1;
const TARGET_LEVEL_BY_WEAPON_STAR = new Map([
  [1, 30],
  [2, 40],
  [3, 50],
  [4, 60],
]);

export function calculateExclusiveWeaponMaterials({
  weaponType,
  targetWeaponStar,
  currentLevel = INITIAL_WEAPON_LEVEL,
  levelCosts = exclusiveWeaponLevelCosts,
  enhancementItems = exclusiveWeaponEnhancementItems,
}) {
  const normalizedTargetWeaponStar = normalizeInteger(targetWeaponStar, 0);
  const targetLevel = TARGET_LEVEL_BY_WEAPON_STAR.get(normalizedTargetWeaponStar) ?? currentLevel;
  const normalizedCurrentLevel = normalizeInteger(currentLevel, INITIAL_WEAPON_LEVEL);

  if (normalizedTargetWeaponStar <= 0 || targetLevel <= normalizedCurrentLevel) {
    return createEmptyResult({
      weaponType,
      currentLevel: normalizedCurrentLevel,
      targetLevel,
      targetWeaponStar: normalizedTargetWeaponStar,
      needsReview: false,
    });
  }

  const matchedRows = levelCosts.filter(
    (row) => row.fromLevel >= normalizedCurrentLevel && row.toLevel <= targetLevel,
  );
  const matchedRowMap = new Map(matchedRows.map((row) => [`${row.fromLevel}->${row.toLevel}`, row]));
  const missingRows = [];

  for (let level = normalizedCurrentLevel; level < targetLevel; level += 1) {
    const key = `${level}->${level + 1}`;

    if (!matchedRowMap.has(key)) {
      missingRows.push({ fromLevel: level, toLevel: level + 1 });
    }
  }

  const requiredExp = matchedRows.reduce((sum, row) => sum + normalizeInteger(row.exp, 0), 0);
  const creditQuantity = matchedRows.reduce((sum, row) => sum + normalizeInteger(row.credit, 0), 0);
  const enhancementResult = calculateExclusiveWeaponEnhancementItems({
    requiredExp,
    weaponType,
    enhancementItems,
  });
  const materials = [...enhancementResult.materials];

  if (creditQuantity > 0) {
    materials.push({
      itemId: "credit",
      itemName: "크레딧",
      quantity: creditQuantity,
      needsReview: false,
    });
  }

  return {
    weaponType,
    currentLevel: normalizedCurrentLevel,
    targetLevel,
    targetWeaponStar: normalizedTargetWeaponStar,
    requiredExp,
    providedExp: enhancementResult.providedExp,
    overExp: enhancementResult.overExp,
    materials,
    missingRows,
    needsReview: missingRows.length > 0 || enhancementResult.needsReview,
    hasCompleteData: missingRows.length === 0 && !enhancementResult.needsReview,
  };
}

export function calculateExclusiveWeaponEnhancementItems({
  requiredExp,
  weaponType,
  enhancementItems = exclusiveWeaponEnhancementItems,
}) {
  const normalizedRequiredExp = normalizeInteger(requiredExp, 0);

  if (normalizedRequiredExp <= 0) {
    return {
      requiredExp: normalizedRequiredExp,
      providedExp: 0,
      overExp: 0,
      materials: [],
      needsReview: false,
    };
  }

  const matchedItems = enhancementItems
    .filter((item) => !item.isUniversalBonus)
    .filter((item) => canUseEnhancementItemForWeaponType(item, weaponType))
    .map((item) => ({
      ...item,
      effectiveExp: Math.trunc(item.baseExp * item.bonusMultiplier),
    }))
    .filter((item) => item.effectiveExp > 0)
    .sort((left, right) => right.tierOrder - left.tierOrder);

  if (matchedItems.length === 0) {
    return {
      requiredExp: normalizedRequiredExp,
      providedExp: 0,
      overExp: 0,
      materials: [],
      needsReview: true,
    };
  }

  let remainingExp = normalizedRequiredExp;
  let providedExp = 0;
  const materials = [];

  matchedItems.forEach((item, index) => {
    if (remainingExp <= 0) {
      return;
    }

    const isLastItem = index === matchedItems.length - 1;
    const quantity = isLastItem
      ? Math.ceil(remainingExp / item.effectiveExp)
      : Math.floor(remainingExp / item.effectiveExp);

    if (quantity <= 0) {
      return;
    }

    const itemProvidedExp = quantity * item.effectiveExp;
    providedExp += itemProvidedExp;
    remainingExp -= itemProvidedExp;
    materials.push({
      itemId: item.id,
      itemName: item.displayName,
      tier: `tier${item.tierOrder}`,
      quantity,
      effectiveExp: item.effectiveExp,
      needsReview: false,
    });
  });

  return {
    requiredExp: normalizedRequiredExp,
    providedExp,
    overExp: Math.max(0, providedExp - normalizedRequiredExp),
    materials,
    needsReview: false,
  };
}

export function canUseEnhancementItemForWeaponType(item, weaponType) {
  return item.bonusWeaponTypes.includes("ALL") || item.bonusWeaponTypes.includes(weaponType);
}

function createEmptyResult({ weaponType, currentLevel, targetLevel, targetWeaponStar, needsReview }) {
  return {
    weaponType,
    currentLevel,
    targetLevel,
    targetWeaponStar,
    requiredExp: 0,
    providedExp: 0,
    overExp: 0,
    materials: [],
    missingRows: [],
    needsReview,
    hasCompleteData: !needsReview,
  };
}

function normalizeInteger(value, fallback) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(numberValue));
}
