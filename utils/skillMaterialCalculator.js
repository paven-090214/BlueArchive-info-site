import { skillMaterialRequirements } from "../data/skillMaterialRequirements.js";

export const SKILL_LEVEL_RANGES = {
  ex: { min: 1, max: 5 },
  normal: { min: 1, max: 10 },
  passive: { min: 1, max: 10 },
  sub: { min: 1, max: 10 },
};

export function calculateSkillMaterials({
  studentId,
  skillType,
  currentLevel,
  targetLevel,
  requirements = skillMaterialRequirements,
}) {
  const range = SKILL_LEVEL_RANGES[skillType];

  if (!range) {
    throw new Error("알 수 없는 스킬 타입입니다.");
  }

  const normalizedCurrentLevel = normalizeLevel(currentLevel, range);
  const normalizedTargetLevel = normalizeLevel(targetLevel, range);

  if (normalizedTargetLevel <= normalizedCurrentLevel) {
    return {
      studentId,
      skillType,
      currentLevel: normalizedCurrentLevel,
      targetLevel: normalizedTargetLevel,
      matchedRows: [],
      missingRows: [],
      materials: [],
      hasData: hasSkillData({ studentId, skillType, requirements }),
      hasCompleteData: true,
      needsReview: false,
    };
  }

  const matchedRows = requirements.filter(
    (row) =>
      row.studentId === studentId &&
      row.skillType === skillType &&
      row.fromLevel >= normalizedCurrentLevel &&
      row.toLevel <= normalizedTargetLevel,
  );
  const matchedRowMap = new Map(matchedRows.map((row) => [`${row.fromLevel}->${row.toLevel}`, row]));
  const missingRows = [];

  for (let level = normalizedCurrentLevel; level < normalizedTargetLevel; level += 1) {
    const key = `${level}->${level + 1}`;

    if (!matchedRowMap.has(key)) {
      missingRows.push({
        fromLevel: level,
        toLevel: level + 1,
      });
    }
  }

  const materialMap = new Map();

  matchedRows.forEach((row) => {
    row.materials.forEach((material) => {
      const existing = materialMap.get(material.itemId);

      if (existing) {
        existing.quantity += material.quantity;
        existing.needsReview = existing.needsReview || Boolean(material.needsReview);
        return;
      }

      materialMap.set(material.itemId, {
        itemId: material.itemId,
        itemName: material.itemName,
        tier: material.tier,
        quantity: material.quantity,
        needsReview: Boolean(material.needsReview),
      });
    });
  });

  return {
    studentId,
    skillType,
    currentLevel: normalizedCurrentLevel,
    targetLevel: normalizedTargetLevel,
    matchedRows,
    missingRows,
    materials: [...materialMap.values()],
    hasData: hasSkillData({ studentId, skillType, requirements }),
    hasCompleteData: missingRows.length === 0,
    needsReview: missingRows.length > 0,
  };
}

function normalizeLevel(value, range) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return range.min;
  }

  return Math.min(range.max, Math.max(range.min, Math.trunc(numberValue)));
}

function hasSkillData({ studentId, skillType, requirements }) {
  return requirements.some((row) => row.studentId === studentId && row.skillType === skillType);
}
