import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/register', form);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-card">
      <h2>Create Your Account</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" type="text" placeholder="Full name" required value={form.name} onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" required value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" required value={form.password} onChange={handleChange} />
        {error && <p>{error}</p>}
        <button className="primary-btn" type="submit">Sign Up</button>
      </form>
      <p className="link-text">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default SignupPage;
