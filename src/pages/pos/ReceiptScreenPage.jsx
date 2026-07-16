import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ReceiptPreview } from '../../components/pos/ReceiptPreview';

export function ReceiptScreenPage() {
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    try {
      setReceipt(JSON.parse(localStorage.getItem('keen.inventory.lastReceipt') || 'null'));
    } catch {
      setReceipt(null);
    }
  }, []);

  return (
    <>
      <PageHeader
        title="Receipt preview"
        description="Thermal and standard receipt preview prepared for print, SMS, or email delivery."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => window.print()} disabled={!receipt}>
            <i className="bi bi-printer" aria-hidden="true" /> Print
          </button>
        }
      />
      <section className="dashboard-grid">
        <div className="panel span-4">
          <ReceiptPreview receipt={receipt} />
        </div>
      </section>
    </>
  );
}
