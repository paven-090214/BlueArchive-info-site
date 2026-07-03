import {
  DEFAULT_STUDENT_CARD_IMAGE_FIT,
  FALLBACK_STUDENT_IMAGE,
  FALLBACK_STUDENT_WEAPON_IMAGE,
  STUDENT_IMAGE_FALLBACK_TYPES,
  STUDENT_CARD_IMAGE_FIT_OVERRIDES,
  STUDENT_IMAGE_OVERRIDES,
  STUDENT_IMAGE_TYPE_FOLDER_MAP,
} from "../data/studentImages.js";

export function getStudentImageUrl(student, type = "icon") {
  const id = getStudentImageId(student);

  if (id === null) {
    return FALLBACK_STUDENT_IMAGE;
  }

  const normalizedType = getPrimaryImageType(type);
  const override = STUDENT_IMAGE_OVERRIDES[id]?.[normalizedType];

  if (override) {
    return override;
  }

  const folder = STUDENT_IMAGE_TYPE_FOLDER_MAP[normalizedType] ?? STUDENT_IMAGE_TYPE_FOLDER_MAP.icon;
  return `./images/students/${folder}/${id}.webp`;
}

export function getStudentFullBodyCardImageUrl(student) {
  return getStudentImageUrl(student, "card");
}

export function getStudentDetailFullBodyImageUrl(student) {
  return getStudentImageUrl(student, "detail");
}

export function getStudentCollectionImageUrl(student) {
  return getStudentImageUrl(student, "collection");
}

export function getStudentIconImageUrl(student) {
  return getStudentImageUrl(student, "icon");
}

export function getStudentWeaponImageUrl(student) {
  const id = getStudentImageId(student);

  if (id === null) {
    return FALLBACK_STUDENT_WEAPON_IMAGE;
  }

  return `./images/students/weapons/${id}.webp`;
}

export function applyStudentImage(image, student, type = "icon") {
  if (!image) {
    return;
  }

  const urls = getStudentImageFallbackUrls(student, type);
  const debug = shouldDebugStudentImages();
  let index = 0;

  const setImageSource = () => {
    image.src = urls[index];
    image.dataset.studentImageType = getImageTypeFromUrl(urls[index]);
  };

  image.onload = () => {
    if (debug) {
      logStudentImageResolution(student, type, urls, index);
    }
  };

  image.onerror = () => {
    index += 1;

    if (index >= urls.length) {
      image.onerror = null;
      image.src = FALLBACK_STUDENT_IMAGE;
      image.dataset.studentImageType = "placeholder";
      if (debug) {
        logStudentImageResolution(student, type, urls, index);
      }
      return;
    }

    setImageSource();
  };
  setImageSource();
}

export function applyStudentFullBodyCardImage(image, student) {
  applyStudentImage(image, student, "fullBodyCard");
}

export function applyStudentDetailFullBodyImage(image, student) {
  applyStudentImage(image, student, "detailFullBody");
}

export function applyStudentCollectionImage(image, student) {
  applyStudentImage(image, student, "collection");
}

export function applyStudentIconImage(image, student) {
  applyStudentImage(image, student, "icon");
}

export function applyStudentWeaponImage(image, student) {
  if (!image) {
    return;
  }

  image.onerror = () => {
    image.onerror = null;
    image.src = FALLBACK_STUDENT_WEAPON_IMAGE;
    image.dataset.studentImageType = "weapon-placeholder";
  };
  image.src = getStudentWeaponImageUrl(student);
  image.dataset.studentImageType = "weapon";
}

export function applyStudentCardImageFit(image, student) {
  if (!image) {
    return;
  }

  const id = getStudentImageId(student);
  const fit = {
    ...DEFAULT_STUDENT_CARD_IMAGE_FIT,
    ...(STUDENT_CARD_IMAGE_FIT_OVERRIDES[id] ?? {}),
  };

  image.style.setProperty("--student-image-scale", fit.scale);
  image.style.setProperty("--student-image-x", fit.x);
  image.style.setProperty("--student-image-y", fit.y);
}

