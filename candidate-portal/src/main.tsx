import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { initDB } from '@/utils/mockDb';
import './index.css';

import { StytchB2BProvider } from '@stytch/react/b2b';
import { StytchB2BUIClient } from '@stytch/vanilla-js/b2b';

// Initialize the local database before rendering the app
initDB();

// Initialize Stytch Client
// We use a fallback empty string to prevent crashing during build if env is missing
const stytchClient = new StytchB2BUIClient(import.meta.env.VITE_STYTCH_PUBLIC_TOKEN || '');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StytchB2BProvider stytch={stytchClient as any}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StytchB2BProvider>
  </React.StrictMode>,
);