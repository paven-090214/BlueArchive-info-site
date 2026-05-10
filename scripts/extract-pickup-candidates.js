const fs = require("fs");
const path = require("path");

const [sourceArg = "sources/arca-pickup-1-111.html", outputArg = "data/pickup-candidates.json"] =
  process.argv.slice(2);
const sourceFile = path.resolve(__dirname, "..", sourceArg);
const outputFile = path.resolve(__dirname, "..", outputArg);
const sourceName = path.basename(sourceFile);

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

function getTypeLabels(value) {
  const labels = value
    .split(/[,/\s]+/)
    .map((label) => label.trim())
    .flatMap((label) => {
      if (label === "콜라보 한정") {
        return ["한정"];
      }

      return [label];
    })
    .filter((label) => ["신규", "기존", "한정", "복각"].includes(label));
  const uniqueLabels = [...new Set(labels)];

  return uniqueLabels.length > 0 ? uniqueLabels : [];
}

function getTypeFromLabels(labels) {
  return labels.length > 0 ? labels.join("/") : null;
}

function getPickupSegments(rawTitle) {
  const beforePickup = rawTitle.split("픽업")[0] || "";

  return beforePickup
    .split(/\s*&\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function getCharacters(rawTitle) {
  return getPickupSegments(rawTitle).flatMap((segment) => {
    const typeMatches = [...segment.matchAll(/\(([^)]*)\)/g)];
    const typeLabels = typeMatches.flatMap((match) => getTypeLabels(match[1]));
    const type = getTypeFromLabels(typeLabels);
    const names = segment
      .replace(/\([^)]*\)/g, "")
      .split(/,\s*/)
      .map((name) => name.trim())
      .filter(Boolean);

    return names.map((name) => ({
      name,
      characterId: null,
      imageUrl: null,
      type,
    }));
  });
}

function getTitle(rawTitle) {
  const beforePickup = rawTitle.split("픽업")[0] || rawTitle;
  const withoutTypeLabels = beforePickup.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

  return withoutTypeLabels ? `${withoutTypeLabels} 픽업` : rawTitle;
}

function getDistributions(blockHtml) {
  const distributions = [];
  const distributionPattern = /<strong>([^<]*배포[^<]*)<\/strong>/g;
  let match;

  while ((match = distributionPattern.exec(blockHtml))) {
    const candidate = stripTags(match[1])
      .replace(/\s*배포.*$/, "")
      .replace(/\([^)]*\)/g, "")
      .trim();

    if (candidate) {
      distributions.push({
        name: candidate,
        characterId: null,
        type: "배포",
      });
    }
  }

  return [...new Map(distributions.map((distribution) => [distribution.name, distribution])).values()];
}

function getNeedsReview({ dateInfo, characters }) {
  const hasMissingCharacterType = characters.some((character) => character.type === null);
  const hasDateIssue = dateInfo.needsReview;

  return hasDateIssue || hasMissingCharacterType;
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
  const characters = getCharacters(rawTitle);
  const distributions = getDistributions(blockHtml);

  return {
    weekLabel: dateInfo.weekLabel,
    startDate: dateInfo.startDate,
    endDate: dateInfo.endDate,
    title: getTitle(rawTitle),
    bannerImageUrl: null,
    characters,
    distributions,
    source: sourceName,
    needsReview: getNeedsReview({
      dateInfo,
      characters,
    }),
  };
});

fs.writeFileSync(outputFile, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");

console.log(`Extracted ${candidates.length} pickup candidate rows to ${outputFile}`);
