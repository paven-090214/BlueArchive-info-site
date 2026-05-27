import { starRankRequirements } from "../data/starRankRequirements.js";

const RANK_ORDER = [
  "base-1",
  "base-2",
  "base-3",
  "base-4",
  "base-5",
  "weapon-1",
  "weapon-2",
  "weapon-3",
  "weapon-4",
];

export function calculateStarRankEleph({
  currentBaseStar,
  currentWeaponStar = 0,
  targetBaseStar,
  targetWeaponStar = 0,
  requirements = starRankRequirements,
}) {
  const currentRank = normalizeRank({ baseStar: currentBaseStar, weaponStar: currentWeaponStar });
  const targetRank = normalizeRank({ baseStar: targetBaseStar, weaponStar: targetWeaponStar });
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  const targetIndex = RANK_ORDER.indexOf(targetRank);

  if (currentIndex < 0 || targetIndex < 0 || targetIndex <= currentIndex) {
    return {
      currentRank,
      targetRank,
      elephQuantity: 0,
      transitions: [],
      missingTransitions: [],
      needsReview: false,
      hasCompleteData: true,
    };
  }

  const transitionMap = new Map(requirements.map((requirement) => [requirement.fromRank, requirement]));
  const transitions = [];
  const missingTransitions = [];

  for (let index = currentIndex; index < targetIndex; index += 1) {
    const fromRank = RANK_ORDER[index];
    const toRank = RANK_ORDER[index + 1];
    const requirement = transitionMap.get(fromRank);

    if (!requirement || requirement.toRank !== toRank) {
      missingTransitions.push({
        fromRank,
        toRank,
      });
      continue;
    }

    transitions.push(requirement);
  }

  return {
    currentRank,
    targetRank,
    elephQuantity: transitions.reduce((sum, transition) => sum + transition.elephQuantity, 0),
    transitions,
    missingTransitions,
    needsReview: missingTransitions.length > 0,
    hasCompleteData: missingTransitions.length === 0,
  };
}

function normalizeRank({ baseStar, weaponStar }) {
  const normalizedWeaponStar = clampNumber(weaponStar, 0, 4);

  if (normalizedWeaponStar >= 1) {
    return `weapon-${normalizedWeaponStar}`;
  }

  const normalizedBaseStar = clampNumber(baseStar, 1, 5);
  return `base-${normalizedBaseStar}`;
}

function clampNumber(value, min, max) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(numberValue)));
}
