import {
  fetchCurrency,
  fetchCurrencyByLocale,
  fetchEquipment,
  fetchEquipmentByLocale,
  fetchItems,
  fetchItemsByLocale,
  fetchStudents,
  fetchStudentsByLocale,
} from "./schaleDbClient.js";
import { normalizeStudent } from "./adapters/studentAdapter.js";
import { normalizeItem } from "./adapters/itemAdapter.js";
import { normalizeEquipment } from "./adapters/equipmentAdapter.js";
import {
  createStudentGroupIndexes,
  createStudentGroups,
} from "./adapters/studentGroupAdapter.js";

let masterData = null;
let studentData = null;
let itemData = null;
let equipmentData = null;
let currencyData = null;
const studentDataByLocale = new Map();
const itemDataByLocale = new Map();
const equipmentDataByLocale = new Map();
const currencyDataByLocale = new Map();

export async function loadMasterData() {
  if (masterData) {
    return masterData;
  }

  const [rawStudents, rawItems, rawEquipment, rawCurrency] = await Promise.all([
    fetchStudents(),
    fetchItems(),
    fetchEquipment(),
    fetchCurrency(),
  ]);
  const students = normalizeStudents(rawStudents);
  const items = normalizeItems(rawItems);
  const equipment = normalizeEquipmentList(rawEquipment);
  const studentGroupIndexes = createStudentGroupIndexes(createStudentGroups(students));

  masterData = {
    students,
    ...studentGroupIndexes,
    items,
    equipment,
    rawStudents,
    rawItems,
    rawEquipment,
    rawCurrency,
    studentsById: new Map(students.map((student) => [student.id, student])),
    studentsBySlug: new Map(
      students
        .filter((student) => student.slug)
        .map((student) => [student.slug, student]),
    ),
    itemsById: new Map(items.map((item) => [item.id, item])),
    equipmentById: new Map(equipment.map((item) => [item.id, item])),
  };
  studentData = {
    students: masterData.students,
    studentGroups: masterData.studentGroups,
    rawStudents: masterData.rawStudents,
    studentsById: masterData.studentsById,
    studentsBySlug: masterData.studentsBySlug,
    studentGroupsById: masterData.studentGroupsById,
    studentGroupByStudentId: masterData.studentGroupByStudentId,
  };
  itemData = {
    items: masterData.items,
    rawItems: masterData.rawItems,
    itemsById: masterData.itemsById,
  };
  equipmentData = {
    equipment: masterData.equipment,
    rawEquipment: masterData.rawEquipment,
    equipmentById: masterData.equipmentById,
  };
  currencyData = createCurrencyData(masterData.rawCurrency);

  return masterData;
}

export async function getAllStudents() {
  const data = await loadStudentData();
  return data.students;
}

export async function getAllStudentsByLocale(locale) {
  const data = await loadStudentDataByLocale(locale);
  return data.students;
}

export async function getAllStudentGroups() {
  const data = await loadStudentData();
  return data.studentGroups;
}

export async function getAllStudentGroupsByLocale(locale) {
  const data = await loadStudentDataByLocale(locale);
  return data.studentGroups;
}

export async function getStudentById(id) {
  const data = await loadStudentData();
  return data.studentsById.get(Number(id));
}

export async function getStudentByIdByLocale(id, locale) {
  const data = await loadStudentDataByLocale(locale);
  return data.studentsById.get(Number(id));
}

export async function getStudentGroupById(groupId) {
  const data = await loadStudentData();
  return data.studentGroupsById.get(String(groupId));
}

export async function getStudentGroupByIdByLocale(groupId, locale) {
  const data = await loadStudentDataByLocale(locale);
  return data.studentGroupsById.get(String(groupId));
}

export async function getStudentGroupByStudentId(studentId) {
  const data = await loadStudentData();
  return data.studentGroupByStudentId.get(Number(studentId));
}

export async function getStudentGroupByStudentIdByLocale(studentId, locale) {
  const data = await loadStudentDataByLocale(locale);
  return data.studentGroupByStudentId.get(Number(studentId));
}

export async function getStudentBySlug(slug) {
  const data = await loadStudentData();
  return data.studentsBySlug.get(String(slug).toLowerCase());
}

export async function getStudentBySlugByLocale(slug, locale) {
  const data = await loadStudentDataByLocale(locale);
  return data.studentsBySlug.get(String(slug).toLowerCase());
}

export async function getAllItems() {
  const data = await loadItemData();
  return data.items;
}

export async function getAllItemsByLocale(locale) {
  const data = await loadItemDataByLocale(locale);
  return data.items;
}

export async function getItemById(id) {
  const data = await loadItemData();
  return data.itemsById.get(Number(id));
}

export async function getItemByIdByLocale(id, locale) {
  const data = await loadItemDataByLocale(locale);
  return data.itemsById.get(Number(id));
}

export async function getAllEquipment() {
  const data = await loadEquipmentData();
  return data.equipment;
}

export async function getAllEquipmentByLocale(locale) {
  const data = await loadEquipmentDataByLocale(locale);
  return data.equipment;
}

export async function getEquipmentById(id) {
  const data = await loadEquipmentData();
  return data.equipmentById.get(Number(id));
}

