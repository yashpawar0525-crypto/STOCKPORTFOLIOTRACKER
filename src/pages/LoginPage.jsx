import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', form);
      login(response.data.token, response.data.user);
      toast(`Welcome back, ${response.data.user?.name || 'investor'}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-icon">🚀</div>
          <span className="brand-name">Investa</span>
        </div>

        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your account to continue</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-input"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-link">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
