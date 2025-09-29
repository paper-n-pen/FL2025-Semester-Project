<<<<<<< HEAD
import { Routes, Route, Link } from 'react-router-dom';

function Home() {
  return <h1>Home Page</h1>;
}

function Login() {
  return <h1>Login Page</h1>;
}

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/login">Login</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
=======
import './App.css'

function App() {
  return (
    <>
      <h1>Vite + React</h1>
      {/* You can add your own component code here */}
    </>
  )
}

export default App

>>>>>>> main
