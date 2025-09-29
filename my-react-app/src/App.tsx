// my-react-app/src/App.tsx

import { Routes, Route, Link } from 'react-router-dom';
import Register from './Register';
import Login from './Login';

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/Register">Register</Link> | <Link to="/login">Login</Link>
      </nav>
    </div>
  );
}

export default App;

