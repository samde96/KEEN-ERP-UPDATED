import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  const { isAuthenticated, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
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
    try {
      await signIn(values);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <BrandLogo />
          <div>
            <strong>Keen</strong>
            <span>Inventory and POS</span>
          </div>
        </div>
        <div className="auth-copy">
          <p className="page-kicker">Secure access</p>
          <h1>Sign in</h1>
          <p>Use your account credentials to open the matching operating workspace.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          {error ? <div className="alert alert-danger">{error}</div> : null}
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input id="email" className="form-control" type="email" {...register('email', { required: true })} />
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input id="password" className="form-control" type="password" {...register('password', { required: true })} />
          <button className="btn btn-primary btn-lg w-100" type="submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <i className="bi bi-box-arrow-in-right" aria-hidden="true" />}
            Sign in
          </button>
        </form>
        <div className="auth-links">
          <Link to="/forgot-password">Forgot password</Link>
          <Link to="/mfa">MFA verification</Link>
        </div>
      </section>
    </main>
  );
}
