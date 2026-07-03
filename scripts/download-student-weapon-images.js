const fs = require("fs");
const path = require("path");

// Student exclusive weapon images are sourced from SchaleDB and stored locally by API student Id.
const STUDENT_DATA_URLS = [
  "https://schaledb.com/data/kr/students.min.json",
  "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/students.min.json",
];
const IMAGE_SOURCE_URLS = [
  "https://schaledb.com/images/weapon/weapon_icon_{id}.webp",
  "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/weapon/weapon_icon_{id}.webp",
  "https://schaledb.com/images/weapon/{id}.webp",
];
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "images", "students", "weapons");
const REQUEST_TIMEOUT_MS = 15000;
const CONCURRENCY = 8;
const MAX_RETRIES = 3;
const RETRY_STATUS_CODES = new Set([520, 502, 503, 504]);

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const studentIds = options.ids.length > 0 ? options.ids : await fetchStudentIds();
  const totals = {
    students: studentIds.length,
    attempted: studentIds.length,
    downloaded: 0,
    existing: 0,
    notFound: 0,
    failed: 0,
  };
  const missingIds = new Set();
  const failedRecords = [];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  await runWithConcurrency(studentIds, CONCURRENCY, async (id) => {
    const result = await downloadWeaponImage(id);
    totals[result.status] += 1;

    if (!["downloaded", "existing"].includes(result.status)) {
      missingIds.add(id);
    }

    if (result.status === "failed") {
      failedRecords.push({ id, reason: result.reason });
    }
  });

  console.log("Student weapon image download complete.");
  console.log(`Students: ${totals.students}`);
  console.log(`Attempted: ${totals.attempted}`);
  console.log(`Downloaded: ${totals.downloaded}`);
  console.log(`Existing skip: ${totals.existing}`);
  console.log(`Missing skip: ${totals.notFound}`);
  console.log(`Failed: ${totals.failed}`);
  console.log(`Output: ${path.relative(PROJECT_ROOT, OUTPUT_DIR)}`);
  console.log(`Sources: ${IMAGE_SOURCE_URLS.join(" -> ")}`);

  if (missingIds.size > 0) {
    console.log("");
    console.log("Missing weapon image ids:");
    [...missingIds].sort((left, right) => left - right).forEach((id) => console.log(id));
  }

  if (failedRecords.length > 0) {
    console.log("");
    console.log("Failed weapon image requests:");
    failedRecords
      .sort((left, right) => left.id - right.id)
      .forEach((record) => console.log(`${record.id}: ${record.reason}`));
  }
}

async function fetchStudentIds() {
  const errors = [];

  for (const url of STUDENT_DATA_URLS) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`.trim());
      }

      const rawStudents = await response.json();
      return [...new Set(toArray(rawStudents)
        .filter((student) => student?.Weapon && typeof student.Weapon === "object")
        .map((student) => Number(student?.Id))
        .filter((id) => Number.isInteger(id) && id > 0))]
        .sort((left, right) => left - right);
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  throw new Error(`Failed to fetch student data: ${errors.join(" / ")}`);
}

async function downloadWeaponImage(id) {
  const outputPath = path.join(OUTPUT_DIR, `${id}.webp`);

  if (fs.existsSync(outputPath)) {
    return { status: "existing" };
  }

  const errors = [];
  let allNotFound = true;

  for (const sourceUrl of IMAGE_SOURCE_URLS.map((url) => url.replace("{id}", id))) {
    const result = await fetchImageWithRetries(sourceUrl);

    if (result.status === "notFound") {
      errors.push(`${sourceUrl}: missing`);
      continue;
    }

    if (result.status === "failed") {
      allNotFound = false;
      errors.push(`${sourceUrl}: ${result.reason}`);
      continue;
    }

    const response = result.response;
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("image/")) {
      errors.push(`${sourceUrl}: non-image skip (${contentType || "unknown content-type"})`);
      continue;
    }

    allNotFound = false;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    return { status: "downloaded" };
  }

  const reason = errors.join(" / ");

  if (allNotFound) {
    return { status: "notFound", reason };
  }

  console.warn(`[failed] ${id} ${reason}`);
  return { status: "failed", reason };
}

async function fetchImageWithRetries(url) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);

      if (response.status === 400 || response.status === 404) {
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

function parseArgs(args) {
  const options = {
    ids: [],
  };

  args.forEach((arg) => {
    if (arg.startsWith("--ids=")) {
      options.ids = parseCsv(arg.slice("--ids=".length))
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
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
