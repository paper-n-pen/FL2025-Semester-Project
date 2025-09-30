// my-react-app/src/Login.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { isAxiosError } from 'axios';

interface LoginResponse {
  token: string;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // <-- add this

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post<LoginResponse>('/api/login', { email, password });
      const token = res.data.token;
      localStorage.setItem('token', token);
      navigate('/dashboard'); // <-- redirect after successful login
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Login failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <form onSubmit={handleLogin}>
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
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default Login;
