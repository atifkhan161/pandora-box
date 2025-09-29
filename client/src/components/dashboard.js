/**
 * Dashboard Component
 * Displays latest movies and TV shows with clickable media cards
 */

import api from '../services/api.js';

export class DashboardComponent {
  constructor() {
    this.container = null;
  }

  /**
   * Render the dashboard component
   * @param {HTMLElement} container - Container element
   */
  async render(container) {
    this.container = container;
    
    // Create dashboard layout
    const dashboardHTML = `
      <div class="dashboard-content">
        <div class="content-header">
          <h1>Dashboard</h1>
          <p>Discover the latest movies and TV shows</p>
        </div>
        
        <div class="media-sections">
          <section class="media-section">
            <h2>Latest Movies</h2>
            <div id="latest-movies" class="media-grid loading">
              <div class="loading-spinner">Loading...</div>
            </div>
          </section>
          
          <section class="media-section">
            <h2>Latest TV Shows</h2>
            <div id="latest-tvshows" class="media-grid loading">
              <div class="loading-spinner">Loading...</div>
            </div>
          </section>
        </div>
      </div>
    `;
    
    container.innerHTML = dashboardHTML;
    
    // Load media data
    await this.loadLatestMovies();
    await this.loadLatestTvShows();
  }

  /**
   * Load latest movies from API
   */
  async loadLatestMovies() {
    try {
      const response = await api.get('/media/latest-movies');
      const moviesContainer = document.getElementById('latest-movies');
      
      if (response.success && response.data.results) {
        moviesContainer.className = 'media-grid';
        moviesContainer.innerHTML = this.renderMediaCards(response.data.results, 'movie');
      } else {
        moviesContainer.innerHTML = '<p class="error-message">Failed to load movies</p>';
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      const moviesContainer = document.getElementById('latest-movies');
      moviesContainer.innerHTML = '<p class="error-message">Failed to load movies</p>';
    }
  }

  /**
   * Load latest TV shows from API
   */
  async loadLatestTvShows() {
    try {
      const response = await api.get('/media/latest-tvshows');
      const tvContainer = document.getElementById('latest-tvshows');
      
      if (response.success && response.data.results) {
        tvContainer.className = 'media-grid';
        tvContainer.innerHTML = this.renderMediaCards(response.data.results, 'tv');
      } else {
        tvContainer.innerHTML = '<p class="error-message">Failed to load TV shows</p>';
      }
    } catch (error) {
      console.error('Error loading TV shows:', error);
      const tvContainer = document.getElementById('latest-tvshows');
      tvContainer.innerHTML = '<p class="error-message">Failed to load TV shows</p>';
    }
  }

  /**
   * Render media cards
   * @param {Array} mediaItems - Array of media items
   * @param {string} mediaType - Type of media (movie or tv)
   * @returns {string} HTML string for media cards
   */
  renderMediaCards(mediaItems, mediaType) {
    return mediaItems.map(item => {
      const title = item.title || item.name;
      const releaseDate = item.release_date || item.first_air_date;
      const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
      const posterPath = item.poster_path 
        ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
        : './assets/placeholder-poster.svg';
      
      return `
        <div class="media-card" data-media-type="${mediaType}" data-media-id="${item.id}">
          <div class="media-poster">
            <img src="${posterPath}" alt="${title}" loading="lazy" />
            <div class="media-overlay">
              <button class="play-btn">View Details</button>
            </div>
          </div>
          <div class="media-info">
            <h3 class="media-title">${title}</h3>
            <p class="media-year">${year}</p>
            <div class="media-rating">
              <span class="rating-star">★</span>
              <span class="rating-value">${item.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    if (!this.container) return;

    // Add click listeners to media cards
    this.container.addEventListener('click', (e) => {
      const mediaCard = e.target.closest('.media-card');
      if (mediaCard) {
        const mediaType = mediaCard.dataset.mediaType;
        const mediaId = mediaCard.dataset.mediaId;
        
        // Navigate to media details page
        window.location.href = `media-details.html?type=${mediaType}&id=${mediaId}`;
      }
    });
  }
}