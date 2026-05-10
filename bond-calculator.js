import { bondCalculatorStudents } from "./data/bond-calculator-students.js";
import { bondRankRequirements } from "./data/bond-rank-requirements.js";
import { gifts } from "./data/gifts.js";
import { characterGiftPreferences } from "./data/character-gift-preferences.js";

const siteSearchForm = document.querySelector("#site-search-form");
const siteSearchInput = document.querySelector("#site-search-input");

const studentSearchInput = document.querySelector("#bond-student-search-input");
const studentSuggestions = document.querySelector("#bond-student-suggestions");
const selectedStudentVisual = document.querySelector("#bond-selected-student-visual");
const selectedStudentValue = document.querySelector("#bond-selected-student");
const selectedStudentNote = document.querySelector("#bond-selected-student-note");

const currentRankInput = document.querySelector("#bond-current-rank");
const targetRankInput = document.querySelector("#bond-target-rank");
const currentPointsInput = document.querySelector("#bond-current-points");
const currentRankSummary = document.querySelector("#bond-current-rank-summary");
const targetRankSummary = document.querySelector("#bond-target-rank-summary");

const giftList = document.querySelector("#bond-gift-list");
const giftToggleButton = document.querySelector("#bond-gift-toggle");

const nextRankPointsValue = document.querySelector("#bond-next-rank-points");
const targetTotalPointsValue = document.querySelector("#bond-target-total-points");
const giftTotalPointsValue = document.querySelector("#bond-gift-total-points");
const remainingPointsValue = document.querySelector("#bond-remaining-points");
const cafeCountValue = document.querySelector("#bond-cafe-count");
const scheduleCountValue = document.querySelector("#bond-schedule-count");
const excessPointsValue = document.querySelector("#bond-excess-points");
const resultNote = document.querySelector("#bond-result-note");

const cafePointsValue = document.querySelector("#bond-cafe-points");
const schedulePointsValue = document.querySelector("#bond-schedule-points");

const studentsById = new Map(bondCalculatorStudents.map((student) => [student.id, student]));
const rankRequirementMap = new Map(bondRankRequirements.map((item) => [item.rank, item]));
const preferenceMap = new Map();
const quantityByGiftId = new Map();

let selectedStudentId = bondCalculatorStudents[0]?.id ?? null;
let showAllGifts = false;

for (const record of characterGiftPreferences) {
  if (!preferenceMap.has(record.characterId)) {
    preferenceMap.set(record.characterId, new Map());
  }
  preferenceMap.get(record.characterId).set(record.giftId, record.preference);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(Math.max(0, Math.round(value)));
}

function getSelectedStudent() {
  return selectedStudentId ? studentsById.get(selectedStudentId) ?? null : null;
}

function getRankRequirement(rank) {
  return rankRequirementMap.get(rank)?.expToNext ?? 0;
}

function getRankTotalExp(rank) {
  return rankRequirementMap.get(rank)?.totalExp ?? 0;
}

function clampRankInput(input) {
  const nextValue = Number(input.value);

  if (!Number.isFinite(nextValue)) {
    return Number(input.min) || 1;
  }

  return Math.min(Math.max(Math.trunc(nextValue), Number(input.min) || 1), Number(input.max) || 100);
}

function syncRankInput(input) {
  const clamped = clampRankInput(input);
  input.value = String(clamped);
  return clamped;
}

function clampCurrentPoints() {
  const currentRank = syncRankInput(currentRankInput);
  const maxPoints = getRankRequirement(currentRank);
  currentPointsInput.max = String(maxPoints);

  const nextValue = Number(currentPointsInput.value);
  if (!Number.isFinite(nextValue)) {
    currentPointsInput.value = "0";
    return 0;
  }

  const clamped = Math.min(Math.max(Math.trunc(nextValue), 0), maxPoints);
  currentPointsInput.value = String(clamped);
  return clamped;
}

function getPreferenceForGift(studentId, giftId) {
  return preferenceMap.get(studentId)?.get(giftId) ?? null;
}

