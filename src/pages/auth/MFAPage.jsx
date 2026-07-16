import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../components/common/BrandLogo';
import { authService } from '../../services/authService';

export function MFAPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = async () => {
    setSendingCode(true);
    setMessage('');
    setError('');

    try {
      setMessage(await authService.requestMfaCode({ email }));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setVerifying(true);
    setMessage('');
    setError('');

    try {
      setMessage(await authService.verifyMfaCode({ email, code }));
      setCode('');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel narrow">
        <div className="auth-brand">
          <BrandLogo />
          <strong>Keen</strong>
        </div>
        <h1>MFA verification</h1>
        {message ? <div className="alert alert-success">{message}</div> : null}
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="mfa-email">
            Email
          </label>
          <div className="input-group">
            <input
              id="mfa-email"
              className="form-control"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
            />
            <button className="btn btn-outline-secondary" type="button" onClick={handleSendCode} disabled={sendingCode || !email}>
              {sendingCode ? 'Sending...' : 'Send code'}
            </button>
          </div>
          <label className="form-label" htmlFor="mfa-code">
            Verification code
          </label>
          <input
            id="mfa-code"
            className="form-control verification-code"
            inputMode="numeric"
            maxLength="6"
            minLength="6"
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
          <button className="btn btn-primary w-100" type="submit" disabled={verifying || !email || code.length !== 6}>
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <Link to="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
