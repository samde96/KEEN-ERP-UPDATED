import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { ReportFilterPanel } from '../../components/reports/ReportFilterPanel';
import { reportService } from '../../services/reportService';
import { formatCurrency } from '../../utils/formatCurrency';

export function ShopReportsPage() {
  const [performanceByBranch, setPerformanceByBranch] = useState([]);

  useEffect(() => {
    let mounted = true;

    reportService.branchPerformance().then((rows) => {
      if (mounted) setPerformanceByBranch(rows);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHeader title="Shop reports" description="Sales, low stock, damaged goods, returns, and cashier performance by shop." />
      <ReportFilterPanel />
      <section className="panel" data-animate="fade-up">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Branch performance</span>
            <h2>Sales and profit</h2>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceByBranch} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecf2" />
              <XAxis dataKey="branch" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="sales" fill="#2b6afd" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" fill="#050505" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
