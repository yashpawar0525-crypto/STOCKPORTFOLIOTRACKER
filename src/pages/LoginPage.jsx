import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', form);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-card">
      <h2>Welcome Back</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" required value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" required value={form.password} onChange={handleChange} />
        {error && <p>{error}</p>}
        <button className="primary-btn" type="submit">Login</button>
      </form>
      <p className="link-text">Need an account? <Link to="/signup">Create one</Link></p>
    </div>
  );
};

export default LoginPage;
