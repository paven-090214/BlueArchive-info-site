const fs = require("fs");
const path = require("path");

// Student image assets are downloaded from SchaleDB and stored locally by API student Id.
const STUDENT_DATA_URL = "https://schaledb.com/data/kr/students.min.json";
const IMAGE_SOURCE_BASE_URLS = [
  "https://schaledb.com/images/student",
  "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student",
];
const PROJECT_ROOT = path.resolve(__dirname, "..");
const REQUEST_TIMEOUT_MS = 15000;
const CONCURRENCY = 8;
const MAX_RETRIES = 3;
const RETRY_STATUS_CODES = new Set([520, 502, 503, 504]);

const IMAGE_TYPES = [
  ["icon", "icons"],
  ["portrait", "portraits"],
  ["collection", "collection"],
  ["lobby", "lobby"],
];

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const studentIds = options.ids.length > 0 ? options.ids : await fetchStudentIds();
  const imageTypes = options.types.length > 0
    ? IMAGE_TYPES.filter(([sourceType]) => options.types.includes(sourceType))
    : IMAGE_TYPES;
  const totals = {
    students: studentIds.length,
    attempted: 0,
    downloaded: 0,
    existing: 0,
    notFound: 0,
    failed: 0,
  };
  const missingPortraitIds = new Set();
  const failedRecords = [];

  ensureOutputDirectories(imageTypes);

  const jobs = studentIds.flatMap((id) =>
    imageTypes.map(([sourceType, outputFolder]) => ({ id, sourceType, outputFolder })),
  );
  totals.attempted = jobs.length;

  await runWithConcurrency(jobs, CONCURRENCY, async (job) => {
    const result = await downloadStudentImage(job);
    totals[result.status] += 1;

    if (job.sourceType === "portrait" && !["downloaded", "existing"].includes(result.status)) {
      missingPortraitIds.add(job.id);
    }

    if (result.status === "failed") {
      failedRecords.push({ ...job, reason: result.reason });
    }
  });

  console.log("Student image download complete.");
  console.log(`Students: ${totals.students}`);
  console.log(`Attempted: ${totals.attempted}`);
  console.log(`Downloaded: ${totals.downloaded}`);
  console.log(`Existing skip: ${totals.existing}`);
  console.log(`404 skip: ${totals.notFound}`);
  console.log(`Failed: ${totals.failed}`);
  console.log(`Sources: ${IMAGE_SOURCE_BASE_URLS.join(" -> ")}`);

  if (missingPortraitIds.size > 0) {
    console.log("");
    console.log("Missing portrait ids:");
    [...missingPortraitIds].sort((left, right) => left - right).forEach((id) => console.log(id));
  }

  if (failedRecords.length > 0) {
    console.log("");
    console.log("Failed image requests:");
    failedRecords
      .sort((left, right) => left.id - right.id || left.sourceType.localeCompare(right.sourceType))
      .forEach((record) => {
        console.log(`${record.id} ${record.sourceType}: ${record.reason}`);
      });
  }
}

async function fetchStudentIds() {
  const response = await fetch(STUDENT_DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch student data: ${response.status} ${response.statusText}`.trim());
  }

  const rawStudents = await response.json();
  return [...new Set(toArray(rawStudents)
    .map((student) => Number(student?.Id))
    .filter((id) => Number.isInteger(id) && id > 0))]
    .sort((left, right) => left - right);
}

async function downloadStudentImage({ id, sourceType, outputFolder }) {
  const outputPath = path.join(PROJECT_ROOT, "images", "students", outputFolder, `${id}.webp`);

  if (fs.existsSync(outputPath)) {
    return { status: "existing" };
  }

  const errors = [];
  let allNotFound = true;

  for (const baseUrl of IMAGE_SOURCE_BASE_URLS) {
    const url = `${baseUrl}/${sourceType}/${id}.webp`;
    const result = await fetchImageWithRetries(url);

    if (result.status === "notFound") {
      errors.push(`${url}: 404`);
      continue;
    }

    allNotFound = false;

    if (result.status === "failed") {
      errors.push(`${url}: ${result.reason}`);
      continue;
    }

    const response = result.response;
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("image/")) {
      errors.push(`${url}: non-image response (${contentType || "unknown content-type"})`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    return { status: "downloaded" };
  }

  const reason = errors.join(" / ");

  if (allNotFound) {
    return { status: "notFound", reason };
  }

  console.warn(`[failed] ${id} ${sourceType} ${reason}`);
  return { status: "failed", reason };
}

async function fetchImageWithRetries(url) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);

      if (response.status === 404) {
        return { status: "notFound" };
      }

      if (response.ok) {
        return { status: "ok", response };
      }

      if (!RETRY_STATUS_CODES.has(response.status) || attempt === MAX_RETRIES) {
        return { status: "failed", reason: `${response.status} ${response.statusText}`.trim() };
      }

      await wait(getRetryDelayMs(attempt));
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        return { status: "failed", reason: error.message };
      }

      await wait(getRetryDelayMs(attempt));
    }
  }

  return { status: "failed", reason: "retry exhausted" };
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function runWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  });

  await Promise.all(workers);
}

function ensureOutputDirectories(imageTypes) {
  imageTypes.forEach(([, outputFolder]) => {
    fs.mkdirSync(path.join(PROJECT_ROOT, "images", "students", outputFolder), { recursive: true });
  });
}

function parseArgs(args) {
  const options = {
    ids: [],
    types: [],
  };

  args.forEach((arg) => {
    if (arg.startsWith("--ids=")) {
      options.ids = parseCsv(arg.slice("--ids=".length))
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
    }

    if (arg.startsWith("--types=")) {
      options.types = parseCsv(arg.slice("--types=".length))
        .filter((value) => IMAGE_TYPES.some(([sourceType]) => sourceType === value));
    }
  });

  return options;
}

function parseCsv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRetryDelayMs(attempt) {
  return 500 * attempt;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toArray(value) {
  return Array.isArray(value) ? value : Object.values(value ?? {});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
