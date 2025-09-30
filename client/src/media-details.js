// Media Details page functionality

import auth from './services/auth.js';
import themeManager from './services/theme.js';
import { Navigation } from './components/navigation.js';
import { MediaDetailsComponent } from './components/media-details.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = '/';
    return;
  }

  // Initialize theme manager
  themeManager.init();
  
  // Initialize navigation
  Navigation.init('app');
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const mediaType = urlParams.get('type');
  const mediaId = urlParams.get('id');
  
  // Validate parameters
  if (!mediaType || !mediaId) {
    document.querySelector('.main-content').innerHTML = `
      <div class="media-details-error">
        <h2>Invalid Parameters</h2>
        <p>Media type and ID are required.</p>
        <button onclick="history.back()" class="btn btn-secondary">Go Back</button>
      </div>
    `;
    return;
  }
  
  if (!['movie', 'tv'].includes(mediaType)) {
    document.querySelector('.main-content').innerHTML = `
      <div class="media-details-error">
        <h2>Invalid Media Type</h2>
        <p>Media type must be 'movie' or 'tv'.</p>
        <button onclick="history.back()" class="btn btn-secondary">Go Back</button>
      </div>
    `;
    return;
  }
  
  // Initialize media details component
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    const mediaDetails = new MediaDetailsComponent();
    await mediaDetails.render(mainContent, mediaType, mediaId);
  }
});