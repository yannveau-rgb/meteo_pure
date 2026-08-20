import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registration itself happens in index.html's inline <script>, as early as
// possible in the document so a push subscription can be established before
// React hydrates — that ordering mattered enough to be worth its own
// registration call, so it isn't repeated here. This only picks up the
// resulting registration to force an update check, and to reload once a new
// Service Worker takes control.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.update();
  }).catch(error => {
    console.warn('Service Worker update check failed:', error);
  });

  // Automatically refresh the page once the new Service Worker activates and takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
