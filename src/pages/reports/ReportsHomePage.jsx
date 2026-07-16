import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { ReportFilterPanel } from '../../components/reports/ReportFilterPanel';
import { reportService } from '../../services/reportService';
import { exportCsv } from '../../utils/exportCsv';
import { formatCurrency } from '../../utils/formatCurrency';

export function ReportsHomePage({ title = 'Reports center' }) {
  const [reportSeries, setReportSeries] = useState([]);
  const [performanceByBranch, setPerformanceByBranch] = useState([]);

  useEffect(() => {
    let mounted = true;

    reportService.dashboardSeries({ range: '7d' }).then((result) => {
      if (mounted) setReportSeries(result.rows);
    });
    reportService.branchPerformance().then((rows) => {
      if (mounted) setPerformanceByBranch(rows);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(
    () => ({
      sales: reportSeries.reduce((sum, row) => sum + Number(row.sales || 0), 0),
      transfers: reportSeries.reduce((sum, row) => sum + Number(row.transfers || 0), 0),
      profit: performanceByBranch.reduce((sum, row) => sum + Number(row.profit || 0), 0),
      loss: performanceByBranch.reduce((sum, row) => sum + Number(row.loss || 0), 0)
    }),
    [performanceByBranch, reportSeries]
  );

  const reportRows = useMemo(
    () => [
      ...reportSeries.map((row) => ({ type: 'daily', ...row })),
      ...performanceByBranch.map((row) => ({ type: 'branch', ...row }))
    ],
    [performanceByBranch, reportSeries]
  );

  return (
    <>
      <PageHeader
        title={title}
        description="Filter sales, stock, transfers, profit and loss, cashier performance, branch performance, theft, loss, and audit reports."
        actions={
          <div className="btn-group">
            <button className="btn btn-outline-primary" type="button" onClick={() => exportCsv('reports.csv', reportRows)} disabled={!reportRows.length}>
              <i className="bi bi-filetype-csv" aria-hidden="true" /> CSV
            </button>
            <button className="btn btn-primary" type="button" onClick={() => window.print()}>
              <i className="bi bi-printer" aria-hidden="true" /> Print
            </button>
          </div>
        }
      />
      <ReportFilterPanel />
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
              <h2>Weekly performance</h2>
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
    </>
  );
}
