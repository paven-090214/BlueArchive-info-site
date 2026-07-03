import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STUDENTS_DATA_URL =
  "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/students.json";
const SKILL_ICON_BASE_URL =
  "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/skill";
const GEAR_ICON_BASE_URL =
  "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/gear/icon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const SKILL_OUTPUT_DIR = path.join(PROJECT_ROOT, "images", "skills");
const GEAR_ICON_OUTPUT_DIR = path.join(PROJECT_ROOT, "images", "gears", "icon");
const LOG_DIR = path.join(PROJECT_ROOT, "scripts", "logs");
const FAILURE_LOG_PATH = path.join(LOG_DIR, "schaledb-image-download-failures.json");

const FORCE_DOWNLOAD = process.env.FORCE_DOWNLOAD === "1" || process.argv.includes("--force");
const RETRY_FAILED_ONLY = process.argv.includes("--retry-failed");
const REQUEST_TIMEOUT_MS = 15000;
const CONCURRENCY = 2;
const MAX_RETRIES = 3;
const MIN_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 1000;
const RETRY_STATUS_CODES = new Set([400, 408, 409, 425, 429, 500, 502, 503, 504, 520, 522, 524]);
const SAFE_FILE_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

async function main() {
  ensureDirectories();

  const warnings = [];
  const failures = [];
  const jobs = RETRY_FAILED_ONLY
    ? collectRetryFailedJobs()
    : collectAllJobs(await fetchStudents(), warnings);
  const skillJobs = jobs.filter((job) => job.type === "skill");
  const gearJobs = jobs.filter((job) => job.type === "gear");
  const skillTotals = createTotals(skillJobs.length);
  const gearTotals = createTotals(gearJobs.length);

  await runWithConcurrency(skillJobs, CONCURRENCY, async (job) => {
    const result = await downloadImage(job);
    applyDownloadResult(skillTotals, result, failures);
  });

  await runWithConcurrency(gearJobs, CONCURRENCY, async (job) => {
    const result = await downloadImage(job);
    applyDownloadResult(gearTotals, result, failures);
  });

  writeFailureLog({ warnings, failures, skillTotals, gearTotals });
  printSummary({ skillTotals, gearTotals, failures });
}

function ensureDirectories() {
  [SKILL_OUTPUT_DIR, GEAR_ICON_OUTPUT_DIR, LOG_DIR].forEach((dirPath) => {
    fs.mkdirSync(dirPath, { recursive: true });
  });
}

function collectAllJobs(students, warnings) {
  const skillIcons = collectSkillIcons(students, warnings);
  const gearIconIds = collectGearIconIds(students);

  return [
    ...skillIcons.map(createSkillJob),
    ...gearIconIds.map(createGearJob),
  ];
}

function collectRetryFailedJobs() {
  if (!fs.existsSync(FAILURE_LOG_PATH)) {
    throw new Error(`실패 로그가 없습니다: ${path.relative(PROJECT_ROOT, FAILURE_LOG_PATH)}`);
  }

  const failureLog = JSON.parse(fs.readFileSync(FAILURE_LOG_PATH, "utf8"));
  const jobs = toArray(failureLog.failures)
    .map((failure) => {
      if (failure?.type === "skill" && failure.key) {
        return createSkillJob(failure.key);
      }

      if (failure?.type === "gear" && failure.key) {
        return createGearJob(failure.key);
      }

      return null;
    })
    .filter(Boolean);

  return dedupeJobs(jobs);
}

function createSkillJob(icon) {
  return {
    type: "skill",
    key: String(icon),
    url: `${SKILL_ICON_BASE_URL}/${encodeURIComponent(String(icon))}.webp`,
    outputPath: path.join(SKILL_OUTPUT_DIR, `${icon}.webp`),
  };
}

function createGearJob(id) {
  return {
    type: "gear",
    key: String(id),
    url: `${GEAR_ICON_BASE_URL}/${encodeURIComponent(String(id))}.webp`,
    outputPath: path.join(GEAR_ICON_OUTPUT_DIR, `${id}.webp`),
  };
}

