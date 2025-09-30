// my-react-app/src/App.tsx
import { Routes, Route, Link } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard'; // You’ll create this next

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
