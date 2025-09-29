/**
 * Media Details Component
 * Displays detailed information about a specific movie or TV show
 */

import api from '../services/api.js';

export class MediaDetailsComponent {
  constructor() {
    this.container = null;
    this.mediaType = null;
    this.mediaId = null;
    this.mediaData = null;
  }

  /**
   * Render the media details component
   * @param {HTMLElement} container - Container element
   * @param {string} mediaType - Type of media (movie or tv)
   * @param {string} mediaId - Media ID
   */
  async render(container, mediaType, mediaId) {
    this.container = container;
    this.mediaType = mediaType;
    this.mediaId = mediaId;
    
    // Show loading state
    container.innerHTML = `
      <div class="media-details-loading">
        <div class="loading-spinner">Loading media details...</div>
      </div>
    `;
    
    try {
      // Fetch media details
      const response = await api.get(`/media/details/${mediaType}/${mediaId}`);
      
      if (response.success && response.data) {
        this.mediaData = response.data;
        this.renderMediaDetails();
      } else {
        this.renderError('Failed to load media details');
      }
    } catch (error) {
      console.error('Error loading media details:', error);
      this.renderError('Failed to load media details');
    }
  }

  /**
   * Render media details content
   */
  renderMediaDetails() {
    const media = this.mediaData;
    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const runtime = media.runtime || (media.episode_run_time && media.episode_run_time[0]);
    const posterPath = media.poster_path 
      ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
      : './assets/placeholder-poster.svg';
    const backdropPath = media.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
      : null;

    const detailsHTML = `
      <div class="media-details">
        ${backdropPath ? `<div class="media-backdrop" style="background-image: url('${backdropPath}')"></div>` : ''}
        
        <div class="media-details-content">
          <div class="media-header">
            <div class="media-poster-large">
              <img src="${posterPath}" alt="${title}" />
            </div>
            
            <div class="media-info-main">
              <h1 class="media-title-large">${title}</h1>
              <div class="media-meta">
                <span class="media-year">${year}</span>
                ${runtime ? `<span class="media-runtime">${runtime} min</span>` : ''}
                <div class="media-rating-large">
                  <span class="rating-star">★</span>
                  <span class="rating-value">${media.vote_average?.toFixed(1) || 'N/A'}</span>
                  <span class="rating-count">(${media.vote_count || 0} votes)</span>
                </div>
              </div>
              
              ${media.genres ? `
                <div class="media-genres">
                  ${media.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                </div>
              ` : ''}
              
              <div class="media-actions">
                <!-- Torrent search functionality will be added later -->
              </div>
            </div>
          </div>
          
          ${media.overview ? `
            <div class="media-section">
              <h2>Overview</h2>
              <p class="media-overview">${media.overview}</p>
            </div>
          ` : ''}
          
          ${this.renderCastSection()}
          ${this.renderStreamingSection()}
        </div>
      </div>
    `;
    
    this.container.innerHTML = detailsHTML;
    this.initEventListeners();
  }

  /**
   * Render cast and crew section
   */
  renderCastSection() {
    if (!this.mediaData.credits || !this.mediaData.credits.cast) {
      return '';
    }

    const cast = this.mediaData.credits.cast.slice(0, 10); // Show first 10 cast members
    
    return `
      <div class="media-section">
        <h2>Cast</h2>
        <div class="cast-grid">
          ${cast.map(person => `
            <div class="cast-member">
              <div class="cast-photo">
                <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : './assets/placeholder-person.svg'}" 
                     alt="${person.name}" loading="lazy" />
              </div>
              <div class="cast-info">
                <h4 class="cast-name">${person.name}</h4>
                <p class="cast-character">${person.character}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render streaming providers section
   */
  renderStreamingSection() {
    if (!this.mediaData.streaming || !this.mediaData.streaming.length) {
      return '';
    }

    return `
      <div class="media-section">
        <h2>Available On</h2>
        <div class="streaming-providers">
          ${this.mediaData.streaming.map(provider => `
            <div class="streaming-provider">
              <img src="${provider.logo_path}" alt="${provider.provider_name}" />
              <span>${provider.provider_name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render error message
   */
  renderError(message) {
    this.container.innerHTML = `
      <div class="media-details-error">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="history.back()" class="btn btn-secondary">Go Back</button>
      </div>
    `;
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Event listeners will be added here when needed
  }
}