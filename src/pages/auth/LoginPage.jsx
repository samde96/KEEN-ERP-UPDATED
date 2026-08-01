import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  const { isAuthenticated, loading, signIn, completeMfaSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    setError('');
    setMessage('');
    try {
      const result = await signIn(values);
      if (result?.mfaRequired) {
        setMfaChallenge({
          email: result.email || values.email,
          message: result.message || 'Verification code sent. Enter the code to finish signing in.'
        });
        setMessage(result.message || 'Verification code sent. Enter the code to finish signing in.');
        setMfaCode('');
        setRememberDevice(false);
        return;
      }

      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  const verifyMfa = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await completeMfaSignIn({ email: mfaChallenge.email, code: mfaCode, rememberDevice });
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  const resetMfa = () => {
    setMfaChallenge(null);
    setMfaCode('');
    setRememberDevice(false);
    setMessage('');
    setError('');
  };

  return (
    <main className="auth-shell login-shell">
      <section className="login-layout">
        <div className="login-panel">
          <div className="login-panel-inner">
            <div className="auth-brand login-brand">
              <BrandLogo />
              <div>
                <strong>Keen</strong>
                <span>Inventory and POS</span>
              </div>
            </div>
            <div className="auth-copy login-copy">
              <p className="page-kicker">Secure access</p>
              <h1>{mfaChallenge ? 'Verify sign in' : 'Sign in'}</h1>
              <p>{mfaChallenge ? 'Enter the verification code sent to your email.' : 'Use your account credentials to open the matching operating workspace.'}</p>
            </div>
            {mfaChallenge ? (
              <form className="auth-form" onSubmit={verifyMfa}>
                {message ? <div className="alert alert-success">{message}</div> : null}
                {error ? <div className="alert alert-danger">{error}</div> : null}
                <label className="form-label" htmlFor="mfa-login-email">
                  Email
                </label>
                <input id="mfa-login-email" className="form-control" type="email" value={mfaChallenge.email} disabled />
                <label className="form-label" htmlFor="mfa-login-code">
                  Verification code
                </label>
                <input
                  id="mfa-login-code"
                  className="form-control verification-code"
                  inputMode="numeric"
                  maxLength="6"
                  minLength="6"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
                <div className="form-check">
                  <input
                    id="remember-device"
                    className="form-check-input"
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(event) => setRememberDevice(event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="remember-device">
                    Remember this device
                  </label>
                </div>
                <button className="btn btn-primary btn-lg w-100" type="submit" disabled={loading || mfaCode.length !== 6}>
                  {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-shield-check" aria-hidden="true" />}
                  Verify and sign in
                </button>
                <button className="btn btn-link w-100" type="button" onClick={resetMfa}>
                  Use a different account
                </button>
              </form>
            ) : (
              <>
                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                  {error ? <div className="alert alert-danger">{error}</div> : null}
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input id="email" className="form-control" type="email" autoComplete="username" placeholder="name@company.com" {...register('email', { required: true })} />
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <div className="password-field">
                    <input
                      id="password"
                      className="form-control"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      {...register('password', { required: true })}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-controls="password"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                    </button>
                  </div>
                  <button className="btn btn-primary btn-lg w-100" type="submit" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-box-arrow-in-right" aria-hidden="true" />}
                    Sign in
                  </button>
                </form>
                <div className="auth-links">
                  <Link to="/forgot-password">Forgot password</Link>
                </div>
              </>
            )}
            <footer className="auth-footer login-footer">&copy; 2026, Powered by CEMTECH Technologies</footer>
          </div>
        </div>
        <aside className="login-visual">
          <img className="login-visual-image" src="/Image.png" alt="Store staff and a customer using a tablet at the counter" />
          <div className="login-visual-overlay">
            <p className="login-visual-title">Everything your business needs, in one place.</p>
            <p className="login-visual-body">Inventory, sales, branches and reporting simplified.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
