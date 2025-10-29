// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import MainRouter from "./MainRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme"; // import the theme you just made

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* resets browser defaults and applies MUI baseline */}
      <MainRouter />
    </ThemeProvider>
  </React.StrictMode>
);
