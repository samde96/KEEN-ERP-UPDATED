export function normalizeLocationType(type) {
  return String(type || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

export function isShopLocation(location) {
  return ['SHOP', 'BRANCH'].includes(normalizeLocationType(location?.type));
}

export function isWarehouseLocation(location) {
  return ['MAIN_WAREHOUSE', 'WAREHOUSE', 'STORE'].includes(normalizeLocationType(location?.type));
}

export function isOperationalStockLocation(location) {
  return isShopLocation(location) || isWarehouseLocation(location);
}

export function balanceMatchesLocation(balance, location) {
  return (
    String(balance?.locationId || '') === String(location?.id || '') ||
    (balance?.location && location?.name && balance.location === location.name)
  );
}

export function isLikelyShopBalance(balance) {
  return /\b(shop|branch)\b/i.test(String(balance?.location || ''));
}

export function isLikelyWarehouseBalance(balance) {
  return !isLikelyShopBalance(balance);
}
