// my-react-app/src/MainRouter.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import App from './App';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import Whiteboard from './Whiteboard';
import CreatePost from './CreatePost';

function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<h1>Home Page</h1>} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="whiteboard" element={<Whiteboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default MainRouter;