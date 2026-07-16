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

export const reportService = {
  async dashboardSeries(params = { range: '7d' }) {
    try {
      const response = await apiClient.get('/reports/sales-transfers-summary', { params });
      const rows = normalizeSalesTransfers(getRows(response.data));

      if (typeof response.data === 'string') {
        throw new Error('Reports API returned a non-JSON response.');
      }

      return { rows, source: 'database' };
    } catch {
      return { rows: [], source: 'database' };
    }
  },

  async branchPerformance() {
    try {
      const response = await apiClient.get('/reports/branch-performance');
      return getRows(response.data);
    } catch {
      return [];
    }
  }
};
