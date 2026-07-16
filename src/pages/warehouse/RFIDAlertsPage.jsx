import { PageHeader } from '../../components/common/PageHeader';
import { RFIDAlertPanel } from '../../components/inventory/RFIDAlertPanel';

export function RFIDAlertsPage() {
  return (
    <>
      <PageHeader title="RFID and theft alerts" description="Review unauthorized RFID movement, loss incidents, variance alerts, and investigation state." />
      <RFIDAlertPanel />
    </>
  );
}
