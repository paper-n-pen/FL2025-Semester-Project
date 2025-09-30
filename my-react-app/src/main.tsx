// my-react-app/src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import MainRouter from './MainRouter.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainRouter />
  </React.StrictMode>,
)