// Main entry point for Vite
import './css/components.css';
import './css/style.css';
import './css/themes.css';

// Import manifest for PWA
import './manifest.json';

// Register service worker
import './sw-register.js';

// Import utility modules
import './js/utils/api-client.js';
import './js/utils/auth.js';
import './js/utils/container-manager.js';
import './js/utils/db.js';
import './js/utils/download-manager.js';
import './js/utils/file-manager.js';
import './js/utils/helpers.js';
import './js/utils/media-manager.js';
import './js/utils/notification-manager.js';
import './js/utils/router.js';
import './js/utils/settings-manager.js';
import './js/utils/theme-manager.js';

// Import component modules
import './js/components/ui-components.js';
import './js/components/page-components.js';

// Import main app
import { PandoraBoxApp } from './js/app.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the app
  const app = new PandoraBoxApp();
  app.init();
  
  // Make app available globally for debugging
  window.pandoraApp = app;
});