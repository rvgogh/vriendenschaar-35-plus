import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    .then(async (registration) => {
      console.log('Service Worker registered:', registration);
      await registration.update();
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

createRoot(document.getElementById("root")!).render(<App />);
