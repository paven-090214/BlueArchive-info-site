const fs = require("fs");
const path = require("path");

const STUDENT_DATA_URL = "https://schaledb.com/data/kr/students.min.json";
const PROJECT_ROOT = path.resolve(__dirname, "..");

const IMAGE_TYPES = {
  portrait: "portraits",
  collection: "collection",
  icon: "icons",
};

async function main() {
  const students = await fetchStudents();
  const records = students.map(createStudentImageRecord);

  const portraitCount = records.filter((record) => record.exists.portrait).length;
  const collectionCount = records.filter((record) => record.exists.collection).length;
  const iconCount = records.filter((record) => record.exists.icon).length;
  const fullyMissing = records.filter((record) => !record.exists.portrait && !record.exists.collection && !record.exists.icon);
  const portraitMissing = records.filter((record) => !record.exists.portrait && (record.exists.collection || record.exists.icon));

  console.log("[학생 이미지 점검]");
  console.log(`전체 학생: ${records.length}명`);
  console.log(`portrait 있음: ${portraitCount}명`);
  console.log(`collection 있음: ${collectionCount}명`);
  console.log(`icon 있음: ${iconCount}명`);
  console.log(`완전 누락: ${fullyMissing.length}명`);
  console.log(`portrait 누락: ${portraitMissing.length}명`);

  printRecordList("완전 누락 학생", fullyMissing);
  printRecordList("portrait 누락, fallback 가능 학생", portraitMissing);
}

async function fetchStudents() {
  const response = await fetch(STUDENT_DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch student data: ${response.status} ${response.statusText}`.trim());
  }

  return toArray(await response.json())
    .map((student) => ({
      id: Number(student?.Id),
      name: student?.Name ?? student?.DevName ?? "Unknown",
    }))
    .filter((student) => Number.isInteger(student.id) && student.id > 0)
    .sort((left, right) => left.id - right.id);
}

function createStudentImageRecord(student) {
  return {
    ...student,
    exists: Object.fromEntries(
      Object.entries(IMAGE_TYPES).map(([type, folder]) => [
        type,
        fs.existsSync(path.join(PROJECT_ROOT, "images", "students", folder, `${student.id}.webp`)),
      ]),
    ),
  };
}

function printRecordList(title, records) {
  if (records.length === 0) {
    return;
  }

  console.log("");
  console.log(`[${title}]`);
  records.forEach((record) => {
    const availableTypes = Object.entries(record.exists)
      .filter(([, exists]) => exists)
      .map(([type]) => type)
      .join(", ") || "none";

    console.log(`- ${record.id} ${record.name} (available: ${availableTypes})`);
  });
}

function toArray(value) {
  return Array.isArray(value) ? value : Object.values(value ?? {});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
