// my-react-app/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MainRouter from './MainRouter';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <MainRouter />
  </StrictMode>
);
