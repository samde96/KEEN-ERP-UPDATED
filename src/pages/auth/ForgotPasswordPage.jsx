import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../components/common/BrandLogo';
import { authService } from '../../services/authService';

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      setMessage(await authService.forgotPassword({ email }));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel narrow">
        <div className="auth-brand">
          <BrandLogo />
          <strong>Keen</strong>
        </div>
        <h1>Password reset</h1>
        {message ? <div className="alert alert-success">{message}</div> : null}
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="reset-email">
            Email
          </label>
          <input id="reset-email" name="email" className="form-control" type="email" placeholder="name@company.com" required />
          <button className="btn btn-primary w-100" type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <Link to="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
