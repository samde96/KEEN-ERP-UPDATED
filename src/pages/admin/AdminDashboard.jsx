import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { auditService } from '../../services/auditService';
import { reportService } from '../../services/reportService';
import { securityService } from '../../services/securityService';
import { transferService } from '../../services/transferService';
import { exportCsv } from '../../utils/exportCsv';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const { data: stockRequests } = useAsyncData(transferService.requests);
  const { data: stockTransfers } = useAsyncData(transferService.transfers);
  const { data: auditLogs } = useAsyncData(auditService.logs);
  const { data: theftIncidents } = useAsyncData(securityService.theftIncidents);

  useEffect(() => {
    let mounted = true;

    reportService.dashboardSeries({ range: '7d' }).then((result) => {
      if (!mounted) return;
      setAnalytics(result.rows);
      setAnalyticsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const analyticsTotals = useMemo(
    () =>
      analytics.reduce(
        (totals, row) => ({
          sales: totals.sales + row.sales,
          transfers: totals.transfers + row.transfers
        }),
        { sales: 0, transfers: 0 }
      ),
    [analytics]
  );

  const exportRows = useMemo(
    () => [
      ...analytics.map((row) => ({ type: 'analytics', ...row })),
      ...stockRequests.map((row) => ({ type: 'stock_request', ...row })),
      ...stockTransfers.map((row) => ({ type: 'stock_transfer', ...row })),
      ...theftIncidents.map((row) => ({ type: 'security_incident', ...row }))
    ],
    [analytics, stockRequests, stockTransfers, theftIncidents]
  );

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="System control view across branches, warehouses, reports, security events, and audit activity."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => exportCsv('admin-summary.csv', exportRows)} disabled={!exportRows.length}>
            <i className="bi bi-download" aria-hidden="true" /> Export summary
          </button>
        }
      />
      <section className="stat-grid four">
        <StatCard icon="bi-cash-coin" title="Sales" value={formatCurrency(analyticsTotals.sales)} subtext="Selected reporting window" />
        <StatCard icon="bi-boxes" title="Stock requests" value={stockRequests.length} subtext="Current request records" tone="success" />
        <StatCard icon="bi-arrow-left-right" title="Transfers" value={stockTransfers.length} subtext="Current transfer records" tone="info" />
        <StatCard icon="bi-exclamation-triangle" title="Security alerts" value={theftIncidents.length} subtext="Open or under review" tone="danger" />
      </section>
      <section className="dashboard-grid">
        <div className="panel span-8" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Analytics</span>
              <h2>Sales and transfers</h2>
            </div>
            <span className="chart-source">Database</span>
          </div>
          <div className="chart-summary">
            <div>
              <span className="chart-dot blue" />
              <small>Sales</small>
              <strong>{formatCurrency(analyticsTotals.sales)}</strong>
            </div>
            <div>
              <span className="chart-dot black" />
              <small>Transfers</small>
              <strong>{formatCurrency(analyticsTotals.transfers)}</strong>
            </div>
          </div>
          {analyticsLoading ? (
            <div className="chart-loading">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              Loading analytics
            </div>
          ) : (
            <div className="chart-box simple-chart">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics} margin={{ top: 12, right: 8, left: -8, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecf2" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#f1f3f8' }} />
                  <Bar dataKey="sales" name="Sales" fill="#2b6afd" radius={[6, 6, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="transfers" name="Transfers" fill="#050505" radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="panel span-4" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Approval queue</span>
              <h2>Stock requests</h2>
            </div>
            <i className="bi bi-clipboard-check panel-icon" aria-hidden="true" />
          </div>
          <div className="stack-list">
            {stockRequests.map((request) => (
              <article className="stack-row" key={request.id}>
                <span>
                  <strong>{request.requestNumber}</strong>
                  <small>{request.shop}</small>
                </span>
                <StatusBadge status={request.status} />
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="dashboard-grid">
        <div className="panel span-7" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Movement</span>
              <h2>Recent transfers</h2>
            </div>
          </div>
          <DataTable
            data={stockTransfers}
            columns={[
              { key: 'transferNumber', label: 'Transfer' },
              { key: 'destination', label: 'Destination' },
              { key: 'totalUnits', label: 'Units' },
              { key: 'value', label: 'Value', render: (row) => formatCurrency(row.value) },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
            ]}
          />
        </div>
        <div className="panel span-5" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Audit</span>
              <h2>Latest activity</h2>
            </div>
          </div>
          <div className="stack-list">
            {auditLogs.slice(0, 4).map((log) => (
              <article className="stack-row" key={log.id}>
                <span>
                  <strong>{log.action}</strong>
                  <small>
                    {log.user} - {formatDate(log.at)}
                  </small>
                </span>
                <StatusBadge status={log.status} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
