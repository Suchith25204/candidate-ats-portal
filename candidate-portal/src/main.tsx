import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { initDB } from '@/utils/mockDb';
import './index.css';

import { StytchProvider } from '@stytch/react';
import { StytchUIClient } from '@stytch/vanilla-js';

// Initialize the local database before rendering the app
initDB();

// Initialize Stytch Client
// We use a fallback empty string to prevent crashing during build if env is missing
const stytchClient = new StytchUIClient(import.meta.env.VITE_STYTCH_PUBLIC_TOKEN || '');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StytchProvider stytch={stytchClient as any}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StytchProvider>
  </React.StrictMode>,
);