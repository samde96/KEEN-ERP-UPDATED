import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { RFIDAlertPanel } from '../../components/inventory/RFIDAlertPanel';
import { useAsyncData } from '../../hooks/useAsyncData';
import { securityService } from '../../services/securityService';

const controls = [
  { label: 'MFA for Admin and Store Manager', status: 'Enabled', icon: 'bi-phone' },
  { label: 'Manager PIN for refunds and high discounts', status: 'Required', icon: 'bi-key' },
  { label: 'POS auto-lock after inactivity', status: '15 minutes', icon: 'bi-clock-history' },
  { label: 'Failed login lockout', status: '5 attempts', icon: 'bi-shield-exclamation' }
];

function parseEmailLines(value) {
  return String(value || '')
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function SecuritySettings() {
  const [recipientEmails, setRecipientEmails] = useState('');
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const {
    data: emailSettings,
    loading,
    error,
    reload,
    setData: setEmailSettings
  } = useAsyncData(securityService.notificationEmailSettings, { recipientEmails: [] });

  useEffect(() => {
    setRecipientEmails((emailSettings.recipientEmails || []).join('\n'));
  }, [emailSettings]);

  const saveNotificationEmails = async (event) => {
    event.preventDefault();
    setMessage('');
    setSaveError('');
    try {
      const response = await securityService.saveNotificationEmailSettings({
        recipientEmails: parseEmailLines(recipientEmails)
      });
      setMessage(response.offlineQueued ? response.message : 'Notification email settings saved.');
      if (response.offlineQueued) {
        return;
      }
      setEmailSettings(response);
      reload();
    } catch (requestError) {
      setSaveError(requestError.response?.data?.detail || requestError.message || 'Unable to save notification email settings.');
    }
  };

  const sendTestEmail = async () => {
    setMessage('');
    setSaveError('');
    setTestingEmail(true);
    try {
      const response = await securityService.sendTestEmail();
      const recipientCount = Number(response.recipients || 0);
      setMessage(response.offlineQueued ? response.message : `Test email queued for ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}.`);
    } catch (requestError) {
      setSaveError(requestError.response?.data?.detail || requestError.message || 'Unable to send test email.');
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <>
      <PageHeader title="Security settings" description="Manage security controls, notification recipients, audit trails, RFID response, and POS safeguards." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error || saveError ? <div className="alert alert-danger">{error || saveError}</div> : null}
      <section className="dashboard-grid">
        <div className="panel span-6" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Controls</span>
              <h2>Policy status</h2>
            </div>
          </div>
          <div className="settings-list">
            {controls.map((control) => (
              <article className="settings-row" key={control.label}>
                <i className={`bi ${control.icon}`} aria-hidden="true" />
                <span>{control.label}</span>
                <strong>{control.status}</strong>
              </article>
            ))}
          </div>
        </div>
        <div className="panel span-6" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Notifications</span>
              <h2>Email recipients</h2>
            </div>
          </div>
          {loading ? (
            <div className="chart-loading">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Loading recipients
            </div>
          ) : (
            <form className="app-form-grid" onSubmit={saveNotificationEmails}>
              <div className="col-span-2">
                <label className="form-label" htmlFor="notification-emails">
                  Notification email addresses
                </label>
                <textarea
                  id="notification-emails"
                  className="form-control"
                  rows="5"
                  value={recipientEmails}
                  onChange={(event) => setRecipientEmails(event.target.value)}
                  placeholder="admin@keen.test"
                />
              </div>
              <div className="col-span-2 d-flex flex-wrap justify-content-end gap-2">
                <button className="btn btn-outline-primary" type="button" onClick={sendTestEmail} disabled={testingEmail}>
                  <i className="bi bi-envelope-check" aria-hidden="true" /> Send test
                </button>
                <button className="btn btn-primary" type="submit">
                  <i className="bi bi-check2-circle" aria-hidden="true" /> Save emails
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="span-12">
          <RFIDAlertPanel />
        </div>
      </section>
    </>
  );
}
