export const TERRAIN_RANKS_BY_VALUE = ["D", "C", "B", "A", "S", "SS"];

const TERRAIN_KEY_BY_RAW_TYPE = {
  Street: "street",
  Outdoor: "outdoor",
  Indoor: "indoor",
};

const ATTACK_TYPE_STAR4_EFFECTS = {
  Explosion: {
    stat: "EnhanceExplosionRate",
    targetAttackType: "Explosion",
    label: "폭발 특효 가산 +10%",
  },
  Pierce: {
    stat: "EnhancePierceRate",
    targetAttackType: "Pierce",
    label: "관통 특효 가산 +10%",
  },
  Mystic: {
    stat: "EnhanceMysticRate",
    targetAttackType: "Mystic",
    label: "신비 특효 가산 +10%",
  },
  Sonic: {
    stat: "EnhanceSonicRate",
    targetAttackType: "Sonic",
    label: "진동 특효 가산 +10%",
  },
};

export function normalizeTerrainAptitude(rawValue) {
  const numericValue = Number(rawValue);

  if (!Number.isFinite(numericValue)) {
    return {
      rawValue: rawValue ?? null,
      rank: null,
      needsReview: true,
    };
  }

  const clampedValue = clampTerrainValue(numericValue);

  return {
    rawValue: numericValue,
    rank: TERRAIN_RANKS_BY_VALUE[clampedValue] ?? null,
    needsReview: clampedValue !== numericValue,
  };
}

export function normalizeTerrainBonus(rawWeapon) {
  const rawTerrain = rawWeapon?.AdaptationType ?? null;
  const terrain = TERRAIN_KEY_BY_RAW_TYPE[rawTerrain] ?? null;
  const value = Number(rawWeapon?.AdaptationValue);

  return {
    terrain,
    rawTerrain,
    value: Number.isFinite(value) ? value : null,
    needsReview: !terrain || !Number.isFinite(value),
  };
}

export function getEffectiveTerrain(student, weaponStar) {
  const terrain = normalizeTerrainSet(student?.terrain);
  const bonus = student?.exclusiveWeapon?.star3TerrainBonus;

  if (Number(weaponStar) < 3) {
    return terrain;
  }

  if (!bonus?.terrain || !Number.isFinite(Number(bonus.value))) {
    return markTerrainNeedsReview(terrain);
  }

  const current = terrain[bonus.terrain];

  if (!current) {
    return markTerrainNeedsReview(terrain);
  }

  return {
    ...terrain,
    [bonus.terrain]: {
      ...normalizeTerrainAptitude(getTerrainRawValue(current) + Number(bonus.value)),
      baseRawValue: getTerrainRawValue(current),
      boosted: true,
      bonusValue: Number(bonus.value),
    },
  };
}

export function getExclusiveWeaponStar4Effect(student, weaponStar) {
  if (Number(weaponStar) < 4) {
    return null;
  }

  const normalizedEffect = normalizeStar4Effect(student);

  if (normalizedEffect) {
    return normalizedEffect;
  }

  return {
    source: "derived",
    type: "unknown",
    stat: null,
    value: null,
    targetAttackType: null,
    label: "전용무기 4성 효과 확인 필요",
    needsReview: true,
  };
}

export function createExclusiveWeaponStar4Effect(student) {
  if (student?.squadType === "Support") {
    return {
      source: "derived",
      type: "maxCost",
      stat: "MaxCost",
      value: 0.5,
      targetAttackType: null,
      label: "코스트 상한 +0.5",
      needsReview: false,
    };
  }

  if (student?.squadType === "Main") {
    const effect = ATTACK_TYPE_STAR4_EFFECTS[student?.attackType];

    if (effect) {
      return {
        source: "derived",
        type: "specialEffect",
        stat: effect.stat,
        value: 10,
        targetAttackType: effect.targetAttackType,
        label: effect.label,
        needsReview: false,
      };
    }
  }

  return {
    source: "derived",
    type: "unknown",
    stat: null,
    value: null,
    targetAttackType: student?.attackType ?? null,
    label: "전용무기 4성 효과 확인 필요",
    needsReview: true,
  };
}

function normalizeStar4Effect(student) {
  const effect = student?.exclusiveWeapon?.star4Effect;

  if (effect && typeof effect === "object") {
    return {
      source: effect.source ?? "derived",
      type: effect.type ?? "unknown",
      stat: effect.stat ?? null,
      value: effect.value ?? null,
      targetAttackType: effect.targetAttackType ?? null,
      label: effect.label ?? formatStar4EffectLabel(effect),
      needsReview: Boolean(effect.needsReview),
    };
  }

  return createExclusiveWeaponStar4Effect(student);
}

function normalizeTerrainSet(terrain) {
  return {
    street: normalizeTerrainEntry(terrain?.street),
    outdoor: normalizeTerrainEntry(terrain?.outdoor),
    indoor: normalizeTerrainEntry(terrain?.indoor),
  };
}

function normalizeTerrainEntry(entry) {
  if (entry && typeof entry === "object") {
    return {
      rawValue: getTerrainRawValue(entry),
      rank: entry.rank ?? getTerrainRankFromValue(getTerrainRawValue(entry)),
      needsReview: Boolean(entry.needsReview),
    };
  }

  if (typeof entry === "string") {
    const rawValue = TERRAIN_RANKS_BY_VALUE.indexOf(entry);

    return {
      rawValue: rawValue >= 0 ? rawValue : null,
      rank: entry,
      needsReview: rawValue < 0,
    };
  }

  return normalizeTerrainAptitude(entry);
}

function markTerrainNeedsReview(terrain) {
  return {
    ...terrain,
    needsReview: true,
  };
}

function getTerrainRawValue(entry) {
  const rawValue = Number(entry?.rawValue);

  if (Number.isFinite(rawValue)) {
    return rawValue;
  }

  const rankValue = TERRAIN_RANKS_BY_VALUE.indexOf(entry?.rank);
  return rankValue >= 0 ? rankValue : 0;
}

function getTerrainRankFromValue(value) {
  return TERRAIN_RANKS_BY_VALUE[clampTerrainValue(value)] ?? null;
}

function clampTerrainValue(value) {
  return Math.min(Math.max(Number(value), 0), TERRAIN_RANKS_BY_VALUE.length - 1);
}

function formatStar4EffectLabel(effect) {
  if (effect?.type === "maxCost" && effect?.value !== null && effect?.value !== undefined) {
    return `코스트 상한 +${effect.value}`;
  }

  if (effect?.type === "specialEffect" && effect?.value !== null && effect?.value !== undefined) {
    return `특효 가산 +${effect.value}%`;
  }

  return "전용무기 4성 효과 확인 필요";
}
