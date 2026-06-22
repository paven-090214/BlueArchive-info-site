export const SITE_LANGUAGES = {
  KO: "ko",
  EN: "en",
  JP: "jp",
};

const STORAGE_KEY = "site_language";

export function normalizeSiteLanguage(language) {
  return Object.values(SITE_LANGUAGES).includes(language) ? language : SITE_LANGUAGES.KO;
}

export function getPreferredLanguage() {
  try {
    return normalizeSiteLanguage(localStorage.getItem(STORAGE_KEY));
  } catch {
    return SITE_LANGUAGES.KO;
  }
}

export function setPreferredLanguage(language) {
  const normalizedLanguage = normalizeSiteLanguage(language);

  try {
    localStorage.setItem(STORAGE_KEY, normalizedLanguage);
  } catch {
    // Ignore storage failures; the current page can still switch language.
  }

  return normalizedLanguage;
}

export function getSchaleLocale(language) {
  const localeMap = {
    [SITE_LANGUAGES.KO]: "kr",
    [SITE_LANGUAGES.EN]: "en",
    [SITE_LANGUAGES.JP]: "jp",
  };

  return localeMap[normalizeSiteLanguage(language)] ?? "kr";
}

export function syncLanguageButtons(language, buttons = document.querySelectorAll("[data-language-button]")) {
  const normalizedLanguage = normalizeSiteLanguage(language);
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.languageButton === normalizedLanguage);
  });
}
