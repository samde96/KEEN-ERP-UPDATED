import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useBranch } from '../../hooks/useBranch';
import { salesService } from '../../services/salesService';
import { formatCurrency } from '../../utils/formatCurrency';

export function CashierShiftReportsPage() {
  const { currentLocation } = useBranch();
  const { data: cashierActivity } = useAsyncData(salesService.cashierActivity);
  const visibleActivity = currentLocation?.name
    ? cashierActivity.filter((row) => row.location === currentLocation.name)
    : cashierActivity;

  return (
    <>
      <PageHeader title="Cashier shift reports" description="Review shift status, terminal assignment, cash expected, and cashier variance." />
      <DataTable
        data={visibleActivity}
        columns={[
          { key: 'shiftNumber', label: 'Shift' },
          { key: 'cashier', label: 'Cashier' },
          { key: 'location', label: 'Location' },
          { key: 'terminal', label: 'Terminal' },
          { key: 'saleCount', label: 'Sales' },
          { key: 'totalSales', label: 'Total sales', render: (row) => formatCurrency(row.totalSales) },
          { key: 'cashSales', label: 'Cash sales', render: (row) => formatCurrency(row.cashSales) },
          { key: 'shift', label: 'Status', render: (row) => <StatusBadge status={row.shift} /> },
          { key: 'cashExpected', label: 'Cash expected', render: (row) => formatCurrency(row.cashExpected) },
          { key: 'cashCounted', label: 'Cash counted', render: (row) => formatCurrency(row.cashCounted) },
          { key: 'variance', label: 'Variance', render: (row) => formatCurrency(row.variance) }
        ]}
      />
    </>
  );
}
