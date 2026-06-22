import { getAllStudentGroupsByLocale } from "../data/schaledb/schaleDbStore.js";
import { getSchaleLabel } from "../data/schaledb/schaleDbLabels.js";
import {
  getPreferredLanguage,
  getSchaleLocale,
  setPreferredLanguage,
  syncLanguageButtons,
} from "../utils/languagePreference.js";

const charactersList = document.querySelector("#characters-list");
const filterForm = document.querySelector("#character-filter-form");
const academyFilter = document.querySelector("#academy-filter");
const clubFilter = document.querySelector("#club-filter");
const baseStarFilter = document.querySelector("#base-star-filter");
const attackFilter = document.querySelector("#attack-filter");
const defenseFilter = document.querySelector("#defense-filter");
const roleFilter = document.querySelector("#role-filter");
const positionFilter = document.querySelector("#position-filter");
const combatClassFilter = document.querySelector("#combat-class-filter");
const nameSearchInput = document.querySelector("#character-name-search");
const languageButtons = [...document.querySelectorAll("[data-language-button]")];
const STAR_ICON_URL = "./images/icon/Icon_star.webp";

let studentGroups = [];
let displayLanguage = getPreferredLanguage();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCharactersPage);
} else {
  initializeCharactersPage();
}

async function initializeCharactersPage() {
  renderLoading();

  try {
    await loadStudentsForCurrentLanguage();
    bindFilterEvents();
    renderCharacters();
  } catch (error) {
    console.error(error);
    renderMessage("학생 목록을 불러오지 못했습니다.");
  }
}

function bindFilterEvents() {
  academyFilter.addEventListener("change", () => {
    addClubOptions(academyFilter.value);
    renderCharacters();
  });
  languageButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      displayLanguage = setPreferredLanguage(button.dataset.languageButton);
      updateLanguageButtons();

      try {
        renderLoading();
        await loadStudentsForCurrentLanguage();
        renderCharacters();
      } catch (error) {
        console.error(error);
        renderMessage("학생 목록을 불러오지 못했습니다.");
      }
    });
  });
  updateLanguageButtons();
  nameSearchInput.addEventListener("input", renderCharacters);
  filterForm.addEventListener("change", renderCharacters);
}

async function loadStudentsForCurrentLanguage() {
  studentGroups = await getAllStudentGroupsByLocale(getSchaleLocale(displayLanguage));
  studentGroups = studentGroups.map(addGroupSearchText);
  setupFilters(getStudentsFromGroups(studentGroups));
}

function createCharacterCard(group) {
  const student = getRepresentativeStudent(group);
  const link = document.createElement("a");
  link.className = "student-list-card";
  link.href = getGroupDetailUrl(group);

  const portrait = document.createElement("div");
  portrait.className = "student-list-portrait";
  portrait.textContent = group.name ?? student?.name ?? "학생";

  const content = document.createElement("div");
  content.className = "student-list-card-content";

  const titleRow = document.createElement("div");
  titleRow.className = "student-list-title-row";

  const name = document.createElement("h3");
  const baseStar = Number(student.star ?? 0);
  name.textContent = group.name ?? student.name ?? "이름 확인 필요";
  titleRow.append(name, renderStarIcons(baseStar, `기본 성급 ${baseStar}성`));

  if (group.forms.length > 1) {
    titleRow.append(createFormCountBadge(group.forms.length));
  }

  const club = document.createElement("p");
  club.className = "student-list-club";
  club.textContent = `${getDisplayLabel("school", student.school)} · ${getDisplayLabel("club", student.club)}`;

  const detailList = document.createElement("dl");
  detailList.className = "student-id-detail-list";
  detailList.append(
    createTextDetail("역할", getDisplayLabel("role", student.role)),
    createBadgeDetail("공격 타입", student.attackType ?? "확인 필요", "attack", "attackType"),
    createBadgeDetail("방어 타입", student.defenseType ?? "확인 필요", "defense", "defenseType"),
  );

  content.append(titleRow, club, detailList);
  link.append(portrait, content);
  return link;
}

function renderCharacters() {
  const filterValues = {
    nameKeyword: nameSearchInput.value.trim(),
    academy: academyFilter.value,
    club: clubFilter.value,
    baseStar: baseStarFilter.value,
    attackType: attackFilter.value,
    defenseType: defenseFilter.value,
    role: roleFilter.value,
    position: positionFilter.value,
    squadType: combatClassFilter.value,
  };

  const filteredGroups = studentGroups.filter((group) => {
    return (
      (!filterValues.nameKeyword || matchesGroupKeyword(group, filterValues.nameKeyword)) &&
      group.forms.some((form) => matchesStudentFilters(form.student, filterValues))
    );
  });

  if (filteredGroups.length === 0) {
    renderMessage("조건에 맞는 학생이 없습니다.");
    return;
  }

  charactersList.replaceChildren(...filteredGroups.map(createCharacterCard));
}

function matchesStudentFilters(student, filterValues) {
  return (
    (!filterValues.academy || student.school === filterValues.academy) &&
    (!filterValues.club || student.club === filterValues.club) &&
    (!filterValues.baseStar || String(student.star ?? "") === filterValues.baseStar) &&
    (!filterValues.attackType || student.attackType === filterValues.attackType) &&
    (!filterValues.defenseType || student.defenseType === filterValues.defenseType) &&
    (!filterValues.role || student.role === filterValues.role) &&
    (!filterValues.position || student.position === filterValues.position) &&
    (!filterValues.squadType || student.squadType === filterValues.squadType)
  );
}

