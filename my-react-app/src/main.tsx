// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import MainRouter from "./MainRouter";
import theme from "./theme"; // centralized MUI theme
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* resets browser defaults and applies MUI baseline */}
      <MainRouter />
    </ThemeProvider>
  </React.StrictMode>
);
