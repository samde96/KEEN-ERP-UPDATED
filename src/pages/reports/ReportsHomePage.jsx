import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { ReportFilterPanel, defaultReportFilters, reportPeriodLabel } from '../../components/reports/ReportFilterPanel';
import { reportService } from '../../services/reportService';
import { exportCsvReport } from '../../utils/exportCsv';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

function productSummary(products = []) {
  if (!products.length) return 'No product lines recorded';

  const visible = products.slice(0, 3).map((product) => `${product.product} (${product.quantity})`);
  const overflow = products.length > visible.length ? `, +${products.length - visible.length} more` : '';
  return `${visible.join(', ')}${overflow}`;
}

function formatReportRange(filters) {
  const from = filters.from || 'Start';
  const to = filters.to || 'Today';
  return `${from} to ${to}`;
}

function formatReportPeriod(filters) {
  return filters.periodLabel || reportPeriodLabel(filters.period);
}

function reportCsvFilename(filters) {
  const period = filters.period || 'custom';
  const from = filters.from || 'start';
  const to = filters.to || 'today';
  return `keen-${period}-reports-${from}-to-${to}.csv`;
}

export function ReportsHomePage({ title = 'Reports center' }) {
  const [filters, setFilters] = useState(() => defaultReportFilters());
  const [reportSeries, setReportSeries] = useState([]);
  const [performanceByBranch, setPerformanceByBranch] = useState([]);
  const [cashierSales, setCashierSales] = useState([]);
  const [productPerformance, setProductPerformance] = useState({ bestPerforming: [], leastPerforming: [] });

  useEffect(() => {
    let mounted = true;

    reportService.dashboardSeries({ range: filters.period || 'custom', ...filters }).then((result) => {
      if (mounted) setReportSeries(result.rows);
    });
    reportService.branchPerformance(filters).then((rows) => {
      if (mounted) setPerformanceByBranch(rows);
    });
    reportService.cashierSales(filters).then((rows) => {
      if (mounted) setCashierSales(rows);
    });
    reportService.posProductPerformance(filters).then((rows) => {
      if (mounted) setProductPerformance(rows);
    });

    return () => {
      mounted = false;
    };
  }, [filters]);

  const totals = useMemo(
    () => ({
      sales: reportSeries.reduce((sum, row) => sum + Number(row.sales || 0), 0),
      transfers: reportSeries.reduce((sum, row) => sum + Number(row.transfers || 0), 0),
      profit: performanceByBranch.reduce((sum, row) => sum + Number(row.profit || 0), 0),
      loss: performanceByBranch.reduce((sum, row) => sum + Number(row.loss || 0), 0)
    }),
    [performanceByBranch, reportSeries]
  );

  const hasReportData = Boolean(reportSeries.length
    || performanceByBranch.length
    || cashierSales.length
    || productPerformance.bestPerforming.length
    || productPerformance.leastPerforming.length);

  const exportReportsCsv = () => {
    const generatedAt = new Date().toISOString();

    exportCsvReport(reportCsvFilename(filters), {
      title: 'KEEN Inventory Reports Center',
      subtitle: `${formatReportPeriod(filters)} report, ${formatReportRange(filters)}`,
      metadata: [
        { label: 'Report', value: title },
        { label: 'Period', value: formatReportPeriod(filters) },
        { label: 'Date range', value: formatReportRange(filters) },
        { label: 'Branch', value: filters.locationName || 'All locations' },
        { label: 'Generated', value: formatDate(generatedAt) }
      ],
      summary: [
        { label: 'Sales', value: formatCurrency(totals.sales) },
        { label: 'Profit', value: formatCurrency(totals.profit) },
        { label: 'Transfers', value: formatCurrency(totals.transfers) },
        { label: 'Loss', value: formatCurrency(totals.loss) }
      ],
      sections: [
        {
          title: `${formatReportPeriod(filters)} Performance Trend`,
          rows: reportSeries,
          columns: [
            { key: 'day', label: 'Day' },
            { key: 'sales', label: 'Sales', value: (row) => formatCurrency(row.sales) },
            { key: 'transfers', label: 'Transfers', value: (row) => formatCurrency(row.transfers) }
          ],
          emptyText: 'No daily performance records found.'
        },
        {
          title: 'Branch Profit And Loss',
          rows: performanceByBranch,
          columns: [
            { key: 'branch', label: 'Branch' },
            { key: 'sales', label: 'Sales', value: (row) => formatCurrency(row.sales) },
            { key: 'profit', label: 'Profit', value: (row) => formatCurrency(row.profit) },
            { key: 'loss', label: 'Loss', value: (row) => formatCurrency(row.loss) }
          ],
          emptyText: 'No branch performance records found.'
        },
        {
          title: 'Cashier Sales With Products',
          rows: cashierSales,
          columns: [
            { key: 'receiptNumber', label: 'Receipt' },
            { key: 'soldAt', label: 'Sold at', value: (row) => formatDate(row.soldAt) },
            { key: 'cashier', label: 'Cashier' },
            { key: 'branch', label: 'Branch' },
            { key: 'products', label: 'Products', value: (row) => productSummary(row.products) },
            { key: 'subtotal', label: 'Subtotal', value: (row) => formatCurrency(row.subtotal) },
            { key: 'discountAmount', label: 'Discount', value: (row) => formatCurrency(row.discountAmount) },
            { key: 'taxAmount', label: 'Tax', value: (row) => formatCurrency(row.taxAmount) },
            { key: 'totalAmount', label: 'Total', value: (row) => formatCurrency(row.totalAmount) }
          ],
          emptyText: 'No cashier sales found.'
        },
        {
          title: 'Best Performing Products',
          rows: productPerformance.bestPerforming,
          columns: [
            { key: 'product', label: 'Product' },
            { key: 'sku', label: 'SKU' },
            { key: 'barcode', label: 'Barcode' },
            { key: 'quantitySold', label: 'Qty sold' },
            { key: 'saleCount', label: 'Sales' },
            { key: 'grossSales', label: 'Gross sales', value: (row) => formatCurrency(row.grossSales) },
            { key: 'discounts', label: 'Discounts', value: (row) => formatCurrency(row.discounts) },
            { key: 'netSales', label: 'Net sales', value: (row) => formatCurrency(row.netSales) }
          ],
          emptyText: 'No best performing product records found.'
        },
        {
          title: 'Least Performing Products',
          rows: productPerformance.leastPerforming,
          columns: [
            { key: 'product', label: 'Product' },
            { key: 'sku', label: 'SKU' },
            { key: 'barcode', label: 'Barcode' },
            { key: 'quantitySold', label: 'Qty sold' },
            { key: 'saleCount', label: 'Sales' },
            { key: 'grossSales', label: 'Gross sales', value: (row) => formatCurrency(row.grossSales) },
            { key: 'discounts', label: 'Discounts', value: (row) => formatCurrency(row.discounts) },
            { key: 'netSales', label: 'Net sales', value: (row) => formatCurrency(row.netSales) }
          ],
          emptyText: 'No least performing product records found.'
        }
      ]
    });
  };

  return (
    <>
      <PageHeader
        title={title}
        description="View weekly, monthly, quarterly, yearly, and custom reports for sales, stock, transfers, profit and loss, cashier performance, branch performance, theft, loss, and audit activity."
        actions={
          <div className="btn-group">
            <button className="btn btn-outline-primary" type="button" onClick={exportReportsCsv} disabled={!hasReportData}>
              <i className="bi bi-filetype-csv" aria-hidden="true" /> CSV
            </button>
          </div>
        }
      />
      <ReportFilterPanel onApply={setFilters} />
      <section className="report-print-target">
        <header className="report-print-head">
          <div>
            <span>KEEN Inventory</span>
            <h1>{title}</h1>
          </div>
          <dl>
            <div>
              <dt>Period</dt>
              <dd>{formatReportPeriod(filters)}</dd>
            </div>
            <div>
              <dt>Date range</dt>
              <dd>{formatReportRange(filters)}</dd>
            </div>
            <div>
              <dt>Branch</dt>
              <dd>{filters.locationName || 'All locations'}</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{formatDate(new Date().toISOString())}</dd>
            </div>
          </dl>
        </header>
        <section className="stat-grid four">
          <StatCard icon="bi-cash-coin" title="Sales" value={formatCurrency(totals.sales)} tone="success" />
          <StatCard icon="bi-box-seam" title="Profit" value={formatCurrency(totals.profit)} />
          <StatCard icon="bi-arrow-left-right" title="Transfers" value={formatCurrency(totals.transfers)} tone="info" />
          <StatCard icon="bi-exclamation-triangle" title="Loss" value={formatCurrency(totals.loss)} tone="danger" />
        </section>
        <section className="dashboard-grid">
          <div className="panel span-7" data-animate="fade-up">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Trend</span>
                <h2>{formatReportPeriod(filters)} performance</h2>
              </div>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportSeries} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecf2" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stroke="#2b6afd" fill="transparent" strokeWidth={3} />
                  <Area type="monotone" dataKey="transfers" stroke="#050505" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel span-5" data-animate="fade-up">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Branches</span>
                <h2>Profit and loss</h2>
              </div>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceByBranch} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecf2" />
                  <XAxis dataKey="branch" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="profit" fill="#2b6afd" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="loss" fill="#050505" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
        <DataTable
          data={performanceByBranch}
          columns={[
            { key: 'branch', label: 'Branch' },
            { key: 'sales', label: 'Sales', render: (row) => formatCurrency(row.sales) },
            { key: 'profit', label: 'Profit', render: (row) => formatCurrency(row.profit) },
            { key: 'loss', label: 'Loss', render: (row) => formatCurrency(row.loss) }
          ]}
        />
        <section className="dashboard-grid mt-4">
          <div className="panel span-12" data-animate="fade-up">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Cashiers</span>
                <h2>Sales by cashier with products</h2>
              </div>
            </div>
            <DataTable
              data={cashierSales}
              emptyText="No cashier sales found."
              columns={[
                {
                  key: 'receiptNumber',
                  label: 'Receipt',
                  render: (row) => (
                    <span className="table-stack">
                      <span>
                        <strong>{row.receiptNumber}</strong>
                        <small>{formatDate(row.soldAt)}</small>
                      </span>
                    </span>
                  )
                },
                { key: 'cashier', label: 'Cashier' },
                { key: 'branch', label: 'Branch' },
                {
                  key: 'products',
                  label: 'Products',
                  render: (row) => (
                    <span className="table-stack">
                      {row.products.length ? (
                        row.products.map((product) => (
                          <span key={`${row.id}-${product.productId}`}>
                            <strong>{product.product}</strong>
                            <small>
                              {product.quantity} x {formatCurrency(product.unitPrice)} = {formatCurrency(product.lineTotal)}
                            </small>
                          </span>
                        ))
                      ) : (
                        <span>
                          <strong>No product lines recorded</strong>
                        </span>
                      )}
                    </span>
                  )
                },
                { key: 'discountAmount', label: 'Discount', render: (row) => formatCurrency(row.discountAmount) },
                { key: 'taxAmount', label: 'Tax', render: (row) => formatCurrency(row.taxAmount) },
                { key: 'totalAmount', label: 'Total', render: (row) => formatCurrency(row.totalAmount) }
              ]}
            />
          </div>
        </section>
        <section className="dashboard-grid">
          <div className="panel span-6" data-animate="fade-up">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">POS products</span>
                <h2>Best performing products</h2>
              </div>
            </div>
            <DataTable
              data={productPerformance.bestPerforming}
              emptyText="No POS product sales found."
              columns={[
                {
                  key: 'product',
                  label: 'Product',
                  render: (row) => (
                    <span className="table-stack">
                      <span>
                        <strong>{row.product}</strong>
                        <small>{row.sku || row.barcode}</small>
                      </span>
                    </span>
                  )
                },
                { key: 'quantitySold', label: 'Qty sold' },
                { key: 'saleCount', label: 'Sales' },
                { key: 'netSales', label: 'Net sales', render: (row) => formatCurrency(row.netSales) }
              ]}
            />
          </div>
          <div className="panel span-6" data-animate="fade-up">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">POS products</span>
                <h2>Least performing products</h2>
              </div>
            </div>
            <DataTable
              data={productPerformance.leastPerforming}
              emptyText="No POS product sales found."
              columns={[
                {
                  key: 'product',
                  label: 'Product',
                  render: (row) => (
                    <span className="table-stack">
                      <span>
                        <strong>{row.product}</strong>
                        <small>{row.sku || row.barcode}</small>
                      </span>
                    </span>
                  )
                },
                { key: 'quantitySold', label: 'Qty sold' },
                { key: 'saleCount', label: 'Sales' },
                { key: 'netSales', label: 'Net sales', render: (row) => formatCurrency(row.netSales) }
              ]}
            />
          </div>
        </section>
      </section>
    </>
  );
}
