const STAT_KEYS = [
  "attack",
  "defense",
  "hp",
  "healing",
  "accuracy",
  "evasion",
  "criticalRate",
  "criticalDamage",
  "stability",
  "range",
  "ccPower",
  "ccResist",
];

const STAR_BONUSES = {
  attack: [0, 1000, 1200, 1400, 1700],
  hp: [0, 500, 700, 900, 1400],
  healing: [0, 750, 1000, 1200, 1500],
};

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(Math.max(number, min), max);
}

function readLevelRange(statRange) {
  if (!statRange || typeof statRange !== "object") {
    return null;
  }

  const level1 = Number(statRange.level1 ?? statRange.min);
  const level100 = Number(statRange.level100 ?? statRange.max);

  if (!Number.isFinite(level1) || !Number.isFinite(level100)) {
    return null;
  }

  return { level1, level100 };
}

function interpolateLevelStat(statRange, level) {
  const range = readLevelRange(statRange);

  if (!range) {
    return 0;
  }

  const safeLevel = clampNumber(level, 1, 100);
  const scale = Number(((safeLevel - 1) / 99).toFixed(4));

  return Math.round(range.level1 + (range.level100 - range.level1) * scale);
}

function getStarMultiplier(statKey, star) {
  const bonuses = STAR_BONUSES[statKey];

  if (!bonuses) {
    return 1;
  }

  const safeStar = clampNumber(star, 1, bonuses.length);
  const bonusTotal = bonuses.slice(0, safeStar).reduce((sum, value) => sum + value, 0);

  return 1 + bonusTotal / 10000;
}

function addStats(target, source) {
  if (!source || typeof source !== "object") {
    return;
  }

  STAT_KEYS.forEach((statKey) => {
    const value = Number(source[statKey]);

    if (Number.isFinite(value)) {
      target[statKey] += value;
    }
  });
}

function addUniqueItemStats(target, uniqueItemStats, tier) {
  const safeTier = clampNumber(tier, 0, 4);

  for (let currentTier = 1; currentTier <= safeTier; currentTier += 1) {
    addStats(target, uniqueItemStats?.[`tier${currentTier}`] ?? uniqueItemStats?.[`T${currentTier}`]);
  }
}

function addUniqueWeaponStats(target, uniqueWeaponStats, uniqueWeapon) {
  const star = clampNumber(uniqueWeapon?.star, 0, 5);

  if (star <= 0) {
    return;
  }

  const level = clampNumber(uniqueWeapon?.level, 1, 100);
  const statRanges = uniqueWeaponStats?.stats;

  if (!statRanges || typeof statRanges !== "object") {
    return;
  }

  STAT_KEYS.forEach((statKey) => {
    const value = interpolateLevelStat(statRanges[statKey], level);

    if (value) {
      target[statKey] += value;
    }
  });
}

export function calculateStudentStats(statData, options = {}) {
  const level = clampNumber(options.level, 1, 100);
  const star = clampNumber(options.star ?? statData?.baseStar, 1, 5);

  const result = Object.fromEntries(STAT_KEYS.map((statKey) => [statKey, 0]));

  ["attack", "defense", "hp", "healing"].forEach((statKey) => {
    const raw = interpolateLevelStat(statData?.baseStats?.[statKey], level);
    result[statKey] = Math.ceil(raw * getStarMultiplier(statKey, star));
  });

  addStats(result, statData?.fixedStats);
  addUniqueItemStats(result, statData?.uniqueItemStats, options.uniqueItem?.tier);
  addUniqueWeaponStats(result, statData?.uniqueWeaponStats, options.uniqueWeapon);

  return Object.fromEntries(STAT_KEYS.map((statKey) => [statKey, result[statKey]]));
}

export { STAT_KEYS };
