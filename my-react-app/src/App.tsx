import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import Whiteboard from './Whiteboard';
import './App.css';

function Home() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/register">Register</Link> | <Link to="/login">Login</Link> | <Link to="/whiteboard">Whiteboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/whiteboard" element={<Whiteboard />} />
      </Routes>
    </div>
  );
}

export default App;