function getGiftPointForStudent(studentId, gift) {
  if (gift.fixedPoint != null) {
    return gift.fixedPoint;
  }

  const preference = getPreferenceForGift(studentId, gift.id);

  if (gift.grade === "special") {
    return 60;
  }

  if (gift.grade === "advanced") {
    return preference ? 180 : 120;
  }

  if (gift.grade === "normal") {
    if (preference === "favorite") {
      return 60;
    }

    if (preference === "liked") {
      return 40;
    }

    return 20;
  }

  return 0;
}

function getVisibleGifts() {
  const student = getSelectedStudent();
  const sorted = [...gifts].sort((left, right) => {
    const rightPoints = getGiftPointForStudent(student?.id ?? null, right);
    const leftPoints = getGiftPointForStudent(student?.id ?? null, left);

    if (rightPoints !== leftPoints) {
      return rightPoints - leftPoints;
    }
    return left.name.localeCompare(right.name, "ko");
  });

  if (showAllGifts || !student) {
    return sorted;
  }

  const preferredGiftIds = preferenceMap.get(student.id);
  if (!preferredGiftIds || preferredGiftIds.size === 0) {
    return [];
  }

  return sorted.filter((gift) => preferredGiftIds.has(gift.id));
}

function getGiftQuantity(giftId) {
  return quantityByGiftId.get(giftId) ?? 0;
}

function setGiftQuantity(giftId, nextValue) {
  quantityByGiftId.set(giftId, Math.max(0, Math.trunc(nextValue)));
  calculateBondState();
}

function getGiftTotalPoints() {
  const student = getSelectedStudent();
  return gifts.reduce((sum, gift) => sum + getGiftQuantity(gift.id) * getGiftPointForStudent(student?.id ?? null, gift), 0);
}

function createVisualSlot({ imageUrl, altText, placeholderText, wrapperClass }) {
  const wrapper = document.createElement("div");
  wrapper.className = wrapperClass;

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = altText;
    image.loading = "lazy";
    image.className = `${wrapperClass}__image`;
    wrapper.append(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = `${wrapperClass}__placeholder`;
    placeholder.textContent = placeholderText;
    wrapper.append(placeholder);
  }

  return wrapper;
}

function renderSelectedStudent() {
  const student = getSelectedStudent();
  selectedStudentVisual.replaceChildren();

  const slot = createVisualSlot({
    imageUrl: student?.imageUrl ?? null,
    altText: student ? `${student.name} 이미지` : "학생 이미지 준비 중",
    placeholderText: "학생 이미지 준비 중",
    wrapperClass: "bond-selected-student-visual-slot",
  });

  selectedStudentVisual.append(slot);

  if (!student) {
    selectedStudentValue.textContent = "학생 미선택";
    selectedStudentNote.textContent = "학생을 검색해 추천 목록에서 선택하세요.";
    return;
  }

  selectedStudentValue.textContent = student.name;
  selectedStudentNote.textContent = showAllGifts
    ? "모든 선물을 표시합니다."
    : "학생별 선호 선물을 우선 표시합니다.";
}

function renderPointSourceSummary() {
  cafePointsValue.textContent = "15";
  schedulePointsValue.textContent = "25";
}

function createSuggestionItem(student) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bond-student-suggestion-item";
  button.textContent = student.name;
  button.addEventListener("click", () => selectStudent(student.id));
  return button;
}

function renderStudentSuggestions() {
  const query = normalize(studentSearchInput.value);

  if (query.length === 0) {
    studentSuggestions.hidden = true;
    studentSearchInput.setAttribute("aria-expanded", "false");
    studentSuggestions.replaceChildren();
    return;
  }

  const matches = bondCalculatorStudents.filter((student) => normalize(student.name).includes(query));

  if (matches.length === 0) {
    const empty = document.createElement("div");
    empty.className = "bond-student-suggestion-empty";
    empty.textContent = "검색 결과가 없습니다.";
    studentSuggestions.replaceChildren(empty);
    studentSuggestions.hidden = false;
    studentSearchInput.setAttribute("aria-expanded", "true");
    return;
  }

  studentSuggestions.replaceChildren(...matches.map(createSuggestionItem));
  studentSuggestions.hidden = false;
  studentSearchInput.setAttribute("aria-expanded", "true");
}

