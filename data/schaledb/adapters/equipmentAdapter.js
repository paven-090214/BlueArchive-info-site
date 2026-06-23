export function normalizeEquipment(rawEquipment) {
  return {
    id: rawEquipment.Id ?? null,
    name: rawEquipment.Name ?? null,
    category: rawEquipment.Category ?? rawEquipment.EquipmentCategory ?? null,
    rarity: rawEquipment.Rarity ?? null,
    tier: rawEquipment.Tier ?? null,
    icon: rawEquipment.Icon ?? null,
    desc: rawEquipment.Desc ?? null,
    maxLevel: rawEquipment.MaxLevel ?? null,
    recipe: rawEquipment.Recipe ?? [],
    recipeCost: rawEquipment.RecipeCost ?? 0,
    statType: rawEquipment.StatType ?? [],
    statValue: rawEquipment.StatValue ?? [],
    levelUpFeedExp: rawEquipment.LevelUpFeedExp ?? null,
    shops: rawEquipment.Shops ?? [],
    isReleased: rawEquipment.IsReleased ?? null,
    needsReview: rawEquipment.Id === null || rawEquipment.Id === undefined || !rawEquipment.Name,
    raw: rawEquipment,
  };
}