function addOptions(select, values, labelType = null) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labelType ? getDisplayLabel(labelType, value) : value;
    select.append(option);
  });
}

function replaceOptions(select, values, labelType = null) {
  select.replaceChildren(new Option("전체", ""));
  addOptions(select, values, labelType);
}

function getUniqueValues(studentList, key) {
  return getSortedUniqueValues(studentList.map((student) => student[key]).filter(Boolean));
}

function getSortedUniqueValues(values) {
  return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right), "ko"));
}

function createStarIcon() {
  const image = document.createElement("img");
  image.className = "star-icon student-star-icon";
  image.src = STAR_ICON_URL;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  return image;
}

function renderStarIcons(count, ariaLabel) {
  const list = document.createElement("span");
  list.className = "star-icon-list student-star-icon-list";
  list.setAttribute("aria-label", ariaLabel);

  for (let index = 0; index < count; index += 1) {
    list.append(createStarIcon());
  }

  return list;
}

function createTextDetail(label, value) {
  const item = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  item.append(term, description);
  return item;
}

function createBadgeDetail(label, value, type, labelType) {
  const item = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  const badge = document.createElement("span");
  term.textContent = label;
  badge.className = `type-badge ${type}-${getTypeClass(value)}`;
  badge.textContent = getDisplayLabel(labelType, value);
  description.append(badge);
  item.append(term, description);
  return item;
}

function getTypeClass(value) {
  const typeMap = {
    Explosion: "red",
    LightArmor: "red",
    Pierce: "yellow",
    HeavyArmor: "yellow",
    Mystic: "blue",
    Unarmed: "blue",
    Sonic: "purple",
    ElasticArmor: "purple",
    폭발: "red",
    경장갑: "red",
    관통: "yellow",
    중장갑: "yellow",
    신비: "blue",
    특수장갑: "blue",
    진동: "purple",
    탄력장갑: "purple",
  };

  return typeMap[value] || "neutral";
}

function renderLoading() {
  renderMessage("학생 목록을 불러오는 중...");
}

function setupFilters(studentList) {
  const selectedValues = {
    academy: academyFilter.value,
    club: clubFilter.value,
    attackType: attackFilter.value,
    defenseType: defenseFilter.value,
    role: roleFilter.value,
    position: positionFilter.value,
    squadType: combatClassFilter.value,
  };

  replaceOptions(academyFilter, getUniqueValues(studentList, "school"), "school");
  restoreSelectValue(academyFilter, selectedValues.academy);
  addClubOptions();
  replaceOptions(attackFilter, getUniqueValues(studentList, "attackType"), "attackType");
  restoreSelectValue(attackFilter, selectedValues.attackType);
  replaceOptions(defenseFilter, getUniqueValues(studentList, "defenseType"), "defenseType");
  restoreSelectValue(defenseFilter, selectedValues.defenseType);
  replaceOptions(roleFilter, getUniqueValues(studentList, "role"), "role");
  restoreSelectValue(roleFilter, selectedValues.role);
  replaceOptions(positionFilter, getUniqueValues(studentList, "position"), "position");
  restoreSelectValue(positionFilter, selectedValues.position);
  replaceOptions(combatClassFilter, getUniqueValues(studentList, "squadType"), "squadType");
  restoreSelectValue(combatClassFilter, selectedValues.squadType);
  restoreSelectValue(clubFilter, selectedValues.club);
}

function addClubOptions(academy = "") {
  const currentValue = clubFilter.value;
  const clubs = getStudentsFromGroups(studentGroups)
    .filter((student) => !academy || student.school === academy)
    .map((student) => student.club)
    .filter(Boolean);

  replaceOptions(clubFilter, getSortedUniqueValues(clubs), "club");

  if ([...clubFilter.options].some((option) => option.value === currentValue)) {
    clubFilter.value = currentValue;
  }
}

function restoreSelectValue(select, value) {
  if ([...select.options].some((option) => option.value === value)) {
    select.value = value;
  }
}

function getDisplayLabel(type, value) {
  if (value === null || value === undefined || value === "") {
    return "확인 필요";
  }

  return getSchaleLabel(type, value, displayLanguage);
}

function updateLanguageButtons() {
  syncLanguageButtons(displayLanguage, languageButtons);
}

function addGroupSearchText(group) {
  const formSearchValues = group.forms.flatMap((form) => {
    const student = form.student;

    return [
      form.formName,
      student.name,
      student.devName,
      student.slug,
      ...(student.searchTags ?? []),
    ];
  });
  const searchValues = [
    group.name,
    group.groupId,
    ...formSearchValues,
  ];

  return {
    ...group,
    searchText: searchValues
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .join(" "),
  };
}

function matchesGroupKeyword(group, keyword) {
  return group.searchText.includes(keyword.toLowerCase());
}

function getStudentsFromGroups(groups) {
  return groups.flatMap((group) => group.forms.map((form) => form.student));
}

function getRepresentativeStudent(group) {
  return group.forms[0]?.student ?? {};
}

function getGroupDetailUrl(group) {
  const student = getRepresentativeStudent(group);

  if (group.forms.length > 1 || !String(group.groupId).startsWith("student-")) {
    return `character-detail.html?groupId=${encodeURIComponent(group.groupId)}`;
  }

  return `character-detail.html?id=${student.id}`;
}

function createFormCountBadge(count) {
  const badge = document.createElement("span");
  badge.className = "student-form-count-badge";
  badge.textContent = `폼 ${count}개`;
  return badge;
}

function renderMessage(message) {
  const paragraph = document.createElement("p");
  paragraph.className = "search-empty";
  paragraph.textContent = message;
  charactersList.replaceChildren(paragraph);
}
