import React, { useState } from 'react';
import { authAPI } from '../../services/api';

const RegisterAdmin = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await authAPI.registerAdmin(form);
      setMessage('Admin registered successfully!');
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to register admin');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Register New Admin</h2>
      {message && <div>{message}</div>}
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" />
        <input name="password" value={form.password} onChange={handleChange} placeholder="Password" required type="password" />
        <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Admin'}</button>
      </form>
    </div>
  );
};

export default RegisterAdmin; 