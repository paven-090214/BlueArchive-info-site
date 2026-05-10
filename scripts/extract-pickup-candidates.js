const fs = require("fs");
const path = require("path");

const sourceFile = path.join(__dirname, "..", "sources", "arca-pickup-1-111.html");
const outputFile = path.join(__dirname, "..", "data", "pickup-candidates.json");
const sourceName = "arca-pickup-1-111.html";

const html = fs.readFileSync(sourceFile, "utf8").replace(/\r?\n/g, " ");

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, ""));
}

function toIsoDate(shortDate) {
  const match = shortDate.match(/^(\d{2})\.(\d{2})\.(\d{2})\.$/);

  if (!match) {
    return null;
  }

  return `20${match[1]}-${match[2]}-${match[3]}`;
}

function parseDateLabel(dateLabel) {
  const match = dateLabel.match(
    /(?<start>\d{2}\.\d{2}\.\d{2}\.)\s*~\s*(?<end>\d{2}\.\d{2}\.\d{2}\.)\s*\((?<week>[^)]+)\)/,
  );

  if (!match?.groups) {
    return {
      startDate: null,
      endDate: null,
      weekLabel: null,
      needsReview: true,
      warning: "date-parse-failed",
    };
  }

  return {
    startDate: toIsoDate(match.groups.start),
    endDate: toIsoDate(match.groups.end),
    weekLabel: match.groups.week,
    needsReview: false,
    warning: null,
  };
}

function getPickupType(rawTitle) {
  const labels = [...rawTitle.matchAll(/\(([^)]*)\)/g)]
    .flatMap((match) => match[1].split(/[,/]/))
    .map((label) => label.trim())
    .filter((label) => ["신규", "기존", "한정", "복각"].includes(label));
  const uniqueLabels = [...new Set(labels)];

  return uniqueLabels.length > 0 ? uniqueLabels.join("/") : null;
}

function getPickupCharacters(rawTitle) {
  const beforePickup = rawTitle.split("픽업")[0] || "";
  const withoutTypeLabels = beforePickup.replace(/\([^)]*\)/g, "");

  return withoutTypeLabels
    .split(/\s*&\s*|,\s*/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function getTitle(rawTitle) {
  const beforePickup = rawTitle.split("픽업")[0] || rawTitle;
  const withoutTypeLabels = beforePickup.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

  return withoutTypeLabels ? `${withoutTypeLabels} 픽업` : rawTitle;
}

function getDistributionCharacters(blockHtml) {
  const names = [];
  const distributionPattern = /<strong>([^<]*배포[^<]*)<\/strong>/g;
  let match;

  while ((match = distributionPattern.exec(blockHtml))) {
    const candidate = stripTags(match[1])
      .replace(/\s*배포.*$/, "")
      .replace(/\([^)]*\)/g, "")
      .trim();

    if (candidate) {
      names.push(candidate);
    }
  }

  return [...new Set(names)];
}

function getNeedsReview({ dateInfo, pickupType, rawTitle, distributionCharacters }) {
  const hasMixedType = pickupType?.includes("/") ?? false;
  const hasDistribution = distributionCharacters.length > 0;
  const hasNoType = pickupType === null;
  const hasDateIssue = dateInfo.needsReview;
  const hasMultipleGroups = rawTitle.includes("&");

  return hasDateIssue || hasMixedType || hasDistribution || hasNoType || hasMultipleGroups;
}

const entryPattern =
  /<p><strong>(\d{2}\.\d{2}\.\d{2}\.\s*~\s*\d{2}\.\d{2}\.\d{2}\.\s*\([^)]+?\))<\/strong><\/p>\s*<p><strong>(.*?)<\/strong><\/p>/g;

const matches = [...html.matchAll(entryPattern)];

const candidates = matches.map((match, index) => {
  const dateLabel = stripTags(match[1]);
  const rawTitle = stripTags(match[2]);
  const blockStart = match.index;
  const nextMatch = matches[index + 1];
  const blockEnd = nextMatch?.index ?? html.length;
  const blockHtml = html.slice(blockStart, blockEnd);
  const dateInfo = parseDateLabel(dateLabel);
  const pickupCharacters = getPickupCharacters(rawTitle);
  const distributionCharacters = getDistributionCharacters(blockHtml);
  const pickupType = getPickupType(rawTitle);

  return {
    weekLabel: dateInfo.weekLabel,
    startDate: dateInfo.startDate,
    endDate: dateInfo.endDate,
    title: getTitle(rawTitle),
    pickupCharacters,
    distributionCharacters,
    pickupType,
    source: sourceName,
    needsReview: getNeedsReview({
      dateInfo,
      pickupType,
      rawTitle,
      distributionCharacters,
    }),
  };
});

fs.writeFileSync(outputFile, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");

console.log(`Extracted ${candidates.length} pickup candidate rows to ${outputFile}`);
