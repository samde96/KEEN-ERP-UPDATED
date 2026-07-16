const statusClassMap = {
  Active: 'status-blue',
  Healthy: 'status-blue',
  Posted: 'status-blue',
  Success: 'status-blue',
  Approved: 'status-blue',
  Received: 'status-blue',
  Open: 'status-black',
  Failed: 'status-black',
  'Theft Alert': 'status-black',
  Urgent: 'status-black',
  Rejected: 'status-black',
  'Discrepancy Reported': 'status-black',
  'Discrepancy Resolved': 'status-blue',
  'Low Stock': 'status-outline',
  High: 'status-outline',
  Normal: 'status-muted',
  'Pending Review': 'status-outline',
  'Pending Manager Approval': 'status-outline',
  'Pending Write-off': 'status-outline',
  Pending: 'status-outline',
  Review: 'status-outline',
  'In Transit': 'status-outline-blue',
  'Under Review': 'status-outline-blue',
  Controlled: 'status-muted',
  Restricted: 'status-muted',
  Cancelled: 'status-muted'
};

function toDisplayStatus(status) {
  if (!status) return 'Unknown';

  return String(status)
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function StatusBadge({ status }) {
  const displayStatus = toDisplayStatus(status);
  return <span className={`status-badge ${statusClassMap[displayStatus] || 'status-muted'}`}>{displayStatus}</span>;
}
