import { activityReports } from "../data/growth/activityReports.js";
import { characterExpTable } from "../data/growth/characterExpTable.js";

const CREDIT_PER_EXP = 7;

export const REPORT_USAGE_MODES = {
  HIGH_GRADE_FIRST: "high_grade_first",
  LOW_GRADE_FIRST: "low_grade_first",
  INVENTORY_BASED: "inventory_based",
  MANUAL: "manual",
};

export function calculateCharacterLevelMaterials({
  currentLevel,
  targetLevel,
  expTable = characterExpTable,
  reports = activityReports,
  reportUsageMode = REPORT_USAGE_MODES.HIGH_GRADE_FIRST,
  manualReportQuantities = {},
  inventory = {},
}) {
  const hasExpTable = expTable.length > 0;
  const maxLevel = hasExpTable ? Math.max(...expTable.map((row) => row.level)) : 1;
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
      missingLevels: [],
      needsReview: !hasExpTable,
      hasCompleteData: hasExpTable,
    };
  }

  const missingLevels = getMissingExpLevels({
    currentLevel: normalizedCurrentLevel,
    targetLevel: normalizedTargetLevel,
    expTable,
  });
  const requiredExp = getRequiredExp({
    currentLevel: normalizedCurrentLevel,
    targetLevel: normalizedTargetLevel,
    expTable,
  });
  const creditQuantity = requiredExp * CREDIT_PER_EXP;
  const reportRequirements = calculateActivityReports({
    requiredExp,
    reports,
    reportUsageMode,
    manualReportQuantities,
    inventory,
  });
  const hasReportData = reports.length > 0 || requiredExp === 0;
  const selectedReportExp = reportRequirements.reduce(
    (sum, report) => sum + (Number(report.exp) || 0) * (Number(report.quantity) || 0),
    0,
  );
  const missingReportExp = Math.max(0, requiredExp - selectedReportExp);
  const overReportExp = Math.max(0, selectedReportExp - requiredExp);
  const needsReview = !hasExpTable
    || missingLevels.length > 0
    || !hasReportData
    || (reportUsageMode === REPORT_USAGE_MODES.MANUAL && missingReportExp > 0);

  return {
    currentLevel: normalizedCurrentLevel,
    targetLevel: normalizedTargetLevel,
    requiredExp,
    creditQuantity,
    reports: reportRequirements,
    reportUsageMode,
    selectedReportExp,
    missingReportExp,
    overReportExp,
    missingLevels,
    needsReview,
    hasCompleteData: !needsReview,
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

function getMissingExpLevels({ currentLevel, targetLevel, expTable }) {
  const levelSet = new Set(expTable.map((row) => row.level));
  const missingLevels = [];

  for (let level = currentLevel; level <= targetLevel; level += 1) {
    if (!levelSet.has(level)) {
      missingLevels.push(level);
    }
  }

  return missingLevels;
}

function calculateActivityReports({
  requiredExp,
  reports,
  reportUsageMode = REPORT_USAGE_MODES.HIGH_GRADE_FIRST,
  manualReportQuantities = {},
  inventory = {},
}) {
  if (reportUsageMode === REPORT_USAGE_MODES.MANUAL) {
    return calculateManualActivityReports({ reports, manualReportQuantities });
  }

  if (reportUsageMode === REPORT_USAGE_MODES.LOW_GRADE_FIRST) {
    return calculateLowGradeFirstActivityReports({ requiredExp, reports });
  }

  if (reportUsageMode === REPORT_USAGE_MODES.INVENTORY_BASED) {
    return calculateInventoryBasedActivityReports({ requiredExp, reports, inventory });
  }

  return calculateGreedyActivityReports({
    requiredExp,
    reports,
    sortReports: (left, right) => right.exp - left.exp,
  });
}

function calculateGreedyActivityReports({ requiredExp, reports, sortReports }) {
  let remainingExp = requiredExp;
  const sortedReports = [...reports].sort(sortReports);
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

function calculateLowGradeFirstActivityReports({ requiredExp, reports }) {
  if (requiredExp <= 0) {
    return [];
  }

  const lowestReport = [...reports].sort((left, right) => left.exp - right.exp)[0];

  if (!lowestReport) {
    return [];
  }

  return [{
    itemId: lowestReport.id,
    itemName: lowestReport.name,
    tier: lowestReport.tier,
    exp: lowestReport.exp,
    quantity: Math.ceil(requiredExp / lowestReport.exp),
  }];
}

function calculateInventoryBasedActivityReports({ requiredExp, reports, inventory }) {
  let remainingExp = requiredExp;
  const resultMap = new Map();
  const highGradeReports = [...reports].sort((left, right) => right.exp - left.exp);

  highGradeReports.forEach((report) => {
    if (remainingExp <= 0) {
      return;
    }

    const ownedQuantity = getInventoryQuantity(inventory, report.id);
    const quantity = Math.min(ownedQuantity, Math.ceil(remainingExp / report.exp));

    if (quantity <= 0) {
      return;
    }

    addReportQuantity(resultMap, report, quantity);
    remainingExp -= quantity * report.exp;
  });

  if (remainingExp > 0) {
    calculateGreedyActivityReports({
      requiredExp: remainingExp,
      reports,
      sortReports: (left, right) => right.exp - left.exp,
    }).forEach((report) => addReportQuantity(resultMap, report, report.quantity));
  }

  return [...resultMap.values()];
}

function calculateManualActivityReports({ reports, manualReportQuantities }) {
  return reports
    .map((report) => ({
      itemId: report.id,
      itemName: report.name,
      tier: report.tier,
      exp: report.exp,
      quantity: normalizeQuantity(manualReportQuantities[report.id]),
    }))
    .filter((report) => report.quantity > 0);
}

function addReportQuantity(resultMap, report, quantity) {
  const existing = resultMap.get(report.id);

  if (existing) {
    existing.quantity += quantity;
    return;
  }

  resultMap.set(report.id, {
    itemId: report.id,
    itemName: report.name,
    tier: report.tier,
    exp: report.exp,
    quantity,
  });
}

function getInventoryQuantity(inventory, itemId) {
  if (inventory instanceof Map) {
    return normalizeQuantity(inventory.get(String(itemId)) ?? inventory.get(itemId));
  }

  if (Array.isArray(inventory)) {
    const record = inventory.find((item) => String(item?.itemId) === String(itemId));
    return normalizeQuantity(record?.quantity);
  }

  if (inventory && typeof inventory === "object") {
    return normalizeQuantity(inventory[itemId]);
  }

  return 0;
}

function normalizeQuantity(value) {
  return Math.max(0, Math.trunc(Number(value) || 0));
}

function normalizeLevel(value, maxLevel) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 1;
  }

  return Math.min(maxLevel, Math.max(1, Math.trunc(numberValue)));
}
