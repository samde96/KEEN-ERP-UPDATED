import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../../components/common/BrandLogo';
import { authService } from '../../services/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setError('This reset link is missing its token. Request a new password reset link.');
      setMessage('');
      return;
    }

    const formData = new FormData(event.currentTarget);
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setError('Passwords do not match.');
      setMessage('');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      setMessage(await authService.resetPassword({ token, password: formData.get('password') }));
      event.currentTarget.reset();
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
        <h1>Set new password</h1>
        {message ? <div className="alert alert-success">{message}</div> : null}
        {error || !token ? <div className="alert alert-danger">{error || 'This reset link is missing its token. Request a new password reset link.'}</div> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="password">
            New password
          </label>
          <input id="password" name="password" className="form-control" type="password" required minLength="8" />
          <label className="form-label" htmlFor="confirm-password">
            Confirm password
          </label>
          <input id="confirm-password" name="confirmPassword" className="form-control" type="password" required minLength="8" />
          <button className="btn btn-primary w-100" type="submit" disabled={submitting || !token}>
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
        <Link to="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
