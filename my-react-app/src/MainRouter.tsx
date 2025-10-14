// my-react-app/src/MainRouter.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import App from './App';
import Landing from './pages/Landing';
import StudentLogin from './pages/student/StudentLogin';
import StudentRegister from './pages/student/StudentRegister';
import StudentDashboard from './pages/student/StudentDashboard';
import ForgotPassword from './pages/student/ForgotPassword';
import TutorLogin from './pages/tutor/TutorLogin';
import TutorForgotPassword from './pages/tutor/TutorForgotPassword';
import TutorSetup from './pages/tutor/TutorSetup';
import TutorProfile from './pages/tutor/TutorProfile';
import TutorDashboard from './pages/tutor/TutorDashboard';
import SessionRoom from './pages/SessionRoom';
import Whiteboard from './Whiteboard';

function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Landing />} />
          <Route path="student/login" element={<StudentLogin />} />
          <Route path="student/register" element={<StudentRegister />} />
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="student/forgot-password" element={<ForgotPassword />} />
          <Route path="tutor/login" element={<TutorLogin />} />
          <Route path="tutor/forgot-password" element={<TutorForgotPassword />} />
          <Route path="tutor/setup" element={<TutorSetup />} />
          <Route path="tutor/profile" element={<TutorProfile />} />
          <Route path="tutor/dashboard" element={<TutorDashboard />} />
          <Route path="session/:sessionId" element={<SessionRoom />} />
          <Route path="whiteboard" element={<Whiteboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default MainRouter;