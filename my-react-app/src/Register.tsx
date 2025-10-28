//my-react-app/src/Register.tsx

import { useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { storeAuthState, markActiveUserType } from './utils/authStorage';
import type { SupportedUserType } from './utils/authStorage';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/register', { username, email, password });
      const { token, user } = res.data;

      if (token && user) {
        const normalizedType = (user.userType || 'student') as SupportedUserType;
        storeAuthState(normalizedType, token, user);
        markActiveUserType(normalizedType);
        navigate(normalizedType === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
        return;
      }

      setSuccess('Registration successful! Please log in.');
      setError('');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Registration failed');
      } else {
        setError('An unexpected error occurred.');
      }
      setSuccess('');
    }
  };

  return (
    <form onSubmit={handleRegister} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </form>
  );
}

export default Register;
