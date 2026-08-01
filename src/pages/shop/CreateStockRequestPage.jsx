import { useState } from 'react';
import { StockRequestForm } from '../../components/forms/StockRequestForm';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { transferService } from '../../services/transferService';

export function CreateStockRequestPage() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    setSubmitted('');
    setError('');
    const lines = (values.lines || [])
      .filter((line) => line.productId)
      .map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity || 0)
      }))
      .filter((line) => line.quantity > 0);

    if (!lines.length) {
      setError('Add at least one requested product.');
      return;
    }

    try {
      const response = await transferService.createRequest({
        shopId: values.shopId,
        lines,
        requestedBy: user?.name || 'Shop Manager',
        priority: values.priority
      });
      if (response.offlineQueued) {
        setSubmitted(response.message);
        return;
      }

      setSubmitted(`Request ${response.requestNumber} submitted with ${lines.length} product${lines.length === 1 ? '' : 's'}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to submit request.');
    }
  };

  return (
    <>
      <PageHeader title="Create stock request" description="Request inventory from the warehouse before shop stock reaches reorder level." />
      <section className="dashboard-grid">
        <div className="panel span-6" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Request</span>
              <h2>Stock request form</h2>
            </div>
          </div>
          {error ? <div className="alert alert-danger">{error}</div> : null}
          <StockRequestForm onSubmit={handleSubmit} />
        </div>
        <div className="panel span-6" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Rules</span>
              <h2>Approval flow</h2>
            </div>
          </div>
          <div className="workflow-list">
            <span>Shop request submitted</span>
            <span>Store Manager/Admin reviews</span>
            <span>Warehouse dispatches transfer</span>
            <span>Shop Manager receives and approves</span>
          </div>
          {submitted ? (
            <div className="alert alert-success mt-3">
              <i className="bi bi-check2-circle" aria-hidden="true" /> {submitted}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
