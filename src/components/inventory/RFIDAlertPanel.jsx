import { useEffect, useRef, useState } from 'react';
import { pulseAlert } from '../../animations/gsapAnimations';
import { DataTable } from '../common/DataTable';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';
import { securityService } from '../../services/securityService';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export function RFIDAlertPanel() {
  const urgentRef = useRef(null);
  const [formValues, setFormValues] = useState({
    tagOrBarcode: '',
    locationId: '',
    quantity: 1,
    detectionMethod: 'RFID_EXIT_GATE',
    responsibleUser: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: theftIncidents, loading, reload } = useAsyncData(securityService.theftIncidents);
  const { data: locations } = useAsyncData(catalogService.locations);

  useEffect(() => {
    pulseAlert(urgentRef.current);
  }, [theftIncidents]);

  const updateField = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const reportIncident = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await securityService.reportRfidIncident(formValues);
      setMessage(`${response.reference} created and notification email queued for configured recipients.`);
      setFormValues({
        tagOrBarcode: '',
        locationId: formValues.locationId,
        quantity: 1,
        detectionMethod: 'RFID_EXIT_GATE',
        responsibleUser: '',
        notes: ''
      });
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to create RFID alert.');
    }
  };

  const updateStatus = async (incident, status) => {
    setMessage('');
    setError('');
    try {
      await securityService.updateIncidentStatus(incident.id, status, {
        notes: status === 'RESOLVED' ? 'Reviewed and closed from RFID alerts.' : 'Investigation started from RFID alerts.'
      });
      setMessage(`${incident.incidentNumber} updated.`);
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to update RFID alert.');
    }
  };

  const sendTestEmail = async () => {
    setMessage('');
    setError('');
    try {
      const response = await securityService.sendTestEmail();
      setMessage(`Test email requested for ${response.recipients} recipient${response.recipients === 1 ? '' : 's'}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to send test email.');
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="panel span-5" data-animate="fade-up">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Exit gate</span>
            <h2>Unauthorized movement</h2>
          </div>
          <i className="bi bi-upc-scan panel-icon" aria-hidden="true" />
        </div>
        {message ? <div className="alert alert-success">{message}</div> : null}
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <form className="app-form-grid" onSubmit={reportIncident}>
          <div className="col-span-2">
            <label className="form-label" htmlFor="rfid-code">
              RFID tag, barcode, or SKU
            </label>
            <input
              id="rfid-code"
              className="form-control"
              value={formValues.tagOrBarcode}
              onChange={(event) => updateField('tagOrBarcode', event.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label" htmlFor="rfid-location">
              Store location
            </label>
            <select
              id="rfid-location"
              className="form-select"
              value={formValues.locationId}
              onChange={(event) => updateField('locationId', event.target.value)}
              required
            >
              <option value="">Select location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="rfid-quantity">
              Quantity
            </label>
            <input
              id="rfid-quantity"
              className="form-control"
              type="number"
              min="1"
              value={formValues.quantity}
              onChange={(event) => updateField('quantity', event.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label" htmlFor="rfid-method">
              Detection method
            </label>
            <select id="rfid-method" className="form-select" value={formValues.detectionMethod} onChange={(event) => updateField('detectionMethod', event.target.value)}>
              <option value="RFID_EXIT_GATE">RFID exit gate</option>
              <option value="BARCODE_EXIT_SCAN">Barcode exit scan</option>
              <option value="MANUAL_SECURITY_REPORT">Manual security report</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="rfid-user">
              Responsible user
            </label>
            <input id="rfid-user" className="form-control" value={formValues.responsibleUser} onChange={(event) => updateField('responsibleUser', event.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="form-label" htmlFor="rfid-notes">
              Notes
            </label>
            <input id="rfid-notes" className="form-control" value={formValues.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </div>
          <div className="col-span-2 d-flex justify-content-between gap-2">
            <button className="btn btn-outline-primary" type="button" onClick={sendTestEmail}>
              <i className="bi bi-envelope-check" aria-hidden="true" /> Test email
            </button>
            <button className="btn btn-primary" type="submit" disabled={!locations.length}>
              <i className="bi bi-exclamation-triangle" aria-hidden="true" /> Create alert
            </button>
          </div>
        </form>
      </div>
      <div className="panel span-7" data-animate="fade-up">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Security</span>
            <h2>RFID and theft alerts</h2>
          </div>
          <i className="bi bi-shield-lock panel-icon" aria-hidden="true" />
        </div>
        <div ref={urgentRef}>
          <DataTable
            data={theftIncidents}
            emptyText={loading ? 'Loading RFID alerts...' : 'No RFID alerts found.'}
            columns={[
              {
                key: 'incidentNumber',
                label: 'Incident',
                render: (row) => (
                  <span className="table-stack">
                    <strong>{row.incidentNumber}</strong>
                    <small>{formatDate(row.detectedAt)}</small>
                  </span>
                )
              },
              {
                key: 'product',
                label: 'Product',
                render: (row) => (
                  <span className="table-stack">
                    <strong>{row.product}</strong>
                    <small>{row.tag}</small>
                  </span>
                )
              },
              { key: 'location', label: 'Location' },
              { key: 'quantity', label: 'Qty' },
              { key: 'value', label: 'Value', render: (row) => formatCurrency(row.value) },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              {
                key: 'actions',
                label: '',
                render: (row) => (
                  <div className="return-action-buttons">
                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => updateStatus(row, 'UNDER_REVIEW')} disabled={row.status === 'Under Review'}>
                      Review
                    </button>
                    <button className="btn btn-sm btn-primary" type="button" onClick={() => updateStatus(row, 'RESOLVED')} disabled={row.status === 'Resolved'}>
                      Resolve
                    </button>
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </section>
  );
}