function renderGiftList() {
  const student = getSelectedStudent();
  const visibleGifts = getVisibleGifts();

  if (!student) {
    giftToggleButton.disabled = true;
    giftToggleButton.textContent = "모든 선물 보기";
  } else {
    giftToggleButton.disabled = false;
    giftToggleButton.textContent = showAllGifts ? "선호 선물만 보기" : "모든 선물 보기";
  }

  if (visibleGifts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "bond-gift-empty";
    empty.textContent = "선물 목록이 없습니다.";
    giftList.replaceChildren(empty);
    return;
  }

  const cards = visibleGifts.map((gift) => {
    const giftPoint = getGiftPointForStudent(student?.id ?? null, gift);
    const preference = student ? getPreferenceForGift(student.id, gift.id) : null;
    const gradeLabel = gift.grade === "advanced" ? "고급" : gift.grade === "special" ? "선물선택상자" : "일반";
    const preferenceLabel = preference ? ` · ${preference === "favorite" ? "극선호" : "선호"}` : "";
    const tooltipText = `${gift.name} · ${gradeLabel}${preferenceLabel} · ${giftPoint} P`;
    const card = document.createElement("article");
    card.className = "bond-gift-card";
    card.tabIndex = 0;
    card.title = tooltipText;
    card.setAttribute("aria-label", tooltipText);

    const visual = createVisualSlot({
      imageUrl: gift.imageUrl,
      altText: `${gift.name} 이미지`,
      placeholderText: "선물 이미지 준비 중",
      wrapperClass: "bond-gift-card-visual-slot",
    });

    const exp = document.createElement("strong");
    exp.className = "bond-gift-exp";
    exp.textContent = `${giftPoint} P`;

    const tooltip = document.createElement("span");
    tooltip.className = "bond-gift-tooltip";
    tooltip.textContent = tooltipText;

    const controls = document.createElement("div");
    controls.className = "bond-gift-controls";

    const minusButton = document.createElement("button");
    minusButton.type = "button";
    minusButton.className = "bond-gift-stepper-button";
    minusButton.textContent = "−";

    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "0";
    quantityInput.step = "1";
    quantityInput.value = String(getGiftQuantity(gift.id));
    quantityInput.setAttribute("aria-label", `${gift.name} 수량`);

    const plusButton = document.createElement("button");
    plusButton.type = "button";
    plusButton.className = "bond-gift-stepper-button";
    plusButton.textContent = "+";
    plusButton.setAttribute("aria-label", `${gift.name} 수량 증가`);
    minusButton.setAttribute("aria-label", `${gift.name} 수량 감소`);

    minusButton.addEventListener("click", () => {
      const nextValue = getGiftQuantity(gift.id) - 1;
      quantityInput.value = String(Math.max(0, nextValue));
      setGiftQuantity(gift.id, nextValue);
    });

    plusButton.addEventListener("click", () => {
      const nextValue = getGiftQuantity(gift.id) + 1;
      quantityInput.value = String(nextValue);
      setGiftQuantity(gift.id, nextValue);
    });

    quantityInput.addEventListener("input", () => {
      const nextValue = Number(quantityInput.value);
      const safeValue = Number.isFinite(nextValue) ? Math.max(0, Math.trunc(nextValue)) : 0;
      quantityInput.value = String(safeValue);
      setGiftQuantity(gift.id, safeValue);
    });

    controls.append(minusButton, quantityInput, plusButton);
    card.append(exp, visual, controls, tooltip);
    return card;
  });

  giftList.replaceChildren(...cards);
}

