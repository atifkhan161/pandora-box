// Main entry point for the Pandora Box application

// Import styles
import './styles/theme.css';
import './styles/main.css';
import './styles/media.css';

// Import services
import './services/api.js';
import './services/auth.js';



import { Navigation } from './components/navigation.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  Navigation.init();

  const hamburgerBtn = document.getElementById('hamburger-btn');
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      Navigation.toggleNavigation();
    });
  }
});