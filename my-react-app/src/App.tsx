import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Whiteboard from './Whiteboard';
import './App.css';

function Home() {
  return (
    <>
      <h1>Home</h1>
      <Link to="/whiteboard">Go to Whiteboard</Link>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/whiteboard" element={<Whiteboard />} />
      </Routes>
    </Router>
  );
}

export default App;

