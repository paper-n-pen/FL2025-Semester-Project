import React from "react";
import { Outlet } from "react-router-dom";
import { Box, Container, AppBar, Toolbar, Typography, Avatar, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout() {
    const navigate = useNavigate();
  
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
            <Button variant="outlined" color="primary" onClick={() => navigate("/")}>
              Home
            </Button>
          </Toolbar>
        </AppBar>
  
        <Container sx={{ py: 5, flex: 1 }}>
          <Outlet /> {/* nested pages will render here */}
        </Container>
      </Box>
    );
  }
  