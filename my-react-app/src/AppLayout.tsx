import React, { useCallback, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Box, Container, AppBar, Toolbar, Typography, Avatar, Button } from "@mui/material";
import { clearAllAuthStates, getActiveAuthState, markActiveUserType } from "./utils/authStorage";

export default function AppLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleUnload = () => {
      const { user, userType } = getActiveAuthState();
      if (user && userType) {
        clearAllAuthStates();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  const handleHomeNavigation = useCallback(() => {
    const { user, userType } = getActiveAuthState();

    if (user && userType === "student") {
      markActiveUserType("student");
      navigate("/student/dashboard");
      return;
    }

    if (user && userType === "tutor") {
      markActiveUserType("tutor");
      navigate("/tutor/dashboard");
      return;
    }

    navigate("/");
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f5f7ff, #e8f0ff)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="static" elevation={0} color="transparent" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: "primary.main" }}>MT</Avatar>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              MicroTutor
            </Typography>
          </Box>
          <Button variant="outlined" color="primary" onClick={handleHomeNavigation}>
            Home
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 5, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
