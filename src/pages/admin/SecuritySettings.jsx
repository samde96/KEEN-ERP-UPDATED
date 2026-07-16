import { PageHeader } from '../../components/common/PageHeader';
import { RFIDAlertPanel } from '../../components/inventory/RFIDAlertPanel';

const controls = [
  { label: 'MFA for Admin and Store Manager', status: 'Enabled', icon: 'bi-phone' },
  { label: 'Manager PIN for refunds and high discounts', status: 'Required', icon: 'bi-key' },
  { label: 'POS auto-lock after inactivity', status: '15 minutes', icon: 'bi-clock-history' },
  { label: 'Failed login lockout', status: '5 attempts', icon: 'bi-shield-exclamation' }
];

export function SecuritySettings() {
  return (
    <>
      <PageHeader title="Security settings" description="Frontend controls prepared for backend policy enforcement, audit trails, RFID response, and POS safeguards." />
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
        <div className="span-6">
          <RFIDAlertPanel />
        </div>
      </section>
    </>
  );
}
