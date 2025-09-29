// Movies page functionality

import auth from './services/auth.js';
import { Navigation } from './components/navigation.js';
import { MoviesComponent } from './components/movies.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize navigation
  Navigation.init('app');
  
  // Initialize movies component
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    const movies = new MoviesComponent();
    movies.render(mainContent);
  }
});