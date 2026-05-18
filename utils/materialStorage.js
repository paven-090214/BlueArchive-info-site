export const OWNED_MATERIAL_STORAGE_KEY = "bluearchive:owned-material-quantities:v1";

export function loadOwnedMaterialQuantityMap({
  storage = globalThis.window?.localStorage,
  storageKey = OWNED_MATERIAL_STORAGE_KEY,
} = {}) {
  const quantityByItemId = new Map();

  if (!storage) {
    return quantityByItemId;
  }

  try {
    const rawValue = storage.getItem(storageKey);
    const records = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(records)) {
      return quantityByItemId;
    }

    records.forEach((record) => {
      if (!record?.itemId) {
        return;
      }

      const quantity = Math.max(0, Math.trunc(Number(record.quantity) || 0));
      if (quantity > 0) {
        quantityByItemId.set(record.itemId, quantity);
      }
    });
  } catch (error) {
    console.warn("유저 보유 재화 데이터를 불러오지 못했습니다.", error);
  }

  return quantityByItemId;
}
