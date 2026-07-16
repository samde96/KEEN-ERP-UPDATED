import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';

export function NotFoundPage() {
  return (
    <section className="empty-state-page">
      <PageHeader title="Page not found" description="The page path does not match a configured system screen." />
      <Link className="btn btn-primary" to="/dashboard">
        <i className="bi bi-house" aria-hidden="true" /> Go to dashboard
      </Link>
    </section>
  );
}
