/**
 * Media Details Page Controller
 * Displays detailed information about movies and TV shows
 */
import BasePage from './base-page.js';
import { mediaService } from '../services/media.js';
import MediaCard from '../components/media-card/media-card.js';

class MediaDetailsPage extends BasePage {
  constructor() {
    super();
    this.templatePath = '/src/pages/media-details.html';
    this.mediaId = null;
    this.mediaType = null;
    this.mediaData = null;
    this.currentTab = 'cast';
  }

  /**
   * Setup page-specific logic
   */
  async setupPage() {
    // Get media ID and type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.mediaId = urlParams.get('id');
    this.mediaType = urlParams.get('type') || 'movie';

    if (!this.mediaId) {
      this.showError('Media ID not provided');
      return;
    }

    this.setTitle(`Loading... - Media Details`);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Back button
    const backBtn = this.querySelector('.back-btn');
    if (backBtn) {
      this.addEventListener(backBtn, 'click', () => {
        this.goBack();
      });
    }

    // Download button
    const downloadBtn = this.querySelector('.download-btn');
    if (downloadBtn) {
      this.addEventListener(downloadBtn, 'click', () => {
        this.handleDownload();
      });
    }

    // Favorite button
    const favoriteBtn = this.querySelector('.favorite-btn');
    if (favoriteBtn) {
      this.addEventListener(favoriteBtn, 'click', () => {
        this.handleFavorite();
      });
    }

    // Share button
    const shareBtn = this.querySelector('.share-btn');
    if (shareBtn) {
      this.addEventListener(shareBtn, 'click', () => {
        this.showShareModal();
      });
    }

    // Cast/Crew tabs
    const tabButtons = this.querySelectorAll('.cast-tabs .tab-btn');
    tabButtons.forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Share modal events
    this.setupShareModalEvents();

    // Video card events
    this.addEventListener(this.container, 'click', (e) => {
      const videoCard = e.target.closest('.video-card');
      if (videoCard) {
        this.playVideo(videoCard.dataset.videoKey, videoCard.dataset.videoSite);
      }
    });

    // Media card events for similar/recommendations
    this.addEventListener(this.container, 'media-card:view-details', (e) => {
      this.handleRelatedMediaClick(e.detail);
    });
  }

