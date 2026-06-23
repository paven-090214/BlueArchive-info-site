export const SCHALEDB_BASE_URL = "https://schaledb.com/data/jp";
export const SCHALEDB_FALLBACK_BASE_URL = "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/jp";
export const SCHALEDB_LOCALES = {
  ko: "kr",
  kr: "kr",
  en: "en",
  jp: "jp",
  ja: "jp",
};

function getLocalePath(locale = "jp") {
  return SCHALEDB_LOCALES[locale] ?? "jp";
}

function getLocaleBaseUrl(baseUrl, locale) {
  return baseUrl.replace(/\/(kr|en|jp)$/, `/${getLocalePath(locale)}`);
}

async function fetchJson(fileName, locale = "jp") {
  const errors = [];

  for (const baseUrl of [SCHALEDB_BASE_URL, SCHALEDB_FALLBACK_BASE_URL]) {
    try {
      const response = await fetch(`${getLocaleBaseUrl(baseUrl, locale)}/${fileName}.min.json`);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`.trim());
      }

      return response.json();
    } catch (error) {
      errors.push(`${baseUrl}: ${error.message}`);
    }
  }

  throw new Error(`${fileName} 데이터 로드 실패: ${errors.join(" / ")}`);
}

export function fetchStudents() {
  return fetchJson("students");
}

export function fetchStudentsByLocale(locale) {
  return fetchJson("students", locale);
}

export function fetchItems() {
  return fetchJson("items");
}

export function fetchItemsByLocale(locale) {
  return fetchJson("items", locale);
}

export function fetchEquipment() {
  return fetchJson("equipment");
}

export function fetchEquipmentByLocale(locale) {
  return fetchJson("equipment", locale);
}

export function fetchCurrency() {
  return fetchJson("currency");
}

export function fetchCurrencyByLocale(locale) {
  return fetchJson("currency", locale);
}
