import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', form);
      login(response.data.token, response.data.user);
      toast(`Welcome to Investa, ${response.data.user?.name || 'investor'}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed. Please try again.');
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

        <h2>Create Your Account</h2>
        <p className="subtitle">Start tracking your portfolio for free</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              className="form-input"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

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
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