export async function getEquipmentByIdByLocale(id, locale) {
  const data = await loadEquipmentDataByLocale(locale);
  return data.equipmentById.get(Number(id));
}

export async function getAllCurrency() {
  const data = await loadCurrencyData();
  return data.currency;
}

export async function getAllCurrencyByLocale(locale) {
  const data = await loadCurrencyDataByLocale(locale);
  return data.currency;
}

async function loadStudentData() {
  if (studentData) {
    return studentData;
  }

  const rawStudents = await fetchStudents();
  const students = normalizeStudents(rawStudents);
  const studentGroupIndexes = createStudentGroupIndexes(createStudentGroups(students));

  studentData = {
    students,
    ...studentGroupIndexes,
    rawStudents,
    studentsById: new Map(students.map((student) => [student.id, student])),
    studentsBySlug: new Map(
      students
        .filter((student) => student.slug)
        .map((student) => [student.slug, student]),
    ),
  };

  return studentData;
}

async function loadStudentDataByLocale(locale = "jp") {
  const localeKey = String(locale || "jp").toLowerCase();

  if (studentDataByLocale.has(localeKey)) {
    return studentDataByLocale.get(localeKey);
  }

  const rawStudents = await fetchStudentsByLocale(localeKey);
  const students = normalizeStudents(rawStudents);
  const studentGroupIndexes = createStudentGroupIndexes(createStudentGroups(students));
  const data = {
    students,
    ...studentGroupIndexes,
    rawStudents,
    studentsById: new Map(students.map((student) => [student.id, student])),
    studentsBySlug: new Map(
      students
        .filter((student) => student.slug)
        .map((student) => [student.slug, student]),
    ),
  };

  studentDataByLocale.set(localeKey, data);
  return data;
}

async function loadItemData() {
  if (itemData) {
    return itemData;
  }

  const rawItems = await fetchItems();
  const items = normalizeItems(rawItems);

  itemData = {
    items,
    rawItems,
    itemsById: new Map(items.map((item) => [item.id, item])),
  };

  return itemData;
}

async function loadItemDataByLocale(locale = "jp") {
  const localeKey = String(locale || "jp").toLowerCase();

  if (itemDataByLocale.has(localeKey)) {
    return itemDataByLocale.get(localeKey);
  }

  const rawItems = await fetchItemsByLocale(localeKey);
  const items = normalizeItems(rawItems);
  const data = {
    items,
    rawItems,
    itemsById: new Map(items.map((item) => [item.id, item])),
  };

  itemDataByLocale.set(localeKey, data);
  return data;
}

async function loadEquipmentData() {
  if (equipmentData) {
    return equipmentData;
  }

  const rawEquipment = await fetchEquipment();
  const equipment = normalizeEquipmentList(rawEquipment);

  equipmentData = {
    equipment,
    rawEquipment,
    equipmentById: new Map(equipment.map((item) => [item.id, item])),
  };

  return equipmentData;
}

async function loadEquipmentDataByLocale(locale = "jp") {
  const localeKey = String(locale || "jp").toLowerCase();

  if (equipmentDataByLocale.has(localeKey)) {
    return equipmentDataByLocale.get(localeKey);
  }

  const rawEquipment = await fetchEquipmentByLocale(localeKey);
  const equipment = normalizeEquipmentList(rawEquipment);
  const data = {
    equipment,
    rawEquipment,
    equipmentById: new Map(equipment.map((item) => [item.id, item])),
  };

  equipmentDataByLocale.set(localeKey, data);
  return data;
}

async function loadCurrencyData() {
  if (currencyData) {
    return currencyData;
  }

  const rawCurrency = await fetchCurrency();
  currencyData = createCurrencyData(rawCurrency);
  return currencyData;
}

async function loadCurrencyDataByLocale(locale = "jp") {
  const localeKey = String(locale || "jp").toLowerCase();

  if (currencyDataByLocale.has(localeKey)) {
    return currencyDataByLocale.get(localeKey);
  }

  const rawCurrency = await fetchCurrencyByLocale(localeKey);
  const data = createCurrencyData(rawCurrency);
  currencyDataByLocale.set(localeKey, data);
  return data;
}

function normalizeStudents(rawStudents) {
  return toArray(rawStudents).map(normalizeStudent);
}

function normalizeItems(rawItems) {
  return toArray(rawItems).map(normalizeItem);
}

function normalizeEquipmentList(rawEquipment) {
  return toArray(rawEquipment).map(normalizeEquipment);
}

function createCurrencyData(rawCurrency) {
  const currency = toArray(rawCurrency).map(normalizeCurrency);

  return {
    currency,
    rawCurrency,
    currencyById: new Map(currency.map((item) => [item.id, item])),
  };
}

function normalizeCurrency(rawCurrency) {
  return {
    id: rawCurrency.Id ?? null,
    name: rawCurrency.Name ?? null,
    rarity: rawCurrency.Rarity ?? null,
    icon: rawCurrency.Icon ?? null,
    desc: rawCurrency.Desc ?? null,
    needsReview: rawCurrency.Id === null || rawCurrency.Id === undefined || !rawCurrency.Name,
    raw: rawCurrency,
  };
}

function toArray(data) {
  return Array.isArray(data) ? data : Object.values(data ?? {});
}
