import {
  getPreferredLanguage,
  setPreferredLanguage,
  syncLanguageButtons,
} from "../utils/languagePreference.js";

const languageButtons = [...document.querySelectorAll("[data-language-button]")];

syncLanguageButtons(getPreferredLanguage(), languageButtons);

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    syncLanguageButtons(setPreferredLanguage(button.dataset.languageButton), languageButtons);
  });
});
