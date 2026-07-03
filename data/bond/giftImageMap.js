import { gifts } from "./gifts.js";

export const GIFT_IMAGE_MAP = {
  gift_buried_treasure_map: "gift-17",
  gift_brain_teaser_puzzle_cube: "gift-25",
  gift_retro_jewelled_egg: "gift-38",
  gift_i_book_rare: "gift-40",
  gift_vitamin_jelly: "gift-42",
};

const giftCatalogById = new Map(gifts.map((gift) => [gift.id, gift]));
const giftCatalogByName = new Map(
  gifts.map((gift) => [normalizeGiftLookupText(gift.name), gift]).filter(([key]) => key),
);

function normalizeGiftLookupText(value) {
  if (!value) {
    return "";
  }

  return String(value).normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

export function resolveGiftCatalogEntry(gift) {
  const directId = gift?.giftId ?? gift?.catalogGiftId ?? gift?.catalogId;

  if (directId && giftCatalogById.has(directId)) {
    return giftCatalogById.get(directId);
  }

  const mappedId = GIFT_IMAGE_MAP[gift?.code];

  if (mappedId && giftCatalogById.has(mappedId)) {
    return giftCatalogById.get(mappedId);
  }

  const candidateNames = [
    gift?.name?.ko,
    gift?.nameKo,
    gift?.displayNameKo,
    ...(Array.isArray(gift?.aliases) ? gift.aliases : []),
  ];

  for (const name of candidateNames) {
    const catalogEntry = giftCatalogByName.get(normalizeGiftLookupText(name));

    if (catalogEntry) {
      return catalogEntry;
    }
  }

  return null;
}
