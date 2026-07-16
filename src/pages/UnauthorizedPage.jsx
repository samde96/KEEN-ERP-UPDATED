import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';

export function UnauthorizedPage() {
  return (
    <section className="empty-state-page">
      <PageHeader title="Access denied" description="Your current role does not include permission for this workspace." />
      <Link className="btn btn-primary" to="/dashboard">
        <i className="bi bi-arrow-left" aria-hidden="true" /> Return to dashboard
      </Link>
    </section>
  );
}
