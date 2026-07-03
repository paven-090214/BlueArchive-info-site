const TERRAIN_IMAGE_MAP = {
  street: "./images/terrains/urban.webp",
  urban: "./images/terrains/urban.webp",
  outdoor: "./images/terrains/outdoor.webp",
  indoor: "./images/terrains/indoor.webp",
};

const TERRAIN_RANK_IMAGE_MAP = {
  SS: "./images/terrain-ranks/rank-ss.webp",
  S: "./images/terrain-ranks/rank-s.webp",
  A: "./images/terrain-ranks/rank-a.webp",
  B: "./images/terrain-ranks/rank-b.webp",
  C: "./images/terrain-ranks/rank-c.webp",
  D: "./images/terrain-ranks/rank-d.webp",
};

const ROLE_IMAGE_MAP = {
  DamageDealer: "./images/role/attacker.webp",
  Dealer: "./images/role/attacker.webp",
  DPS: "./images/role/attacker.webp",
  Attacker: "./images/role/attacker.webp",
  dealer: "./images/role/attacker.webp",
  "딜러": "./images/role/attacker.webp",
  Tanker: "./images/role/tank.webp",
  Tank: "./images/role/tank.webp",
  tank: "./images/role/tank.webp",
  "탱커": "./images/role/tank.webp",
  Healer: "./images/role/healer.webp",
  healer: "./images/role/healer.webp",
  "힐러": "./images/role/healer.webp",
  Supporter: "./images/role/support.webp",
  Support: "./images/role/support.webp",
  supporter: "./images/role/support.webp",
  "서포터": "./images/role/support.webp",
  TacticalSupport: "./images/role/tactical-support.webp",
};

const LOCAL_SKILL_ICON_BY_CHARACTER_ID = {
  10000: {
    ex: "COMMON_SKILLICON_CIRCLE",
    normal: "COMMON_SKILLICON_TARGET",
    gearnormal: "COMMON_SKILLICON_TARGET",
    passive: "COMMON_SKILLICON_WEAPONBUFF",
    weaponpassive: "COMMON_SKILLICON_WEAPONBUFF",
    sub: "COMMON_SKILLICON_WEAPONBUFF",
  },
  13010: {
    ex: "COMMON_SKILLICON_SHIELD",
    normal: "COMMON_SKILLICON_TARGET",
    gearnormal: "COMMON_SKILLICON_TARGET",
    passive: "COMMON_SKILLICON_STATBUFF",
    weaponpassive: "COMMON_SKILLICON_STATBUFF",
    sub: "COMMON_SKILLICON_HEAL",
  },
};

const SKILL_SHAPE_ICON_MAP = {
  circle: "COMMON_SKILLICON_CIRCLE",
  target: "COMMON_SKILLICON_TARGET",
  shield: "COMMON_SKILLICON_SHIELD",
  heal: "COMMON_SKILLICON_HEAL",
};

export function getSkillIconPath(skill, context = {}) {
  const icon = getSkillIconName(skill, context);
  return icon ? `./images/skills/${icon}.webp` : null;
}

export function getGearIconPath(student) {
  const id = student?.characterId ?? student?.Id ?? student?.id;
  return id ? `./images/gears/icon/${id}.webp` : null;
}

export function getTerrainImagePath(terrainKey) {
  return TERRAIN_IMAGE_MAP[terrainKey] ?? null;
}

export function getTerrainRankImagePath(rank) {
  return TERRAIN_RANK_IMAGE_MAP[String(rank ?? "").toUpperCase()] ?? null;
}

export function getRoleImagePath(role) {
  return ROLE_IMAGE_MAP[role] ?? ROLE_IMAGE_MAP[String(role ?? "")] ?? null;
}

export function getExclusiveWeaponImagePath(student) {
  const id = student?.characterId ?? student?.Id ?? student?.id;
  return id ? `./images/students/weapons/${id}.webp` : null;
}

function getSkillIconName(skill, context) {
  const icon = skill?.Icon ?? skill?.icon;

  if (icon) {
    return icon;
  }

  const characterIcons = LOCAL_SKILL_ICON_BY_CHARACTER_ID[context.characterId];
  const slotIcon = characterIcons?.[skill?.slot] ?? characterIcons?.[context.slot];

  if (slotIcon) {
    return slotIcon;
  }

  return SKILL_SHAPE_ICON_MAP[skill?.shape] ?? null;
}
