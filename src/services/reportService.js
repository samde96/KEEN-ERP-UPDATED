import { apiClient } from './apiClient';

function getRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function normalizeSalesTransfers(rows) {
  return rows.map((row) => ({
    day: row.day || row.label || row.period || row.date || 'N/A',
    sales: Number(row.sales ?? row.salesAmount ?? row.totalSales ?? 0),
    transfers: Number(row.transfers ?? row.transferValue ?? row.totalTransfers ?? 0)
  }));
}

function normalizeCashierSales(rows) {
  return rows.map((row) => ({
    ...row,
    subtotal: Number(row.subtotal || 0),
    discountAmount: Number(row.discountAmount || 0),
    taxAmount: Number(row.taxAmount || 0),
    totalAmount: Number(row.totalAmount || 0),
    products: getRows(row.products).map((product) => ({
      ...product,
      quantity: Number(product.quantity || 0),
      unitPrice: Number(product.unitPrice || 0),
      discountAmount: Number(product.discountAmount || 0),
      lineTotal: Number(product.lineTotal || 0)
    }))
  }));
}

function normalizeProductPerformance(rows, performance) {
  return getRows(rows).map((row) => ({
    ...row,
    id: `${performance}-${row.productId || row.product || 'product'}`,
    performance,
    quantitySold: Number(row.quantitySold || 0),
    grossSales: Number(row.grossSales || 0),
    discounts: Number(row.discounts || 0),
    netSales: Number(row.netSales || 0),
    saleCount: Number(row.saleCount || 0)
  }));
}

function reportParams(params = {}) {
  const nextParams = {};
  if (params.range) nextParams.range = params.range;
  if (params.from) nextParams.from = params.from;
  if (params.to) nextParams.to = params.to;
  if (params.locationId && params.locationId !== 'all') nextParams.locationId = params.locationId;
  return nextParams;
}

export const reportService = {
  async dashboardSeries(params = { range: '7d' }) {
    try {
      const response = await apiClient.get('/reports/sales-transfers-summary', { params: reportParams(params) });
      const rows = normalizeSalesTransfers(getRows(response.data));

      if (typeof response.data === 'string') {
        throw new Error('Reports API returned a non-JSON response.');
      }

      return { rows, source: 'database' };
    } catch {
      return { rows: [], source: 'database' };
    }
  },

  async branchPerformance(params = {}) {
    try {
      const response = await apiClient.get('/reports/branch-performance', { params: reportParams(params) });
      return getRows(response.data);
    } catch {
      return [];
    }
  },

  async cashierSales(params = {}) {
    try {
      const response = await apiClient.get('/reports/cashier-sales', { params: reportParams(params) });
      return normalizeCashierSales(getRows(response.data));
    } catch {
      return [];
    }
  },

  async posProductPerformance(params = {}) {
    try {
      const response = await apiClient.get('/reports/pos-product-performance', { params: reportParams(params) });
      return {
        bestPerforming: normalizeProductPerformance(response.data?.bestPerforming, 'Best'),
        leastPerforming: normalizeProductPerformance(response.data?.leastPerforming, 'Least')
      };
    } catch {
      return { bestPerforming: [], leastPerforming: [] };
    }
  }
};
