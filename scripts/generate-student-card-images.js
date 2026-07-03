const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PORTRAIT_DIR = path.join(PROJECT_ROOT, "images", "students", "portraits");
const CARD_DIR = path.join(PROJECT_ROOT, "images", "students", "cards");
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9471;
const STUDENT_DATA_URLS = [
  "https://schaledb.com/data/kr/students.min.json",
  "https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/students.min.json",
];

const CARD_WIDTH = 320;
const CARD_HEIGHT = 500;
const TOP_PADDING = 10;
const BOTTOM_PADDING = 0;
const ALPHA_THRESHOLD = 12;
const WEBP_QUALITY = 0.92;

async function main() {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome not found: ${CHROME_PATH}`);
  }

  fs.mkdirSync(CARD_DIR, { recursive: true });
  const expectedIds = await fetchExpectedStudentIds();
  const portraits = getPortraitFiles();
  const portraitIds = new Set(portraits.map((portrait) => portrait.id));
  const missingPortraitIds = expectedIds.filter((id) => !portraitIds.has(id));

  if (portraits.length === 0) {
    console.log("No portrait images found.");
    printSummary({
      generated: 0,
      skipped: 0,
      failed: 0,
      missingPortraitIds,
    });
    return;
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ba-card-image-chrome-"));
  const chrome = spawnChrome(userDataDir);

  try {
    const wsUrl = await waitForChrome();
    const ws = await openWebSocket(wsUrl);
    const totals = {
      attempted: portraits.length,
      generated: 0,
      skipped: 0,
      failed: 0,
    };

    await evaluate(ws, "Page.enable");
    await evaluate(ws, "Runtime.enable");

    for (const portrait of portraits) {
      const outputPath = path.join(CARD_DIR, portrait.name);

      if (fs.existsSync(outputPath)) {
        totals.skipped += 1;
        continue;
      }

      try {
        const base64 = fs.readFileSync(portrait.path).toString("base64");
        const generated = await generateCardImage(ws, base64);
        fs.writeFileSync(outputPath, Buffer.from(generated, "base64"));
        totals.generated += 1;
      } catch (error) {
        totals.failed += 1;
        console.warn(`[failed] ${portrait.name} ${error.message}`);
      }
    }

    ws.close();
    printSummary({
      generated: totals.generated,
      skipped: totals.skipped,
      failed: totals.failed,
      missingPortraitIds,
      attempted: totals.attempted,
    });
    console.log(`Output: ${path.relative(PROJECT_ROOT, CARD_DIR)}`);
  } finally {
    chrome.kill();
    await wait(500);
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

function getPortraitFiles() {
  return fs.readdirSync(PORTRAIT_DIR)
    .filter((fileName) => /^\d+\.webp$/.test(fileName))
    .sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10))
    .map((name) => ({
      id: Number.parseInt(name, 10),
      name,
      path: path.join(PORTRAIT_DIR, name),
    }));
}

async function fetchExpectedStudentIds() {
  const errors = [];

  for (const url of STUDENT_DATA_URLS) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`.trim());
      }

      const rawStudents = await response.json();
      return [...new Set(toArray(rawStudents)
        .map((student) => Number(student?.Id))
        .filter((id) => Number.isInteger(id) && id > 0))]
        .sort((left, right) => left - right);
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  console.warn(`[card image generation] expected student list unavailable: ${errors.join(" / ")}`);
  return [];
}

function printSummary({
  generated,
  skipped,
  failed,
  missingPortraitIds,
  attempted = 0,
}) {
  console.log("[card image generation]");
  console.log(`attempted: ${attempted}`);
  console.log(`generated: ${generated}`);
  console.log(`skipped existing: ${skipped}`);
  console.log(`failed: ${failed}`);
  console.log(`missing portrait: ${missingPortraitIds.length}`);

  if (missingPortraitIds.length > 0) {
    console.log("");
    console.log("missing portrait ids:");
    missingPortraitIds.forEach((id) => console.log(id));
  }
}

function spawnChrome(userDataDir) {
  return spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--no-first-run",
    "about:blank",
  ], { stdio: "ignore" });
}

async function waitForChrome() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      const pages = await response.json();
      const page = pages.find((entry) => entry.type === "page") ?? pages[0];

      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch (_) {
      await wait(100);
    }
  }

  throw new Error("Chrome DevTools endpoint was not ready.");
}

function openWebSocket(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(ws), { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
}

async function generateCardImage(ws, sourceBase64) {
  const expression = `
    (async () => {
      const sourceBase64 = ${JSON.stringify(sourceBase64)};
      const cardWidth = ${CARD_WIDTH};
      const cardHeight = ${CARD_HEIGHT};
      const topPadding = ${TOP_PADDING};
      const bottomPadding = ${BOTTOM_PADDING};
      const alphaThreshold = ${ALPHA_THRESHOLD};
      const webpQuality = ${WEBP_QUALITY};

      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("image decode failed"));
        img.src = "data:image/webp;base64," + sourceBase64;
      });

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      sourceContext.drawImage(image, 0, 0);

      const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const box = getAlphaBoundingBox(imageData, sourceCanvas.width, sourceCanvas.height, alphaThreshold);

      if (!box) {
        throw new Error("alpha bounding box not found");
      }

      const availableHeight = cardHeight - topPadding - bottomPadding;
      const scale = availableHeight / box.height;
      const centerX = box.left + box.width / 2;
      const drawWidth = sourceCanvas.width * scale;
      const drawHeight = sourceCanvas.height * scale;
      const drawX = cardWidth / 2 - centerX * scale;
      const drawY = cardHeight - bottomPadding - box.bottom * scale;

      const cardCanvas = document.createElement("canvas");
      cardCanvas.width = cardWidth;
      cardCanvas.height = cardHeight;
      const cardContext = cardCanvas.getContext("2d");
      cardContext.clearRect(0, 0, cardWidth, cardHeight);
      cardContext.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);

      return cardCanvas.toDataURL("image/webp", webpQuality).split(",")[1];

      function getAlphaBoundingBox(data, width, height, threshold) {
        let left = width;
        let right = -1;
        let top = height;
        let bottom = -1;

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const alpha = data.data[(y * width + x) * 4 + 3];

            if (alpha <= threshold) {
              continue;
            }

            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }

        if (right < left || bottom < top) {
          return null;
        }

        return {
          left,
          right,
          top,
          bottom,
          width: right - left + 1,
          height: bottom - top + 1,
        };
      }
    })()
  `;

  return evaluate(ws, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }).then((result) => {
    const value = result?.result?.value;

    if (!value) {
      throw new Error(result?.exceptionDetails?.text ?? "empty generated image");
    }

    return value;
  });
}

async function evaluate(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 60000);
    const onMessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.id !== id) {
        return;
      }

      clearTimeout(timer);
      ws.removeEventListener("message", onMessage);

      if (message.error) {
        reject(new Error(message.error.message));
        return;
      }

      resolve(message.result);
    };

    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
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