function calculateBondState() {
  const currentRank = syncRankInput(currentRankInput);
  const targetRank = syncRankInput(targetRankInput);
  const currentPoints = clampCurrentPoints();
  const currentTotalExp = getRankTotalExp(currentRank) + currentPoints;
  const targetTotalExp = getRankTotalExp(targetRank);
  const totalTargetPoints = Math.max(0, targetTotalExp - currentTotalExp);
  const giftTotalPoints = getGiftTotalPoints();
  const remainingPoints = Math.max(totalTargetPoints - giftTotalPoints, 0);
  const nextRankRequirement = getRankRequirement(currentRank);
  const nextRankPoints = Math.max(nextRankRequirement - currentPoints - giftTotalPoints, 0);
  const excessPoints = Math.max(giftTotalPoints - totalTargetPoints, 0);
  const cafePoints = 15;
  const schedulePoints = 25;

  const cafeCount = remainingPoints > 0 && cafePoints > 0 ? Math.ceil(remainingPoints / cafePoints) : 0;
  const scheduleCount =
    remainingPoints > 0 && schedulePoints > 0 ? Math.ceil(remainingPoints / schedulePoints) : 0;

  currentRankSummary.textContent = `${currentRank}랭크`;
  targetRankSummary.textContent = `${targetRank}랭크`;
  nextRankPointsValue.textContent = `${formatNumber(nextRankPoints)} P`;
  targetTotalPointsValue.textContent = `${formatNumber(totalTargetPoints)} P`;
  giftTotalPointsValue.textContent = `${formatNumber(giftTotalPoints)} P`;
  remainingPointsValue.textContent = `${formatNumber(remainingPoints)} P`;
  cafeCountValue.textContent = `${formatNumber(cafeCount)}회`;
  scheduleCountValue.textContent = `${formatNumber(scheduleCount)}회`;
  excessPointsValue.textContent = `${formatNumber(excessPoints)} P`;

  if (targetRank <= currentRank) {
    resultNote.textContent = "목표 랭크가 현재 랭크보다 작거나 같아서 필요한 포인트는 0으로 표시됩니다.";
  } else {
    resultNote.textContent = "선물 수량을 조정하면 남은 포인트와 카페/스케줄 필요 횟수가 함께 변합니다.";
  }
}

function updateBondState() {
  renderSelectedStudent();
  renderGiftList();
  calculateBondState();
}

function selectStudent(studentId) {
  const student = studentsById.get(studentId);

  if (!student) {
    return;
  }

  selectedStudentId = student.id;
  studentSearchInput.value = student.name;
  studentSuggestions.hidden = true;
  studentSuggestions.replaceChildren();
  studentSearchInput.setAttribute("aria-expanded", "false");
  updateBondState();
}

function bindEvents() {
  siteSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = siteSearchInput.value.trim();

    if (!query) {
      return;
    }

    console.log("통합검색:", query);
    window.alert(`통합검색은 준비 중입니다.\n검색어: ${query}`);
  });

  studentSearchInput.addEventListener("input", renderStudentSuggestions);
  studentSearchInput.addEventListener("focus", renderStudentSuggestions);
  studentSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      studentSuggestions.hidden = true;
      studentSuggestions.replaceChildren();
      studentSearchInput.setAttribute("aria-expanded", "false");
    }
  });

  currentRankInput.addEventListener("input", () => {
    const currentRank = syncRankInput(currentRankInput);
    currentPointsInput.max = String(getRankRequirement(currentRank));
    calculateBondState();
  });

  targetRankInput.addEventListener("input", calculateBondState);
  currentPointsInput.addEventListener("input", calculateBondState);

  giftToggleButton.addEventListener("click", () => {
    showAllGifts = !showAllGifts;
    updateBondState();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".bond-student-search")) {
      studentSuggestions.hidden = true;
      studentSearchInput.setAttribute("aria-expanded", "false");
    }
  });
}

function initialize() {
  const initialStudent = studentsById.get(selectedStudentId) ?? null;
  if (initialStudent) {
    studentSearchInput.value = initialStudent.name;
  }

  currentRankInput.value = "1";
  targetRankInput.value = "5";
  currentPointsInput.value = "0";
  currentPointsInput.max = String(getRankRequirement(1));

  renderPointSourceSummary();
  updateBondState();
  studentSuggestions.hidden = true;
  studentSuggestions.replaceChildren();
  studentSearchInput.setAttribute("aria-expanded", "false");
}

bindEvents();
initialize();
