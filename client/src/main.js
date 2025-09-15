// Main entry point for the Pandora Box application

// Import styles
import './styles/theme.css';
import './styles/main.css';

// Import services
import './services/api.js';
import './services/auth.js';

// Import pages
import './pages/login.js';
import './dashboard.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Pandora Box application initialized');
  
  // Register service worker for PWA functionality
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
});