export function resolveStudentImage(student, type = "icon") {
  return getStudentImageUrl(student, type);
}

export function getStudentImageFallbackUrls(student, type = "icon") {
  const id = getStudentImageId(student);

  if (id === null) {
    return [FALLBACK_STUDENT_IMAGE];
  }

  const types = getFallbackTypes(type);
  const urls = types.map((imageType) => getStudentImageUrlById(id, imageType));

  return [...new Set([...urls, FALLBACK_STUDENT_IMAGE])];
}

export function getStudentImageFallbackTrace(student, type = "icon") {
  return getStudentImageFallbackUrls(student, type).map((url) => ({
    type: getImageTypeFromUrl(url),
    url,
  }));
}

export function applyStudentImageFallback(image) {
  if (!image) {
    return;
  }

  image.onerror = () => {
    image.onerror = null;
    image.src = FALLBACK_STUDENT_IMAGE;
  };
}

export function getStudentImageId(student = {}) {
  const id = Number(student?.Id ?? student?.id ?? student?.characterId ?? student?.raw?.Id);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
}

function getStudentImageUrlById(id, type) {
  const normalizedType = getPrimaryImageType(type);
  const override = STUDENT_IMAGE_OVERRIDES[id]?.[normalizedType];

  if (override) {
    return override;
  }

  const folder = STUDENT_IMAGE_TYPE_FOLDER_MAP[normalizedType] ?? STUDENT_IMAGE_TYPE_FOLDER_MAP.icon;
  return `./images/students/${folder}/${id}.webp`;
}

function getFallbackTypes(type) {
  const normalizedType = normalizeImageUsage(type);
  return STUDENT_IMAGE_FALLBACK_TYPES[normalizedType] ?? STUDENT_IMAGE_FALLBACK_TYPES.icon;
}

function getImageTypeFromUrl(url) {
  if (url === FALLBACK_STUDENT_IMAGE) {
    return "placeholder";
  }

  return Object.entries(STUDENT_IMAGE_TYPE_FOLDER_MAP)
    .find(([, folder]) => url.includes(`/students/${folder}/`))?.[0] ?? "unknown";
}

function shouldDebugStudentImages() {
  try {
    return (
      window?.BA_DEBUG_STUDENT_IMAGES === true ||
      window?.localStorage?.getItem("baDebugStudentImages") === "1" ||
      new URLSearchParams(window.location.search).has("debugStudentImages")
    );
  } catch (_) {
    return false;
  }
}

function logStudentImageResolution(student, requestedType, urls, selectedIndex) {
  const id = getStudentImageId(student);
  const label = student?.name ?? student?.Name ?? student?.devName ?? "unknown student";
  const safeSelectedIndex = Math.min(selectedIndex, urls.length - 1);
  const parts = urls.slice(0, safeSelectedIndex + 1).map((url, index) => {
    const imageType = getImageTypeFromUrl(url);
    return index < safeSelectedIndex ? `${imageType} 없음` : `${imageType} 사용`;
  });
  const selectedUrl = urls[safeSelectedIndex] ?? FALLBACK_STUDENT_IMAGE;

  console.info(
    `[student image] ${label} ${id ?? "no-id"} (${requestedType}) -> ${parts.join(" -> ")}: ${selectedUrl}`,
  );
}

function getPrimaryImageType(type) {
  const fallbackTypes = STUDENT_IMAGE_FALLBACK_TYPES[type];

  if (fallbackTypes?.[0]) {
    return fallbackTypes[0];
  }

  return STUDENT_IMAGE_TYPE_FOLDER_MAP[type] ? type : "icon";
}

function normalizeImageUsage(type) {
  return STUDENT_IMAGE_FALLBACK_TYPES[type]
    ? type
    : STUDENT_IMAGE_TYPE_FOLDER_MAP[type]
      ? type
      : "icon";
}
