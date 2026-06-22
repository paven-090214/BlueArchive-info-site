export function normalizeItem(rawItem) {
  return {
    id: rawItem.Id ?? null,
    name: rawItem.Name ?? null,
    category: rawItem.Category ?? rawItem.ItemCategory ?? null,
    rarity: rawItem.Rarity ?? null,
    quality: rawItem.Quality ?? null,
    tags: rawItem.Tags ?? [],
    icon: rawItem.Icon ?? null,
    desc: rawItem.Desc ?? null,
    isReleased: rawItem.IsReleased ?? null,
    craftable: rawItem.Craftable ?? null,
    stageDrop: rawItem.StageDrop ?? null,
    shop: rawItem.Shop ?? null,
    needsReview: rawItem.Id === null || rawItem.Id === undefined || !rawItem.Name,
    raw: rawItem,
  };
}
