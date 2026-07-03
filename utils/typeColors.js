const ATTACK_TYPE_COLORS = {
  explosion: {
    key: "explosion",
    bg: "#d84040",
    strong: "#d84040",
    text: "#ffffff",
  },
  penetration: {
    key: "penetration",
    bg: "#c98322",
    strong: "#c98322",
    text: "#ffffff",
  },
  mystic: {
    key: "mystic",
    bg: "#2f86c7",
    strong: "#2f86c7",
    text: "#ffffff",
  },
  sonic: {
    key: "sonic",
    bg: "#9c4dcc",
    strong: "#9c4dcc",
    text: "#ffffff",
  },
};

const ARMOR_TYPE_COLORS = {
  light: {
    key: "light",
    bg: "#d84040",
    strong: "#d84040",
    text: "#ffffff",
  },
  heavy: {
    key: "heavy",
    bg: "#c98322",
    strong: "#c98322",
    text: "#ffffff",
  },
  special: {
    key: "special",
    bg: "#247fc7",
    strong: "#247fc7",
    text: "#ffffff",
  },
  elastic: {
    key: "elastic",
    bg: "#9c4dcc",
    strong: "#9c4dcc",
    text: "#ffffff",
  },
};

const ATTACK_TYPE_ALIASES = {
  explosion: "explosion",
  explosive: "explosion",
  폭발: "explosion",
  penetration: "penetration",
  pierce: "penetration",
  piercing: "penetration",
  관통: "penetration",
  mystic: "mystic",
  신비: "mystic",
  sonic: "sonic",
  vibration: "sonic",
  진동: "sonic",
};

const ARMOR_TYPE_ALIASES = {
  light: "light",
  lightarmor: "light",
  경장갑: "light",
  heavy: "heavy",
  heavyarmor: "heavy",
  중장갑: "heavy",
  special: "special",
  specialarmor: "special",
  unarmed: "special",
  normal: "special",
  복합장갑: "special",
  특수장갑: "special",
  elastic: "elastic",
  elasticarmor: "elastic",
  탄력장갑: "elastic",
};

export function getAttackTypeColorMeta(type) {
  return ATTACK_TYPE_COLORS[normalizeType(type, ATTACK_TYPE_ALIASES)] ?? null;
}

export function getArmorTypeColorMeta(type) {
  return ARMOR_TYPE_COLORS[normalizeType(type, ARMOR_TYPE_ALIASES)] ?? null;
}

export function getSkillIconTypeClass(student) {
  const meta = getAttackTypeColorMeta(student?.attackTypeKey ?? student?.attackType);
  return meta ? `skill-icon--${meta.key}` : "skill-icon--neutral";
}

export function getAttackTypePillClass(type) {
  const meta = getAttackTypeColorMeta(type);
  return meta ? `type-pill--${meta.key}` : "type-pill--neutral";
}

export function getArmorTypePillClass(type) {
  const meta = getArmorTypeColorMeta(type);
  return meta ? `type-pill--${meta.key}` : "type-pill--neutral";
}

export function getLegacyTypeBadgeColorClass(type) {
  const meta = getAttackTypeColorMeta(type) ?? getArmorTypeColorMeta(type);

  if (!meta) {
    return "neutral";
  }

  const colorClassByType = {
    explosion: "red",
    light: "red",
    penetration: "yellow",
    heavy: "yellow",
    mystic: "blue",
    special: "blue",
    sonic: "purple",
    elastic: "purple",
  };

  return colorClassByType[meta.key] ?? "neutral";
}

export function applyTypeColorVars(element, meta) {
  if (!element || !meta) {
    return;
  }

  element.style.setProperty("--type-bg", meta.bg);
  element.style.setProperty("--type-strong", meta.strong);
  element.style.setProperty("--type-text", meta.text);
}

function normalizeType(type, aliases) {
  return aliases[String(type ?? "").replace(/\s+/g, "").toLowerCase()] ?? null;
}