function dedupeJobs(jobs) {
  const seen = new Set();

  return jobs.filter((job) => {
    const key = `${job.type}:${job.key}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function fetchStudents() {
  const { response } = await fetchWithRetries(STUDENTS_DATA_URL);

  if (!response.ok) {
    throw new Error(`학생 데이터 로드 실패: ${response.status} ${response.statusText}`.trim());
  }

  return toArray(await response.json());
}

function collectSkillIcons(students, warnings) {
  const icons = new Set();

  students.forEach((student) => {
    const studentId = student?.Id ?? "unknown";
    const skills = student?.Skills;

    if (!Array.isArray(skills)) {
      warnings.push({
        type: "missing-skill-array",
        studentId,
        message: `student ${studentId} Skills 배열이 없습니다.`,
      });
      return;
    }

    skills.forEach((skill, index) => {
      const icon = typeof skill?.Icon === "string" ? skill.Icon.trim() : "";

      if (!icon) {
        warnings.push({
          type: "missing-skill-icon",
          studentId,
          skillIndex: index,
          message: `student ${studentId} skill ${index} Icon 값이 없습니다.`,
        });
        return;
      }

      if (!SAFE_FILE_NAME_PATTERN.test(icon)) {
        warnings.push({
          type: "unsafe-skill-icon",
          studentId,
          skillIndex: index,
          icon,
          message: `student ${studentId} skill ${index} Icon 파일명이 안전하지 않아 건너뜁니다.`,
        });
        return;
      }

      icons.add(icon);
    });
  });

  return [...icons].sort((left, right) => left.localeCompare(right));
}

function collectGearIconIds(students) {
  const ids = new Set();

  students.forEach((student) => {
    const id = Number(student?.Id);
    const released = student?.Gear?.Released;

    if (!Number.isInteger(id) || id <= 0 || !Array.isArray(released)) {
      return;
    }

    if (released.some((value) => value === true)) {
      ids.add(id);
    }
  });

  return [...ids].sort((left, right) => left - right);
}

function createTotals(total) {
  return {
    total,
    downloaded: 0,
    existing: 0,
    failed: 0,
  };
}

async function downloadImage({ type, key, url, outputPath }) {
  if (!FORCE_DOWNLOAD && fs.existsSync(outputPath)) {
    return { status: "existing", type, key, url, outputPath };
  }

  try {
    const { response, attempts } = await fetchWithRetries(url);

    if (!response.ok) {
      return {
        status: "failed",
        type,
        key,
        url,
        outputPath,
        attempts,
        reason: `${response.status} ${response.statusText}`.trim(),
      };
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("image/")) {
      return {
        status: "failed",
        type,
        key,
        url,
        outputPath,
        attempts,
        reason: `이미지 응답이 아님 (${contentType || "unknown content-type"})`,
      };
    }

    fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
    return { status: "downloaded", type, key, url, outputPath, attempts };
  } catch (error) {
    return {
      status: "failed",
      type,
      key,
      url,
      outputPath,
      attempts: MAX_RETRIES,
      reason: error.message,
    };
  }
}

async function fetchWithRetries(url) {
  let lastError = null;
  let lastResponse = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "BlueArchive-info-site asset downloader",
        },
      });

      clearTimeout(timeout);
      lastResponse = response;

      if (!RETRY_STATUS_CODES.has(response.status) || attempt === MAX_RETRIES) {
        return { response, attempts: attempt };
      }

      lastError = new Error(`${response.status} ${response.statusText}`.trim());
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }

    await delay(getRetryDelayMs());
  }

  if (lastResponse) {
    return { response: lastResponse, attempts: MAX_RETRIES };
  }

  throw lastError ?? new Error(`요청 실패: ${url}`);
}

function applyDownloadResult(totals, result, failures) {
  if (result.status === "downloaded") {
    totals.downloaded += 1;
    return;
  }

  if (result.status === "existing") {
    totals.existing += 1;
    return;
  }

  totals.failed += 1;
  failures.push({
    type: result.type,
    key: result.key,
    url: result.url,
    outputPath: path.relative(PROJECT_ROOT, result.outputPath),
    attempts: result.attempts,
    reason: result.reason,
  });
}

function writeFailureLog({ warnings, failures, skillTotals, gearTotals }) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: {
      students: STUDENTS_DATA_URL,
      skillIcons: `${SKILL_ICON_BASE_URL}/{Icon}.webp`,
      gearIcons: `${GEAR_ICON_BASE_URL}/{Id}.webp`,
    },
    forceDownload: FORCE_DOWNLOAD,
    retryFailedOnly: RETRY_FAILED_ONLY,
    concurrency: CONCURRENCY,
    maxRetries: MAX_RETRIES,
    totals: {
      skillIcons: skillTotals,
      gearIcons: gearTotals,
    },
    warnings,
    failures,
  };

  fs.writeFileSync(FAILURE_LOG_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function printSummary({ skillTotals, gearTotals, failures }) {
  console.log(`스킬 아이콘 총 수집 대상: ${skillTotals.total}`);
  console.log(`스킬 아이콘 다운로드 성공: ${skillTotals.downloaded}`);
  console.log(`스킬 아이콘 기존 파일 스킵: ${skillTotals.existing}`);
  console.log(`스킬 아이콘 실패: ${skillTotals.failed}`);
  console.log("");
  console.log(`애장품 아이콘 총 수집 대상: ${gearTotals.total}`);
  console.log(`애장품 아이콘 다운로드 성공: ${gearTotals.downloaded}`);
  console.log(`애장품 아이콘 기존 파일 스킵: ${gearTotals.existing}`);
  console.log(`애장품 아이콘 실패: ${gearTotals.failed}`);
  console.log("");
  console.log(`실패 로그: ${path.relative(PROJECT_ROOT, FAILURE_LOG_PATH)}`);

  if (failures.length === 0) {
    return;
  }

  console.log("");
  console.log("실패한 URL 목록:");
  failures.forEach((failure) => {
    console.log(`- [${failure.type}] ${failure.key}: ${failure.url} (${failure.reason})`);
  });
}

async function runWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex]);
    }
  });

  await Promise.all(workers);
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return Object.values(value);
  }

  return [];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs() {
  const range = MAX_RETRY_DELAY_MS - MIN_RETRY_DELAY_MS;
  return MIN_RETRY_DELAY_MS + Math.floor(Math.random() * (range + 1));
}

main().catch((error) => {
  ensureDirectories();
  const payload = {
    generatedAt: new Date().toISOString(),
    source: {
      students: STUDENTS_DATA_URL,
      skillIcons: `${SKILL_ICON_BASE_URL}/{Icon}.webp`,
      gearIcons: `${GEAR_ICON_BASE_URL}/{Id}.webp`,
    },
    forceDownload: FORCE_DOWNLOAD,
    retryFailedOnly: RETRY_FAILED_ONLY,
    concurrency: CONCURRENCY,
    maxRetries: MAX_RETRIES,
    fatalError: error.message,
  };

  fs.writeFileSync(FAILURE_LOG_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.error(error);
  process.exitCode = 1;
});
