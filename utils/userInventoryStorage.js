export const USER_INVENTORY_STORAGE_KEY = "bluearchive:owned-material-quantities:v1";
export const OWNED_MATERIAL_STORAGE_KEY = USER_INVENTORY_STORAGE_KEY;

export function getUserInventory({
  storage = globalThis.window?.localStorage,
  storageKey = USER_INVENTORY_STORAGE_KEY,
} = {}) {
  if (!storage) {
    return {};
  }

  try {
    return normalizeInventory(JSON.parse(storage.getItem(storageKey) || "[]"));
  } catch (error) {
    console.warn("유저 보유 아이템 데이터를 불러오지 못했습니다.", error);
    return {};
  }
}

export function saveUserInventory(
  inventory,
  {
    storage = globalThis.window?.localStorage,
    storageKey = USER_INVENTORY_STORAGE_KEY,
  } = {},
) {
  if (!storage) {
    return;
  }

  const normalizedInventory = normalizeInventory(inventory);
  const records = Object.entries(normalizedInventory).map(([itemId, quantity]) => ({
    itemId,
    quantity,
  }));

  storage.setItem(storageKey, JSON.stringify(records));
}

export function getOwnedItemQuantity(
  itemId,
  {
    storage = globalThis.window?.localStorage,
    storageKey = USER_INVENTORY_STORAGE_KEY,
  } = {},
) {
  const inventory = getUserInventory({ storage, storageKey });
  return inventory[String(itemId)] ?? 0;
}

export function setOwnedItemQuantity(
  itemId,
  quantity,
  {
    storage = globalThis.window?.localStorage,
    storageKey = USER_INVENTORY_STORAGE_KEY,
  } = {},
) {
  const inventory = getUserInventory({ storage, storageKey });
  const normalizedQuantity = normalizeQuantity(quantity);

  if (normalizedQuantity > 0) {
    inventory[String(itemId)] = normalizedQuantity;
  } else {
    delete inventory[String(itemId)];
  }

  saveUserInventory(inventory, { storage, storageKey });
}

export function loadOwnedMaterialQuantityMap(options = {}) {
  return new Map(
    Object.entries(getUserInventory(options)).map(([itemId, quantity]) => [itemId, quantity]),
  );
}

function normalizeInventory(source) {
  const inventory = {};

  if (source instanceof Map) {
    source.forEach((quantity, itemId) => {
      setInventoryQuantity(inventory, itemId, quantity);
    });
    return inventory;
  }

  if (Array.isArray(source)) {
    source.forEach((record) => {
      setInventoryQuantity(inventory, record?.itemId, record?.quantity);
    });
    return inventory;
  }

  if (source && typeof source === "object") {
    Object.entries(source).forEach(([itemId, quantity]) => {
      setInventoryQuantity(inventory, itemId, quantity);
    });
  }

  return inventory;
}

function setInventoryQuantity(inventory, itemId, quantity) {
  if (itemId === null || itemId === undefined || itemId === "") {
    return;
  }

  const normalizedQuantity = normalizeQuantity(quantity);

  if (normalizedQuantity > 0) {
    inventory[String(itemId)] = normalizedQuantity;
  }
}

function normalizeQuantity(quantity) {
  return Math.max(0, Math.trunc(Number(quantity) || 0));
}
