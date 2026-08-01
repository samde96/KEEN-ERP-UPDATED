export function stockRequestItems(request) {
  const items = Array.isArray(request?.items) ? request.items.filter(Boolean) : [];
  if (items.length) {
    return items;
  }

  if (request?.productId || request?.product) {
    return [
      {
        productId: request.productId,
        product: request.product || 'Not specified',
        sku: request.sku || '',
        barcode: request.barcode || '',
        quantity: Number(request.quantity || 0)
      }
    ];
  }

  return [];
}

export function stockRequestTotalQuantity(request) {
  const items = stockRequestItems(request);
  const total = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return total || Number(request?.quantity || 0);
}

export function stockRequestProductSummary(request) {
  const items = stockRequestItems(request);
  if (!items.length) {
    return request?.product || 'Not specified';
  }
  if (items.length === 1) {
    return items[0].product || 'Not specified';
  }
  return `${items.length} products`;
}

export function stockRequestLineSummary(request) {
  const items = stockRequestItems(request);
  if (!items.length) {
    return 'No items';
  }
  return items
    .map((item) => `${Number(item.quantity || 0)} x ${item.product || 'Not specified'}`)
    .join(', ');
}
