import {
  STUDENT_IMAGE_FALLBACK,
  STUDENT_IMAGE_MAP,
} from "../data/studentImages.js";

const IMAGE_TYPE_FALLBACKS = {
  icon: ["icon", "portrait", "full"],
  portrait: ["portrait", "full", "icon"],
  full: ["full", "portrait", "icon"],
  collection: ["collection", "portrait", "full", "icon"],
  lobby: ["lobby", "collection", "portrait", "full", "icon"],
};

export function resolveStudentImage(student, type = "icon") {
  const normalizedType = normalizeImageType(type);
  const mappedImage = resolveMappedStudentImage(student, normalizedType);

  if (mappedImage) {
    return mappedImage;
  }

  return resolveStudentFieldImage(student, normalizedType) ?? STUDENT_IMAGE_FALLBACK;
}

export function applyStudentImageFallback(image) {
  if (!image) {
    return;
  }

  image.addEventListener("error", () => {
    if (image.src.endsWith(STUDENT_IMAGE_FALLBACK.replace("./", ""))) {
      return;
    }

    image.src = STUDENT_IMAGE_FALLBACK;
  }, { once: false });
}

function resolveMappedStudentImage(student, type) {
  const keys = getStudentImageKeys(student);
  const typeCandidates = IMAGE_TYPE_FALLBACKS[type] ?? IMAGE_TYPE_FALLBACKS.icon;

  for (const key of keys) {
    const mapped = STUDENT_IMAGE_MAP[key];

    if (!mapped) {
      continue;
    }

    for (const candidateType of typeCandidates) {
      if (mapped[candidateType]) {
        return mapped[candidateType];
      }
    }
  }

  return null;
}

function getStudentImageKeys(student = {}) {
  return [
    student.id,
    student.studentId,
    student.slug,
    student.raw?.Id,
    student.raw?.PathName,
    student.devName,
    student.raw?.DevName,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .flatMap((value) => {
      const text = String(value);
      return [text, text.toLowerCase()];
    });
}

function resolveStudentFieldImage(student = {}, type) {
  const raw = student.raw ?? {};
  const fieldCandidates = getFieldCandidates(type);

  for (const key of fieldCandidates) {
    const value = student[key] ?? raw[key] ?? raw[toPascalCase(key)];

    if (isUsableImagePath(value)) {
      return value;
    }
  }

  if (isUsableImagePath(raw.Icon)) {
    return raw.Icon;
  }

  return null;
}

function getFieldCandidates(type) {
  const common = [
    "imageUrl",
    "image",
    "profileImageUrl",
  ];

  if (type === "icon") {
    return [
      "iconImageUrl",
      "iconUrl",
      "icon",
      ...common,
    ];
  }

  if (type === "full") {
    return [
      "fullImageUrl",
      "fullUrl",
      "portraitImageUrl",
      "portraitUrl",
      ...common,
    ];
  }

  if (type === "collection" || type === "lobby") {
    return [
      "collectionImageUrl",
      "collectionUrl",
      "lobbyImageUrl",
      "lobbyUrl",
      "portraitImageUrl",
      "portraitUrl",
      ...common,
    ];
  }

  return [
    "portraitImageUrl",
    "portraitUrl",
    "portrait",
    ...common,
  ];
}

function normalizeImageType(type) {
  return IMAGE_TYPE_FALLBACKS[type] ? type : "icon";
}

function isUsableImagePath(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  return value.startsWith("./") ||
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://");
}

function toPascalCase(value) {
  return String(value).replace(/(^|_|\b)([a-z])/g, (match) => match.toUpperCase()).replace(/_/g, "");
}
