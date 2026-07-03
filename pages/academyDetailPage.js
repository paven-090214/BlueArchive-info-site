import { academies } from "../data/academies.js";
import { applyStudentIconImage } from "../utils/studentImageResolver.js";

const DEFAULT_ACADEMY_SLUG = "gehenna";
const UNKNOWN_ACADEMY_MESSAGE = "학원을 찾을 수 없습니다.";
const EMPTY_STUDENT_MESSAGE = "등록된 학생 정보가 없습니다.";

const academyName = document.querySelector("#academy-name");
const academyDescription = document.querySelector("#academy-description");
const academyHeroMark = document.querySelector("#academy-hero-mark");
const academyMap = document.querySelector("#academy-map");
const clubList = document.querySelector("#club-list");

function fetchJson(path) {
  return fetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`${path} 로드 실패: ${response.status}`);
    }

    return response.json();
  });
}

function getCurrentAcademySlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("academy")?.trim() || DEFAULT_ACADEMY_SLUG;
}

function getAcademyBySlug(slug) {
  return academies.find((academy) => academy.slug === slug) ?? null;
}

function setDocumentTitle(title) {
  document.title = `${title} | BlueArchive Info Site`;
}

function renderAcademy(academy) {
  academyName.textContent = academy.name;
  academyDescription.textContent = academy.description;
  setDocumentTitle(academy.name);
  renderAcademyLogo(academy);
  renderAcademyMap(academy);
}

function renderAcademyLogo(academy) {
  academyHeroMark.replaceChildren();
  academyHeroMark.setAttribute("aria-hidden", "true");

  if (academy.logoImageUrl) {
    academyHeroMark.className = "academy-hero-logo";

    const image = document.createElement("img");
    image.className = "academy-hero-logo-image";
    image.src = academy.logoImageUrl;
    image.alt = "";
    image.loading = "lazy";
    image.onerror = () => {
      renderAcademyLogoPlaceholder(academy);
    };

    academyHeroMark.append(image);
    return;
  }

  renderAcademyLogoPlaceholder(academy);
}

function renderAcademyLogoPlaceholder(academy) {
  academyHeroMark.className = `academy-hero-placeholder ${academy.logoClass ?? ""}`.trim();
  academyHeroMark.textContent = academy.mark ?? "?";
}

function renderAcademyMap(academy) {
  if (!academyMap) {
    return;
  }

  academyMap.replaceChildren();

  if (!academy.mapImageUrl) {
    renderMapPlaceholder("지도 이미지 준비 중");
    return;
  }

  const image = document.createElement("img");
  image.className = "academy-map-image";
  image.src = academy.mapImageUrl;
  image.alt = `${academy.name} 지도`;
  image.loading = "lazy";
  image.onerror = () => {
    renderMapPlaceholder("지도 이미지 준비 중");
  };

  academyMap.append(image);
}

function renderMapPlaceholder(message) {
  academyMap.replaceChildren();

  const placeholder = document.createElement("div");
  placeholder.className = "academy-map-placeholder";

  const text = document.createElement("span");
  text.textContent = message;

  placeholder.append(text);
  academyMap.append(placeholder);
}

async function renderAcademyStudents(academy) {
  const students = await loadAcademyStudents(academy);
  const clubGroups = groupStudentsByClub(students);

  if (clubGroups.length === 0) {
    renderClubEmptyMessage(EMPTY_STUDENT_MESSAGE);
    return;
  }

  clubList.replaceChildren(...clubGroups.map(createClubCard));
}

async function loadAcademyStudents(academy) {
  const studentIndex = await fetchJson("./data/students/index.json");
  const students = await Promise.all(studentIndex.map(loadStudentDetail));

  return students.filter((student) => student && isStudentInAcademy(student, academy));
}

