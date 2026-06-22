import { academies } from "../data/academies.js";

const academyPanel = document.querySelector("#academy-panel");
const currentPickupList = document.querySelector("#current-pickup-list");
const pickupCarouselControls = document.querySelector("#pickup-carousel-controls");
const pickupCarouselPrev = document.querySelector("#pickup-carousel-prev");
const pickupCarouselNext = document.querySelector("#pickup-carousel-next");
const PICKUP_CAROUSEL_PAGE_SIZE = 2;
const PICKUP_CAROUSEL_INTERVAL = 5000;
let pickupCarouselTimer = null;

const siteSearchForm = document.querySelector("#site-search-form");
const siteSearchInput = document.querySelector("#site-search-input");

siteSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = siteSearchInput.value.trim();

  if (!query) {
    return;
  }

  console.log("통합검색:", query);
  window.alert(`통합검색은 준비 중입니다.\n검색어: ${query}`);
});

function parseDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getPickupStatus(pickup) {
  const startDate = parseDate(pickup.startDate);
  const endDate = parseDate(pickup.endDate);

  if (!startDate || !endDate) {
    return null;
  }

  const today = getToday();

  if (today >= startDate && today <= endDate) {
    return "진행중";
  }

  return "종료";
}

function isCurrentPickup(pickup) {
  const status = getPickupStatus(pickup);
  return status === "진행중";
}

function createPickupCharacterCard(pickup, character) {
  const card = document.createElement("article");
  card.className = "character-card";

  const portrait = document.createElement("div");
  portrait.className = "character-portrait pickup-current-portrait";
  const imageUrl = character.imageUrl || pickup.bannerImageUrl;

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = `${character.name} 픽업 이미지`;
    image.loading = "lazy";
    portrait.append(image);
  } else {
    portrait.textContent = character.name;
  }

  const body = document.createElement("div");
  const name = document.createElement("h3");
  name.textContent = character.name;

  const title = document.createElement("p");
  title.textContent = character.type;

  const period = document.createElement("p");
  period.textContent = `${pickup.startDate} ~ ${pickup.endDate}`;

  const status = document.createElement("span");
  status.className = "tag";
  status.textContent = getPickupStatus(pickup);

  body.append(name, title, period, status);
  card.append(portrait, body);
  return card;
}

function stopPickupCarouselTimer() {
  window.clearInterval(pickupCarouselTimer);
  pickupCarouselTimer = null;
}

function setPickupCarouselControlsVisible(isVisible) {
  if (!pickupCarouselControls) {
    return;
  }

  pickupCarouselControls.hidden = !isVisible;
}

function renderPickupCarouselPage(entries, pageIndex) {
  const startIndex = pageIndex * PICKUP_CAROUSEL_PAGE_SIZE;
  const pageEntries = entries.slice(startIndex, startIndex + PICKUP_CAROUSEL_PAGE_SIZE);
  const cards = pageEntries.map(({ schedule, character }) =>
    createPickupCharacterCard(schedule, character),
  );

  currentPickupList.replaceChildren(...cards);
}

function renderPickupCarousel(entries) {
  const pageCount = Math.ceil(entries.length / PICKUP_CAROUSEL_PAGE_SIZE);
  let currentPage = 0;

  setPickupCarouselControlsVisible(true);
  currentPickupList.classList.add("pickup-carousel-list");

  function moveToPage(pageIndex) {
    currentPage = (pageIndex + pageCount) % pageCount;
    renderPickupCarouselPage(entries, currentPage);
  }

  function restartAutoSlide() {
    stopPickupCarouselTimer();
    pickupCarouselTimer = window.setInterval(() => {
      moveToPage(currentPage + 1);
    }, PICKUP_CAROUSEL_INTERVAL);
  }

  pickupCarouselPrev.onclick = () => {
    moveToPage(currentPage - 1);
    restartAutoSlide();
  };

  pickupCarouselNext.onclick = () => {
    moveToPage(currentPage + 1);
    restartAutoSlide();
  };

  moveToPage(0);
  restartAutoSlide();
}

async function renderCurrentPickups() {
  if (!currentPickupList) {
    return;
  }

  stopPickupCarouselTimer();
  setPickupCarouselControlsVisible(false);
  currentPickupList.classList.remove("pickup-carousel-list");

  try {
    const response = await fetch("./data/pickups.json");
    if (!response.ok) {
      throw new Error("진행 중인 픽업 데이터를 불러오지 못했습니다.");
    }

    const schedules = await response.json();
    const currentSchedules = schedules.filter(isCurrentPickup);

    if (currentSchedules.length === 0) {
      const empty = document.createElement("p");
      empty.className = "pickup-history-empty";
      empty.textContent = "현재 진행 중인 픽업 정보가 없습니다.";
      currentPickupList.replaceChildren(empty);
      return;
    }

    const entries = currentSchedules.flatMap((schedule) =>
      schedule.characters.map((character) => ({ schedule, character })),
    );

    if (entries.length >= 3) {
      renderPickupCarousel(entries);
      return;
    }

    const cards = entries.map(({ schedule, character }) =>
      createPickupCharacterCard(schedule, character),
    );
    currentPickupList.replaceChildren(...cards);
  } catch (error) {
    const empty = document.createElement("p");
    empty.className = "pickup-history-empty";
    empty.textContent = error.message;
    currentPickupList.replaceChildren(empty);
  }
}

function createAcademyCard(academy) {
  const link = document.createElement("a");
  link.href = `academy-detail.html?academy=${academy.slug}`;
  link.className = "academy-card";

  const mark = createAcademyLogo(academy);

  const name = document.createElement("span");
  name.textContent = academy.shortName;

  link.append(mark, name);
  return link;
}

function createAcademyLogo(academy) {
  if (academy.logoImageUrl) {
    const logoSlot = document.createElement("span");
    logoSlot.className = "academy-logo-slot";
    logoSlot.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.className = "academy-logo-image";
    image.src = academy.logoImageUrl;
    image.alt = "";
    image.loading = "lazy";

    logoSlot.append(image);
    return logoSlot;
  }

  const mark = document.createElement("span");
  mark.className = `academy-logo-placeholder ${academy.logoClass}`;
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = academy.mark;
  return mark;
}

academyPanel.append(...academies.map(createAcademyCard));
renderCurrentPickups();
