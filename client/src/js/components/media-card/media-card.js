/**
 * Media Card Component
 * Displays media content (movies/TV shows) with poster, title, and metadata
 */

export class MediaCard {
  constructor(mediaData, options = {}) {
    this.mediaData = mediaData;
    this.options = {
      showActions: true,
      showGenres: true,
      imageSize: 'w500',
      ...options
    };
    this.element = null;
    this.template = null;
  }

  /**
   * Load the HTML template
   */
  async loadTemplate() {
    if (this.template) return this.template;
    
    try {
      const response = await fetch('/src/components/media-card/media-card.html');
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      this.template = await response.text();
      return this.template;
    } catch (error) {
      console.error('Error loading media card template:', error);
      return this.getDefaultTemplate();
    }
  }

  /**
   * Get default template as fallback
   */
  getDefaultTemplate() {
    return `
      <article class="media-card" role="article">
        <div class="media-card-poster-container">
          <img class="media-card-poster" src="" alt="" loading="lazy">
          <div class="media-card-overlay">
            <button class="play-btn" aria-label="View details">
              <span class="icon">▶</span>
            </button>
            <div class="media-card-actions">
              <button class="action-btn download-btn" title="Download" aria-label="Download">
                <span class="icon">📥</span>
              </button>
            </div>
          </div>
        </div>
        <div class="media-card-content">
          <h3 class="media-card-title"></h3>
          <div class="media-card-meta">
            <span class="media-card-year"></span>
            <span class="media-card-rating">
              <span class="rating-icon">⭐</span>
              <span class="rating-value"></span>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Create and render the media card element
   */
  async render() {
    const template = await this.loadTemplate();
    
    // Create element from template
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template;
    this.element = tempDiv.firstElementChild;

    // Populate with data
    this.populateData();
    
    // Setup event listeners
    this.setupEventListeners();

    return this.element;
  }

  /**
   * Populate the card with media data
   */
  populateData() {
    if (!this.element || !this.mediaData) return;

    const {
      title,
      name,
      poster_path,
      release_date,
      first_air_date,
      vote_average,
      genre_ids,
      genres,
      id,
      media_type
    } = this.mediaData;

    // Set title (movies use 'title', TV shows use 'name')
    const mediaTitle = title || name || 'Unknown Title';
    const titleElement = this.element.querySelector('.media-card-title');
    if (titleElement) {
      titleElement.textContent = mediaTitle;
      titleElement.title = mediaTitle; // Tooltip for long titles
    }

    // Set poster image
    const posterElement = this.element.querySelector('.media-card-poster');
    if (posterElement) {
      if (poster_path) {
        const imageUrl = this.buildImageUrl(poster_path, this.options.imageSize);
        posterElement.src = imageUrl;
        posterElement.alt = `${mediaTitle} poster`;
      } else {
        posterElement.src = this.getPlaceholderImage();
        posterElement.alt = `${mediaTitle} - No poster available`;
      }
    }

    // Set release year
    const yearElement = this.element.querySelector('.media-card-year');
    if (yearElement) {
      const releaseDate = release_date || first_air_date;
      const year = releaseDate ? new Date(releaseDate).getFullYear() : 'Unknown';
      yearElement.textContent = year;
    }

    // Set rating
    const ratingElement = this.element.querySelector('.rating-value');
    if (ratingElement && vote_average) {
      ratingElement.textContent = vote_average.toFixed(1);
    } else if (ratingElement) {
      ratingElement.textContent = 'N/A';
    }

    // Set genres (if enabled and available)
    if (this.options.showGenres) {
      this.populateGenres(genre_ids || genres);
    }

    // Hide actions if disabled
    if (!this.options.showActions) {
      const actionsElement = this.element.querySelector('.media-card-actions');
      if (actionsElement) {
        actionsElement.style.display = 'none';
      }
    }

    // Store media data on element for event handlers
    this.element.dataset.mediaId = id;
    this.element.dataset.mediaType = media_type || (title ? 'movie' : 'tv');
  }

  /**
   * Populate genres
   */
  populateGenres(genreData) {
    const genresContainer = this.element.querySelector('.media-card-genres');
    if (!genresContainer || !genreData) return;

    // Clear existing genres
    genresContainer.innerHTML = '';

    // Handle both genre IDs and genre objects
    let genreNames = [];
    if (Array.isArray(genreData)) {
      if (genreData.length > 0 && typeof genreData[0] === 'object') {
        // Array of genre objects
        genreNames = genreData.slice(0, 2).map(genre => genre.name);
      } else {
        // Array of genre IDs - would need genre mapping
        // For now, skip genre display for IDs
        return;
      }
    }

    // Create genre tags
    genreNames.forEach(genreName => {
      const genreTag = document.createElement('span');
      genreTag.className = 'genre-tag';
      genreTag.textContent = genreName;
      genresContainer.appendChild(genreTag);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.element) return;

    // Main card click - view details
    this.element.addEventListener('click', (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.action-btn')) return;
      
      this.handleViewDetails();
    });

    // Download button
    const downloadBtn = this.element.querySelector('.download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleDownload();
      });
    }

    // Favorite button
    const favoriteBtn = this.element.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFavorite();
      });
    }

    // Play button
    const playBtn = this.element.querySelector('.play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleViewDetails();
      });
    }
  }

  /**
   * Handle view details action
   */
  handleViewDetails() {
    const mediaId = this.element.dataset.mediaId;
    const mediaType = this.element.dataset.mediaType;
    
    console.log('View details:', { mediaId, mediaType, data: this.mediaData });
    
    // Dispatch custom event for parent components to handle
    const event = new CustomEvent('media-card:view-details', {
      detail: {
        mediaId,
        mediaType,
        mediaData: this.mediaData
      },
      bubbles: true
    });
    
    this.element.dispatchEvent(event);
  }

  /**
   * Handle download action
   */
  handleDownload() {
    const mediaId = this.element.dataset.mediaId;
    const mediaType = this.element.dataset.mediaType;
    
    console.log('Download:', { mediaId, mediaType, data: this.mediaData });
    
    // Dispatch custom event
    const event = new CustomEvent('media-card:download', {
      detail: {
        mediaId,
        mediaType,
        mediaData: this.mediaData
      },
      bubbles: true
    });
    
    this.element.dispatchEvent(event);
  }

  /**
   * Handle favorite action
   */
  handleFavorite() {
    const mediaId = this.element.dataset.mediaId;
    const mediaType = this.element.dataset.mediaType;
    
    console.log('Favorite:', { mediaId, mediaType, data: this.mediaData });
    
    // Toggle favorite state
    const favoriteBtn = this.element.querySelector('.favorite-btn');
    if (favoriteBtn) {
      const isFavorited = favoriteBtn.classList.toggle('favorited');
      favoriteBtn.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
    }
    
    // Dispatch custom event
    const event = new CustomEvent('media-card:favorite', {
      detail: {
        mediaId,
        mediaType,
        mediaData: this.mediaData,
        isFavorited: favoriteBtn?.classList.contains('favorited')
      },
      bubbles: true
    });
    
    this.element.dispatchEvent(event);
  }

  /**
   * Build TMDB image URL
   */
  buildImageUrl(path, size = 'w500') {
    if (!path) return this.getPlaceholderImage();
    
    const baseUrl = 'https://image.tmdb.org/t/p/';
    return `${baseUrl}${size}${path}`;
  }

  /**
   * Get placeholder image for missing posters
   */
  getPlaceholderImage() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.element) {
      this.element.classList.add('loading');
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.element) {
      this.element.classList.remove('loading');
    }
  }

  /**
   * Show error state
   */
  showError() {
    if (this.element) {
      this.element.classList.add('error');
    }
  }

  /**
   * Update media data and re-render
   */
  updateData(newMediaData) {
    this.mediaData = newMediaData;
    if (this.element) {
      this.populateData();
    }
  }

  /**
   * Destroy the component and cleanup
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.mediaData = null;
  }
}

export default MediaCard;