  /**
   * Setup share modal event listeners
   */
  setupShareModalEvents() {
    // Share modal close
    const modalClose = this.querySelector('.modal-close');
    if (modalClose) {
      this.addEventListener(modalClose, 'click', () => {
        this.hideShareModal();
      });
    }

    // Share modal overlay click
    const shareModal = this.querySelector('#share-modal');
    if (shareModal) {
      this.addEventListener(shareModal, 'click', (e) => {
        if (e.target === shareModal) {
          this.hideShareModal();
        }
      });
    }

    // Share options
    const shareOptions = this.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
      this.addEventListener(option, 'click', (e) => {
        const shareType = e.currentTarget.dataset.share;
        this.handleShare(shareType);
      });
    });

    // Copy URL button
    const copyBtn = this.querySelector('.copy-btn');
    if (copyBtn) {
      this.addEventListener(copyBtn, 'click', () => {
        this.copyUrl();
      });
    }
  }

  /**
   * Load initial data
   */
  async loadData() {
    try {
      this.showPageLoading('Loading media details...');

      // Load main media details
      await this.loadMediaDetails();

      // Load additional data in parallel
      await Promise.all([
        this.loadStreamingAvailability(),
        this.loadCredits(),
        this.loadVideos(),
        this.loadSimilarContent(),
        this.loadRecommendations()
      ]);

      this.hidePageLoading();
      
    } catch (error) {
      console.error('Error loading media details:', error);
      this.hidePageLoading();
      this.showError('Failed to load media details');
    }
  }

  /**
   * Load main media details
   */
  async loadMediaDetails() {
    try {
      this.mediaData = await mediaService.getDetails(this.mediaType, this.mediaId);
      
      if (!this.mediaData) {
        throw new Error('Media not found');
      }

      this.populateMediaDetails();
      
    } catch (error) {
      console.error('Error loading media details:', error);
      throw error;
    }
  }

  /**
   * Populate media details in the UI
   */
  populateMediaDetails() {
    const {
      title,
      name,
      tagline,
      overview,
      poster_path,
      backdrop_path,
      release_date,
      first_air_date,
      runtime,
      episode_run_time,
      vote_average,
      status,
      genres
    } = this.mediaData;

    // Set page title
    const mediaTitle = title || name;
    this.setTitle(`${mediaTitle} - Media Details`);

    // Update title and tagline
    const titleElement = this.querySelector('.media-title');
    if (titleElement) {
      titleElement.textContent = mediaTitle;
    }

    const taglineElement = this.querySelector('.media-tagline');
    if (taglineElement) {
      taglineElement.textContent = tagline || '';
      taglineElement.style.display = tagline ? 'block' : 'none';
    }

    // Update images
    const posterElement = this.querySelector('.media-poster');
    if (posterElement && poster_path) {
      posterElement.src = mediaService.buildPosterUrl(poster_path, 'w500');
      posterElement.alt = `${mediaTitle} poster`;
    }

    const backdropElement = this.querySelector('.backdrop-image');
    if (backdropElement && backdrop_path) {
      backdropElement.src = mediaService.buildBackdropUrl(backdrop_path, 'w1280');
      backdropElement.alt = `${mediaTitle} backdrop`;
    }

    // Update meta information
    const releaseDateElement = this.querySelector('.release-date');
    if (releaseDateElement) {
      const releaseDate = release_date || first_air_date;
      releaseDateElement.textContent = releaseDate ? 
        new Date(releaseDate).toLocaleDateString() : 'Unknown';
    }

    const runtimeElement = this.querySelector('.runtime');
    if (runtimeElement) {
      const mediaRuntime = runtime || (episode_run_time && episode_run_time[0]);
      runtimeElement.textContent = mediaRuntime ? 
        mediaService.formatRuntime(mediaRuntime) : 'Unknown';
    }

    const ratingElement = this.querySelector('.rating');
    if (ratingElement) {
      ratingElement.textContent = vote_average ? 
        mediaService.formatRating(vote_average) : 'N/A';
    }

    const statusElement = this.querySelector('.status');
    if (statusElement) {
      statusElement.textContent = status || 'Unknown';
    }

    // Update overview
    const overviewElement = this.querySelector('.media-overview');
    if (overviewElement) {
      overviewElement.textContent = overview || 'No overview available.';
    }

    // Update genres
    this.populateGenres(genres);
  }

  /**
   * Populate genres
   */
  populateGenres(genres) {
    const genresContainer = this.querySelector('.media-genres');
    if (!genresContainer || !genres) return;

    genresContainer.innerHTML = '';

    genres.forEach(genre => {
      const genreTag = document.createElement('span');
      genreTag.className = 'genre-tag';
      genreTag.textContent = genre.name;
      genresContainer.appendChild(genreTag);
    });
  }

  /**
   * Load streaming availability
   */
  async loadStreamingAvailability() {
    try {
      const streamingData = await mediaService.getStreamingAvailability(this.mediaType, this.mediaId);
      this.populateStreamingProviders(streamingData);
      
    } catch (error) {
      console.error('Error loading streaming availability:', error);
      this.showNoStreamingProviders();
    }
  }

  /**
   * Populate streaming providers
   */
  populateStreamingProviders(streamingData) {
    const providersContainer = this.querySelector('#streaming-providers');
    if (!providersContainer) return;

    providersContainer.innerHTML = '';

    // Get providers for the user's region (default to US)
    const results = streamingData?.results;
    const regionData = results?.US || results?.[Object.keys(results)[0]];

    if (!regionData) {
      this.showNoStreamingProviders();
      return;
    }

    // Combine all provider types
    const allProviders = [
      ...(regionData.flatrate || []),
      ...(regionData.rent || []),
      ...(regionData.buy || [])
    ];

    // Remove duplicates
    const uniqueProviders = allProviders.filter((provider, index, self) => 
      index === self.findIndex(p => p.provider_id === provider.provider_id)
    );

    if (uniqueProviders.length === 0) {
      this.showNoStreamingProviders();
      return;
    }

    uniqueProviders.forEach(provider => {
      const providerCard = document.createElement('div');
      providerCard.className = 'provider-card';
      
      // Determine provider type
      let providerType = 'Stream';
      if (regionData.rent?.some(p => p.provider_id === provider.provider_id)) {
        providerType = 'Rent';
      } else if (regionData.buy?.some(p => p.provider_id === provider.provider_id)) {
        providerType = 'Buy';
      }

      providerCard.innerHTML = `
        <img class="provider-logo" 
             src="https://image.tmdb.org/t/p/w92${provider.logo_path}" 
             alt="${provider.provider_name} logo"
             onerror="this.style.display='none'">
        <div class="provider-info">
          <h4 class="provider-name">${provider.provider_name}</h4>
          <p class="provider-type">${providerType}</p>
        </div>
      `;

      providersContainer.appendChild(providerCard);
    });
  }

  /**
   * Show no streaming providers message
   */
  showNoStreamingProviders() {
    const providersContainer = this.querySelector('#streaming-providers');
    if (!providersContainer) return;

    providersContainer.innerHTML = `
      <div class="no-providers">
        <p>Streaming availability information not available for this content.</p>
      </div>
    `;
  }

  /**
   * Load cast and crew credits
   */
  async loadCredits() {
    try {
      const creditsData = await mediaService.getCredits(this.mediaType, this.mediaId);
      this.populateCredits(creditsData);
      
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  }

  /**
   * Populate cast and crew
   */
  populateCredits(creditsData) {
    if (creditsData?.cast) {
      this.populateCast(creditsData.cast.slice(0, 20)); // Limit to 20 cast members
    }

    if (creditsData?.crew) {
      this.populateCrew(creditsData.crew.slice(0, 20)); // Limit to 20 crew members
    }
  }

  /**
   * Populate cast grid
   */
  populateCast(cast) {
    const castGrid = this.querySelector('#cast-grid');
    if (!castGrid) return;

    castGrid.innerHTML = '';

    cast.forEach(person => {
      const personCard = document.createElement('div');
      personCard.className = 'person-card';
      
      const photoUrl = person.profile_path ? 
        `https://image.tmdb.org/t/p/w185${person.profile_path}` : 
        this.getPersonPlaceholder();

      personCard.innerHTML = `
        <img class="person-photo" 
             src="${photoUrl}" 
             alt="${person.name}"
             onerror="this.src='${this.getPersonPlaceholder()}'">
        <div class="person-info">
          <h4 class="person-name">${person.name}</h4>
          <p class="person-role">${person.character || 'Unknown Role'}</p>
        </div>
      `;

      castGrid.appendChild(personCard);
    });
  }

  /**
   * Populate crew grid
   */
  populateCrew(crew) {
    const crewGrid = this.querySelector('#crew-grid');
    if (!crewGrid) return;

    crewGrid.innerHTML = '';

    crew.forEach(person => {
      const personCard = document.createElement('div');
      personCard.className = 'person-card';
      
      const photoUrl = person.profile_path ? 
        `https://image.tmdb.org/t/p/w185${person.profile_path}` : 
        this.getPersonPlaceholder();

      personCard.innerHTML = `
        <img class="person-photo" 
             src="${photoUrl}" 
             alt="${person.name}"
             onerror="this.src='${this.getPersonPlaceholder()}'">
        <div class="person-info">
          <h4 class="person-name">${person.name}</h4>
          <p class="person-role">${person.job || 'Unknown Job'}</p>
        </div>
      `;

      crewGrid.appendChild(personCard);
    });
  }

  /**
   * Get person placeholder image
   */
  getPersonPlaceholder() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTg1IiBoZWlnaHQ9IjI3OCIgdmlld0JveD0iMCAwIDE4NSAyNzgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxODUiIGhlaWdodD0iMjc4IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjkyLjUiIHk9IjE0MCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBob3RvPC90ZXh0Pgo8L3N2Zz4=';
  }

  /**
   * Load videos and trailers
   */
  async loadVideos() {
    try {
      const videosData = await mediaService.getVideos(this.mediaType, this.mediaId);
      this.populateVideos(videosData);
      
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  }

  /**
   * Populate videos grid
   */
  populateVideos(videosData) {
    const videosGrid = this.querySelector('#videos-grid');
    if (!videosGrid) return;

    videosGrid.innerHTML = '';

    const videos = videosData?.results || [];
    
    if (videos.length === 0) {
      videosGrid.innerHTML = '<p class="no-videos">No videos available.</p>';
      return;
    }

    // Prioritize trailers and teasers
    const sortedVideos = videos.sort((a, b) => {
      const priority = { 'Trailer': 3, 'Teaser': 2, 'Clip': 1 };
      return (priority[b.type] || 0) - (priority[a.type] || 0);
    });

    sortedVideos.slice(0, 6).forEach(video => {
      const videoCard = document.createElement('div');
      videoCard.className = 'video-card';
      videoCard.dataset.videoKey = video.key;
      videoCard.dataset.videoSite = video.site;
      
      const thumbnailUrl = video.site === 'YouTube' ? 
        `https://img.youtube.com/vi/${video.key}/hqdefault.jpg` : 
        this.getVideoPlaceholder();

      videoCard.innerHTML = `
        <div class="video-thumbnail">
          <img src="${thumbnailUrl}" alt="${video.name}">
          <button class="video-play-btn" aria-label="Play video">▶</button>
        </div>
        <div class="video-info">
          <h4 class="video-title">${video.name}</h4>
          <p class="video-type">${video.type}</p>
        </div>
      `;

      videosGrid.appendChild(videoCard);
    });
  }

  /**
   * Get video placeholder image
   */
  getVideoPlaceholder() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBWaWRlbzwvdGV4dD4KPC9zdmc+';
  }

  /**
   * Load similar content
   */
  async loadSimilarContent() {
    try {
      const similarData = await mediaService.getSimilar(this.mediaType, this.mediaId);
      await this.populateMediaCarousel('#similar-carousel', similarData?.results || []);
      
    } catch (error) {
      console.error('Error loading similar content:', error);
    }
  }

  /**
   * Load recommendations
   */
  async loadRecommendations() {
    try {
      const recommendationsData = await mediaService.getRecommendations(this.mediaType, this.mediaId);
      await this.populateMediaCarousel('#recommendations-carousel', recommendationsData?.results || []);
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }

  /**
   * Populate media carousel with content
   */
  async populateMediaCarousel(selector, mediaItems) {
    const carousel = this.querySelector(selector);
    if (!carousel) return;

    carousel.innerHTML = '';

    if (mediaItems.length === 0) {
      carousel.innerHTML = '<p class="no-content">No content available.</p>';
      return;
    }

    // Create media cards
    const cardPromises = mediaItems.slice(0, 20).map(async (item) => {
      const mediaCard = new MediaCard(item, {
        showActions: true,
        showGenres: false,
        imageSize: 'w300'
      });
      
      return await mediaCard.render();
    });

    const cardElements = await Promise.all(cardPromises);
    
    // Append all cards to carousel
    cardElements.forEach(cardElement => {
      if (cardElement) {
        carousel.appendChild(cardElement);
      }
    });
  }

  /**
   * Switch between cast and crew tabs
   */
  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    const tabButtons = this.querySelectorAll('.cast-tabs .tab-btn');
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      }
    });

    // Show/hide grids
    const castGrid = this.querySelector('#cast-grid');
    const crewGrid = this.querySelector('#crew-grid');

    if (tab === 'cast') {
      castGrid?.removeAttribute('hidden');
      crewGrid?.setAttribute('hidden', '');
    } else {
      castGrid?.setAttribute('hidden', '');
      crewGrid?.removeAttribute('hidden');
    }
  }

  /**
   * Play video
   */
  playVideo(videoKey, videoSite) {
    if (videoSite === 'YouTube') {
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoKey}`;
      window.open(youtubeUrl, '_blank');
    } else {
      this.showToast('Video playback not supported for this platform', 'warning');
    }
  }

  /**
   * Handle download action
   */
  handleDownload() {
    console.log('Download media:', this.mediaData);
    
    // TODO: Integrate with download system (will be implemented in task 5)
    const title = this.mediaData.title || this.mediaData.name;
    alert(`Download: ${title}\n\nThis will open the download search when implemented.`);
  }

  /**
   * Handle favorite action
   */
  handleFavorite() {
    console.log('Favorite media:', this.mediaData);
    
    // TODO: Implement favorites system
    const favoriteBtn = this.querySelector('.favorite-btn');
    const title = this.mediaData.title || this.mediaData.name;
    
    if (favoriteBtn) {
      const isFavorited = favoriteBtn.classList.toggle('favorited');
      const action = isFavorited ? 'Added to' : 'Removed from';
      this.showToast(`${action} favorites: ${title}`);
    }
  }

  /**
   * Show share modal
   */
  showShareModal() {
    const shareModal = this.querySelector('#share-modal');
    const urlInput = this.querySelector('.url-input');
    
    if (shareModal) {
      // Set current URL
      if (urlInput) {
        urlInput.value = window.location.href;
      }
      
      shareModal.removeAttribute('hidden');
    }
  }

  /**
   * Hide share modal
   */
  hideShareModal() {
    const shareModal = this.querySelector('#share-modal');
    if (shareModal) {
      shareModal.setAttribute('hidden', '');
    }
  }

  /**
   * Handle share action
   */
  handleShare(shareType) {
    const title = this.mediaData.title || this.mediaData.name;
    const url = window.location.href;
    const text = `Check out ${title} on Pandora Box`;

    switch (shareType) {
      case 'copy':
        this.copyUrl();
        break;
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
        break;
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank');
        break;
      case 'reddit':
        const redditUrl = `https://reddit.com/submit?title=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(redditUrl, '_blank');
        break;
    }

    this.hideShareModal();
  }

  /**
   * Copy URL to clipboard
   */
  async copyUrl() {
    const urlInput = this.querySelector('.url-input');
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(urlInput.value);
      } else {
        // Fallback for older browsers
        urlInput.select();
        document.execCommand('copy');
      }
      
      this.showToast('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      this.showToast('Failed to copy link', 'error');
    }
  }

  /**
   * Handle related media click
   */
  handleRelatedMediaClick(detail) {
    const { mediaData } = detail;
    const mediaType = mediaData.media_type || (mediaData.title ? 'movie' : 'tv');
    
    // Navigate to the new media details page
    const newUrl = `/media-details?id=${mediaData.id}&type=${mediaType}`;
    if (window.router) {
      window.router.navigate(newUrl);
    } else {
      window.location.href = newUrl;
    }
  }

  /**
   * Go back to previous page
   */
  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to dashboard
      if (window.router) {
        window.router.navigate('/dashboard');
      } else {
        window.location.href = '/dashboard';
      }
    }
  }

  /**
   * Show page loading overlay
   */
  showPageLoading(message = 'Loading...') {
    const loadingOverlay = this.querySelector('#loading-overlay');
    const loadingMessage = this.querySelector('.loading-message');
    
    if (loadingOverlay) {
      loadingOverlay.removeAttribute('hidden');
    }
    
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
  }

  /**
   * Hide page loading overlay
   */
  hidePageLoading() {
    const loadingOverlay = this.querySelector('#loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.setAttribute('hidden', '');
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles if not already present
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast {
          position: fixed;
          top: 2rem;
          right: 2rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        .toast.toast-success { background: var(--pb-accent); }
        .toast.toast-error { background: var(--pb-error); }
        .toast.toast-warning { background: var(--pb-warning); }
        .toast.show { transform: translateX(0); }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Post-render hook
   */
  onRender() {
    console.log('Media Details Page rendered');
  }
}

export default MediaDetailsPage;