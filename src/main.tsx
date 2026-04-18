import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initServiceWorker } from './utils/serviceWorker';

// Service Worker registrieren und iOS-Reaktivierung einrichten
initServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
