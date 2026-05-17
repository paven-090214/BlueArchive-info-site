import { activityReports } from "../data/growth/activityReports.js";
import { characterExpTable } from "../data/growth/characterExpTable.js";

const CREDIT_PER_EXP = 7;

export function calculateCharacterLevelMaterials({
  currentLevel,
  targetLevel,
  expTable = characterExpTable,
  reports = activityReports,
}) {
  const maxLevel = Math.max(...expTable.map((row) => row.level));
  const normalizedCurrentLevel = normalizeLevel(currentLevel, maxLevel);
  const normalizedTargetLevel = normalizeLevel(targetLevel, maxLevel);

  if (normalizedTargetLevel <= normalizedCurrentLevel) {
    return {
      currentLevel: normalizedCurrentLevel,
      targetLevel: normalizedTargetLevel,
      requiredExp: 0,
      creditQuantity: 0,
      reports: [],
      materials: [],
    };
  }

  const requiredExp = getRequiredExp({
    currentLevel: normalizedCurrentLevel,
    targetLevel: normalizedTargetLevel,
    expTable,
  });
  const creditQuantity = requiredExp * CREDIT_PER_EXP;
  const reportRequirements = calculateActivityReports({ requiredExp, reports });

  return {
    currentLevel: normalizedCurrentLevel,
    targetLevel: normalizedTargetLevel,
    requiredExp,
    creditQuantity,
    reports: reportRequirements,
    materials: [
      ...reportRequirements.map((report) => ({
        itemId: report.itemId,
        itemName: report.itemName,
        tier: report.tier,
        quantity: report.quantity,
        needsReview: false,
      })),
      {
        itemId: "credit",
        itemName: "크레딧",
        tier: null,
        quantity: creditQuantity,
        needsReview: false,
      },
    ],
  };
}

function getRequiredExp({ currentLevel, targetLevel, expTable }) {
  const expMap = new Map(expTable.map((row) => [row.level, row]));
  const currentTotalExp = expMap.get(currentLevel)?.totalExp ?? 0;
  const targetTotalExp = expMap.get(targetLevel)?.totalExp ?? currentTotalExp;

  return Math.max(0, targetTotalExp - currentTotalExp);
}

function calculateActivityReports({ requiredExp, reports }) {
  let remainingExp = requiredExp;
  const sortedReports = [...reports].sort((left, right) => right.exp - left.exp);
  const result = [];

  sortedReports.forEach((report, index) => {
    if (remainingExp <= 0) {
      return;
    }

    const isLastReport = index === sortedReports.length - 1;
    const quantity = isLastReport
      ? Math.ceil(remainingExp / report.exp)
      : Math.floor(remainingExp / report.exp);

    if (quantity <= 0) {
      return;
    }

    result.push({
      itemId: report.id,
      itemName: report.name,
      tier: report.tier,
      exp: report.exp,
      quantity,
    });
    remainingExp -= quantity * report.exp;
  });

  return result;
}

function normalizeLevel(value, maxLevel) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 1;
  }

  return Math.min(maxLevel, Math.max(1, Math.trunc(numberValue)));
}