async function loadStudentDetail(studentSummary) {
  try {
    const detail = await fetchJson(`./data/students/detail/${studentSummary.slug}.json`);

    return {
      ...studentSummary,
      ...detail,
      characterId: detail.characterId ?? studentSummary.characterId,
      personId: detail.personId ?? studentSummary.personId,
      slug: detail.slug ?? studentSummary.slug,
    };
  } catch (error) {
    console.warn("학생 상세 정보를 불러오지 못했습니다.", studentSummary, error);
    return null;
  }
}

function isStudentInAcademy(student, academy) {
  const schoolName = normalizeLabel(getKoText(student.baseInfo?.school));
  const academyNames = [academy.name, academy.shortName].map(normalizeLabel).filter(Boolean);

  return academyNames.some((name) => schoolName === name || schoolName.includes(name));
}

function groupStudentsByClub(students) {
  const groups = [];
  const groupByName = new Map();

  students.forEach((student) => {
    const clubName = getKoText(student.baseInfo?.club) || "소속 동아리 확인 필요";

    if (!groupByName.has(clubName)) {
      const group = { name: clubName, students: [] };
      groupByName.set(clubName, group);
      groups.push(group);
    }

    groupByName.get(clubName).students.push(student);
  });

  return groups;
}

function createClubCard(group) {
  const card = document.createElement("details");
  card.className = "club-card";
  card.open = true;

  const summary = document.createElement("summary");
  const heading = document.createElement("div");

  const name = document.createElement("strong");
  name.textContent = group.name;

  const count = document.createElement("small");
  count.textContent = `${group.students.length}명`;

  heading.append(name, count);
  summary.append(heading);

  const characterList = document.createElement("div");
  characterList.className = "club-character-list";
  characterList.append(...group.students.map(createClubCharacterItem));

  card.append(summary, characterList);
  return card;
}

function createClubCharacterItem(student) {
  const link = document.createElement("a");
  link.className = "club-character-item";
  link.href = `./character-detail.html?slug=${encodeURIComponent(student.slug)}`;

  const image = document.createElement("img");
  image.className = "club-character-icon";
  image.alt = "";
  image.loading = "lazy";
  applyStudentIconImage(image, student);

  const name = document.createElement("span");
  name.textContent = getStudentDisplayName(student);

  link.append(image, name);
  return link;
}

function getStudentDisplayName(student) {
  return (
    student.name?.displayKo ??
    student.names?.displayKo ??
    student.name?.ko ??
    student.names?.ko ??
    student.slug ??
    "학생 이름 확인 필요"
  );
}

function getKoText(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  const koValue = value.ko;

  if (Array.isArray(koValue)) {
    return koValue.join(", ");
  }

  return koValue ?? "";
}

function normalizeLabel(value) {
  return String(value ?? "").replace(/\s+/g, "").trim();
}

function renderClubEmptyMessage(message) {
  const empty = document.createElement("p");
  empty.className = "academy-empty-message";
  empty.textContent = message;
  clubList.replaceChildren(empty);
}

function renderUnknownAcademy(slug) {
  academyName.textContent = UNKNOWN_ACADEMY_MESSAGE;
  academyDescription.textContent = `URL의 학원 식별자를 확인해주세요: ${slug}`;
  setDocumentTitle(UNKNOWN_ACADEMY_MESSAGE);

  academyHeroMark.className = "academy-hero-placeholder";
  academyHeroMark.textContent = "?";
  renderMapPlaceholder("지도 이미지 준비 중");
  renderClubEmptyMessage(EMPTY_STUDENT_MESSAGE);
}

async function initAcademyDetailPage() {
  const academySlug = getCurrentAcademySlug();
  const academy = getAcademyBySlug(academySlug);

  if (!academy) {
    renderUnknownAcademy(academySlug);
    return;
  }

  renderAcademy(academy);

  try {
    await renderAcademyStudents(academy);
  } catch (error) {
    console.error("학원 학생 정보를 불러오지 못했습니다.", error);
    renderClubEmptyMessage("학생 정보를 불러오지 못했습니다.");
  }
}

initAcademyDetailPage();
