export const FALLBACK_STUDENT_IMAGE = "./images/students/placeholder.webp";
export const FALLBACK_STUDENT_WEAPON_IMAGE = "./images/students/placeholder.webp";

export const STUDENT_IMAGE_TYPE_FOLDER_MAP = {
  card: "cards",
  detail: "detail",
  icon: "icons",
  portrait: "portraits",
  full: "portraits",
  collection: "collection",
  lobby: "lobby",
};

export const STUDENT_IMAGE_FALLBACK_TYPES = {
  fullBodyCard: ["card", "portrait"],
  detailFullBody: ["detail", "portrait"],
  card: ["card", "portrait"],
  detail: ["detail", "portrait"],
  icon: ["icon"],
  portrait: ["portrait"],
  full: ["portrait"],
  collection: ["collection"],
  lobby: ["lobby"],
};

export const STUDENT_IMAGE_OVERRIDES = {
  // Add only confirmed API Id-based exceptions here.
};

export const DEFAULT_STUDENT_CARD_IMAGE_FIT = {
  scale: 1,
  x: "center",
  y: "20%",
};

export const STUDENT_CARD_IMAGE_FIT_OVERRIDES = {
  // Add only API Id-based visual fit overrides here.
};
