// TV Shows page functionality

import auth from './services/auth.js';
import { Navigation } from './components/navigation.js';
import { TvShowsComponent } from './components/tvshows.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize navigation
  Navigation.init('app');
  
  // Initialize TV shows component
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    const tvShows = new TvShowsComponent();
    tvShows.render(mainContent);
  }
});