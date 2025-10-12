// my-react-app/src/App.tsx

import { Outlet, Link } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | 
        <Link to="/dashboard">Dashboard</Link> | 
        <Link to="/whiteboard">Whiteboard</Link> | 
        <Link to="/login">Login</Link> | 
        <Link to="/register">Register</Link> |
        <Link to="/create-post">Create Post</Link> |
        <Link to="/posts">Posts</Link> |
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;