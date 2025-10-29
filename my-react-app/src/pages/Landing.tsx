// import React from 'react';
// import { Link } from 'react-router-dom';

// const Landing = () => {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Hero Section */}
//       <div className="flex flex-col items-center justify-center min-h-screen px-4">
//         {/* Logo and Title */}
//         <div className="text-center mb-16">
//           <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
//             <span className="text-3xl font-bold text-white">MT</span>
//           </div>
//           <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-6">
//             MicroTutor
//           </h1>
//           <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
//             Connect with expert tutors for instant, focused learning sessions
//           </p>
//         </div>
        
//         {/* Student and Tutor Sections */}
//         <div className="grid md:grid-cols-2 gap-12 max-w-6xl w-full">
//           {/* Student Section */}
//           <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
//             <div className="text-center mb-8">
//               <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//                 </svg>
//               </div>
//               <h3 className="text-3xl font-bold mb-4 text-gray-900">For Students</h3>
//               <p className="text-gray-600 mb-8 leading-relaxed">
//                 Get instant help with your studies from expert tutors
//               </p>
//             </div>
            
//             <div className="space-y-4">
//               <Link to="/student/login" className="block w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg text-center">
//                 Login
//               </Link>
//               <Link to="/student/register" className="block w-full px-6 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-center border-2 border-blue-600">
//                 Sign Up
//               </Link>
//             </div>
//           </div>

//           {/* Tutor Section */}
//           <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
//             <div className="text-center mb-8">
//               <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                 </svg>
//               </div>
//               <h3 className="text-3xl font-bold mb-4 text-gray-900">For Tutors</h3>
//               <p className="text-gray-600 mb-8 leading-relaxed">
//                 Share your expertise and earn money by helping students
//               </p>
//             </div>
            
//             <div className="space-y-4">
//               <Link to="/tutor/login" className="block w-full px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg text-center">
//                 Login
//               </Link>
//               <Link to="/tutor/setup" className="block w-full px-6 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-center border-2 border-green-600">
//                 Sign Up
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Landing;

// src/pages/Landing.tsx
// src/pages/Landing.tsx
import React from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Grid,
} from "@mui/material";
import { Link } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const Landing = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f5f7ff, #e8f0ff)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* ---------- Hero Section ---------- */}
        <Box textAlign="center" mb={8}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 80,
              height: 80,
              fontSize: 28,
              mx: "auto",
              mb: 3,
              boxShadow: 3,
            }}
          >
            MT
          </Avatar>
          <Typography
            variant="h2"
            fontWeight="bold"
            color="text.primary"
            gutterBottom
          >
            MicroTutor
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            maxWidth="600px"
            mx="auto"
          >
            Connect with expert tutors for instant, focused learning sessions
          </Typography>
        </Box>

        {/* ---------- Student + Tutor Sections ---------- */}
        <Grid
          component="div"
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
          gap={6}
        >
          {/* Student Section */}
          <Grid component="div">
            <Paper
              elevation={6}
              sx={{ p: 5, borderRadius: 4, textAlign: "center" }}
            >
              <Avatar
                sx={{
                  bgcolor: "info.main",
                  width: 64,
                  height: 64,
                  mb: 3,
                  mx: "auto",
                }}
              >
                <MenuBookIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                For Students
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>
                Get instant help with your studies from expert tutors.
              </Typography>
              <Button
                variant="contained"
                color="info"
                size="large"
                sx={{ mb: 2, width: "100%" }}
                component={Link}
                to="/student/login"
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="info"
                size="large"
                sx={{ width: "100%" }}
                component={Link}
                to="/student/register"
              >
                Sign Up
              </Button>
            </Paper>
          </Grid>

          {/* Tutor Section */}
          <Grid component="div">
            <Paper
              elevation={6}
              sx={{ p: 5, borderRadius: 4, textAlign: "center" }}
            >
              <Avatar
                sx={{
                  bgcolor: "success.main",
                  width: 64,
                  height: 64,
                  mb: 3,
                  mx: "auto",
                }}
              >
                <SchoolIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                For Tutors
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>
                Share your expertise and earn money by helping students.
              </Typography>
              <Button
                variant="contained"
                color="success"
                size="large"
                sx={{ mb: 2, width: "100%" }}
                component={Link}
                to="/tutor/login"
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="success"
                size="large"
                sx={{ width: "100%" }}
                component={Link}
                to="/tutor/setup"
              >
                Sign Up
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Landing;

