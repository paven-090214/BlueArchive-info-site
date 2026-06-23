import { academies } from "../data/academies.js";
import { clubs } from "../data/clubs.js";
import { getAllStudentsByLocale } from "../data/schaledb/schaleDbStore.js";
import { getSchaleLabel, SCHALE_SCHOOL_BY_ACADEMY_SLUG } from "../data/schaledb/schaleDbLabels.js";
import {
  getPreferredLanguage,
  getSchaleLocale,
  setPreferredLanguage,
  syncLanguageButtons,
} from "../utils/languagePreference.js";

const academyName = document.querySelector("#academy-name");
const academyDescription = document.querySelector("#academy-description");
const academyHeroMark = document.querySelector("#academy-hero-mark");
const academyMap = document.querySelector("#academy-map");
const clubList = document.querySelector("#club-list");
const languageButtons = [...document.querySelectorAll("[data-language-button]")];

const academyKey = new URLSearchParams(window.location.search).get("academy") || "gehenna";
const selectedAcademy =
  academies.find((academy) => academy.slug === academyKey) ||
  academies.find((academy) => academy.slug === "gehenna");
let students = [];
let displayLanguage = getPreferredLanguage();

academyName.textContent = selectedAcademy.name;
academyDescription.textContent = selectedAcademy.description;
renderAcademyHeroLogo(selectedAcademy);
renderAcademyMap(selectedAcademy);
renderClubListMessage("학생 데이터를 불러오는 중...");
bindLanguageButtons();
updateLanguageButtons();

try {
  await loadStudentsForCurrentLanguage();
  renderAcademyClubs();
} catch (error) {
  console.error(error);
  renderClubListMessage("학생 데이터를 불러오지 못했습니다.");
}

function bindLanguageButtons() {
  languageButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      displayLanguage = setPreferredLanguage(button.dataset.languageButton);
      updateLanguageButtons();
      renderClubListMessage("학생 데이터를 불러오는 중...");

      try {
        await loadStudentsForCurrentLanguage();
        renderAcademyClubs();
      } catch (error) {
        console.error(error);
        renderClubListMessage("학생 데이터를 불러오지 못했습니다.");
      }
    });
  });
}

async function loadStudentsForCurrentLanguage() {
  students = await getAllStudentsByLocale(getSchaleLocale(displayLanguage));
}

function updateLanguageButtons() {
  syncLanguageButtons(displayLanguage, languageButtons);
}

function renderAcademyHeroLogo(academy) {
  if (!academy.logoImageUrl) {
    academyHeroMark.className = `academy-hero-placeholder ${academy.logoClass}`;
    academyHeroMark.textContent = academy.mark;
    return;
  }

  const image = document.createElement("img");
  image.className = "academy-hero-logo-image";
  image.src = academy.logoImageUrl;
  image.alt = `${academy.name} 로고`;
  image.loading = "lazy";

  academyHeroMark.className = "academy-hero-logo";
  academyHeroMark.replaceChildren(image);
}

function renderAcademyMap(academy) {
  if (!academy.mapImageUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "academy-map-placeholder";

    const text = document.createElement("span");
    text.textContent = "지도 이미지 준비 중";

    placeholder.append(text);
    academyMap.replaceChildren(placeholder);
    return;
  }

  const image = document.createElement("img");
  image.className = "academy-map-image";
  image.src = academy.mapImageUrl;
  image.alt = `${academy.name} 지도`;
  image.loading = "lazy";

  const markerLayer = document.createElement("div");
  markerLayer.className = "academy-map-marker-layer";
  markerLayer.setAttribute("aria-hidden", "true");

  academyMap.replaceChildren(image, markerLayer);
}

function createClubCard(club) {
  const details = document.createElement("details");
  details.className = "club-card";

  const summary = document.createElement("summary");
  const summaryText = document.createElement("span");
  const name = document.createElement("strong");
  const description = document.createElement("small");
  name.textContent = getClubDisplayName(club);
  description.textContent = club.description ?? "SchaleDB 기준 동아리입니다.";
  summaryText.append(name, description);
  summary.append(summaryText);

  const characterList = document.createElement("div");
  characterList.className = "club-character-list";

  const clubStudents = getStudentsForClub(club);

  if (clubStudents.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "search-empty";
    emptyMessage.textContent = "표시할 학생 데이터가 없습니다.";
    characterList.append(emptyMessage);
  } else {
    characterList.append(...clubStudents.map(createClubStudentLink));
  }

  details.append(summary, characterList);
  return details;
}

function createClubStudentLink(student) {
  const link = document.createElement("a");
  link.href = `character-detail.html?id=${student.id}`;
  link.className = "club-character-item";

  const imageUrl = getStudentIconImageUrl(student);
  const visual = imageUrl ? document.createElement("img") : document.createElement("span");
  visual.className = "student-image-placeholder";

  if (imageUrl) {
    visual.src = imageUrl;
    visual.alt = `${student.name} 아이콘`;
    visual.loading = "lazy";
  } else {
    visual.setAttribute("aria-hidden", "true");
    visual.textContent = (student.name ?? "학").slice(0, 1);
  }

  const name = document.createElement("span");
  name.textContent = student.name;

  link.append(visual, name);
  return link;
}

function getStudentsForClub(club) {
  const school = SCHALE_SCHOOL_BY_ACADEMY_SLUG[club.academySlug];
  const clubCode = club.schaleClubCode;

  if (!clubCode) {
    return [];
  }

  return students.filter((student) => {
    return (
      (!school || student.school === school) &&
      (!clubCode || student.club === clubCode)
    );
  });
}

function getStudentIconImageUrl(student) {
  return student.raw?.IconImageUrl ?? student.raw?.iconImageUrl ?? student.iconImageUrl ?? null;
}

function renderAcademyClubs() {
  const academyClubs = getAcademyClubs();

  if (academyClubs.length === 0) {
    renderClubListMessage("표시할 동아리 임시 데이터가 없습니다.");
    return;
  }

  clubList.replaceChildren(...academyClubs.map(createClubCard));
}

function renderClubListMessage(message) {
  const emptyMessage = document.createElement("p");
  emptyMessage.className = "search-empty";
  emptyMessage.textContent = message;
  clubList.replaceChildren(emptyMessage);
}

function getAcademyClubs() {
  const school = SCHALE_SCHOOL_BY_ACADEMY_SLUG[selectedAcademy.slug];
  const schaleClubs = [...new Set(
    students
      .filter((student) => !school || student.school === school)
      .map((student) => student.club)
      .filter(Boolean),
  )].map((clubCode) => ({
    id: clubCode,
    schaleClubCode: clubCode,
    academySlug: selectedAcademy.slug,
    name: getSchaleLabel("club", clubCode, displayLanguage),
    description: "SchaleDB 기준 동아리입니다.",
  }));

  if (schaleClubs.length > 0) {
    return schaleClubs.sort((left, right) => left.name.localeCompare(right.name, "ko"));
  }

  return clubs
    .filter((club) => club.academySlug === selectedAcademy.slug)
    .map((club) => ({
      ...club,
      schaleClubCode: null,
    }));
}

function getClubDisplayName(club) {
  return club.schaleClubCode
    ? getSchaleLabel("club", club.schaleClubCode, displayLanguage)
    : club.name;
}
