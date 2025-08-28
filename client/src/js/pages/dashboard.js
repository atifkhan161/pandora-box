/**
 * Dashboard Page Controller - Media Discovery Dashboard
 * Vanilla JavaScript implementation with media discovery features
 */
import BasePage from './base-page.js';
import { mediaService } from '../services/media.js';
import MediaCard from '../components/media-card/media-card.js';

class DashboardPage extends BasePage {
  constructor() {
    super();
    this.templatePath = '/src/pages/dashboard.html';
    this.searchTimeout = null;
    this.currentSearchQuery = '';
    this.currentContentType = 'multi';
    this.currentGenre = '';
    this.currentSortBy = 'popularity.desc';
    this.genres = { movie: [], tv: [] };
    this.activeTab = {
      trending: 'movie',
      popular: 'movie',
      topRated: 'movie',
      browseGenres: 'movie'
    };
  }

  /**
   * Setup page-specific logic
   */
  async setupPage() {
    this.setTitle('Media Discovery Dashboard');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search toggle button
    const searchToggleBtn = this.querySelector('#search-toggle-btn');
    if (searchToggleBtn) {
      this.addEventListener(searchToggleBtn, 'click', () => {
        this.toggleSearch();
      });
    }

    // Search form
    const searchForm = this.querySelector('.search-form');
    if (searchForm) {
      this.addEventListener(searchForm, 'submit', (e) => {
        e.preventDefault();
        this.performSearch();
      });
    }

    // Search input with debouncing
    const searchInput = this.querySelector('#media-search-input');
    if (searchInput) {
      this.addEventListener(searchInput, 'input', (e) => {
        this.handleSearchInput(e.target.value);
      });
    }

    // Content type filter
    const contentTypeFilter = this.querySelector('#content-type-filter');
    if (contentTypeFilter) {
      this.addEventListener(contentTypeFilter, 'change', (e) => {
        this.currentContentType = e.target.value;
        this.updateGenreFilter();
        if (this.currentSearchQuery) {
          this.performSearch();
        }
      });
    }

    // Genre filter
    const genreFilter = this.querySelector('#genre-filter');
    if (genreFilter) {
      this.addEventListener(genreFilter, 'change', (e) => {
        this.currentGenre = e.target.value;
        if (this.currentSearchQuery) {
          this.performSearch();
        }
      });
    }

    // Sort filter
    const sortFilter = this.querySelector('#sort-filter');
    if (sortFilter) {
      this.addEventListener(sortFilter, 'change', (e) => {
        this.currentSortBy = e.target.value;
        if (this.currentSearchQuery) {
          this.performSearch();
        }
      });
    }

    // Clear search button
    const clearSearchBtn = this.querySelector('#clear-search-btn');
    if (clearSearchBtn) {
      this.addEventListener(clearSearchBtn, 'click', () => {
        this.clearSearch();
      });
    }

    // Tab buttons for content sections
    this.setupTabListeners();

    // Refresh button
    const refreshBtn = this.querySelector('#refresh-btn');
    if (refreshBtn) {
      this.addEventListener(refreshBtn, 'click', () => {
        this.refresh();
      });
    }

    // Logout button
    const logoutBtn = this.querySelector('#logout-btn');
    if (logoutBtn) {
      this.addEventListener(logoutBtn, 'click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Media card events
    this.addEventListener(this.container, 'media-card:view-details', (e) => {
      this.handleMediaDetails(e.detail);
    });

    this.addEventListener(this.container, 'media-card:download', (e) => {
      this.handleMediaDownload(e.detail);
    });

    this.addEventListener(this.container, 'media-card:favorite', (e) => {
      this.handleMediaFavorite(e.detail);
    });
  }

  /**
   * Setup tab listeners for content sections
   */
  setupTabListeners() {
    const tabButtons = this.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      this.addEventListener(button, 'click', (e) => {
        const section = e.target.closest('.content-section');
        const sectionClass = section.className.split(' ').find(cls => cls.endsWith('-section'));
        const sectionType = sectionClass.replace('-section', '');
        const contentType = e.target.dataset.type;

        this.switchTab(sectionType, contentType, e.target);
      });
    });
  }

  /**
   * Load initial data
   */
  async loadData() {
    try {
      this.showPageLoading('Loading media content...');

      // Load genres first
      await this.loadGenres();

      // Load dashboard stats
      await this.loadDashboardStats();

      // Load content sections
      await Promise.all([
        this.loadTrendingContent(),
        this.loadPopularContent(),
        this.loadTopRatedContent(),
        this.loadGenreGrid()
      ]);

      this.hidePageLoading();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.hidePageLoading();
      this.showError('Failed to load dashboard data');
    }
  }

  /**
   * Load genres for filtering
   */
  async loadGenres() {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        mediaService.getGenres('movie'),
        mediaService.getGenres('tv')
      ]);

      this.genres.movie = movieGenres.genres || [];
      this.genres.tv = tvGenres.genres || [];

      // Initialize genre filter
      this.updateGenreFilter();
      
    } catch (error) {
      console.error('Error loading genres:', error);
      // Continue without genres if they fail to load
    }
  }

  /**
   * Update genre filter options based on content type
   */
  updateGenreFilter() {
    const genreFilter = this.querySelector('#genre-filter');
    if (!genreFilter) return;

    // Clear existing options except "All Genres"
    genreFilter.innerHTML = '<option value="">All Genres</option>';

    let genresToShow = [];
    
    if (this.currentContentType === 'movie') {
      genresToShow = this.genres.movie;
    } else if (this.currentContentType === 'tv') {
      genresToShow = this.genres.tv;
    } else {
      // For 'multi', combine both and remove duplicates
      const combined = [...this.genres.movie, ...this.genres.tv];
      const uniqueGenres = combined.filter((genre, index, self) => 
        index === self.findIndex(g => g.name === genre.name)
      );
      genresToShow = uniqueGenres;
    }

    // Add genre options
    genresToShow.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreFilter.appendChild(option);
    });

    // Reset current genre selection
    this.currentGenre = '';
    genreFilter.value = '';
  }

  /**
   * Load dashboard statistics
   */
  async loadDashboardStats() {
    const statsContainer = this.querySelector('.stats-grid');
    if (!statsContainer) return;

    // Create placeholder stats
    statsContainer.innerHTML = `
      <div class="stat-card">
        <h3>Trending Movies</h3>
        <p class="stat-number">20</p>
      </div>
      <div class="stat-card">
        <h3>Popular TV Shows</h3>
        <p class="stat-number">20</p>
      </div>
      <div class="stat-card">
        <h3>Top Rated</h3>
        <p class="stat-number">20</p>
      </div>
      <div class="stat-card">
        <h3>Available Content</h3>
        <p class="stat-number">1000+</p>
      </div>
    `;
  }

  /**
   * Load trending content
   */
  async loadTrendingContent() {
    try {
      const trendingData = await mediaService.getTrending(this.activeTab.trending, 'week');
      const carousel = this.querySelector('#trending-carousel');
      
      if (carousel && trendingData?.results) {
        await this.renderMediaCards(carousel, trendingData.results.slice(0, 20));
      }
    } catch (error) {
      console.error('Error loading trending content:', error);
    }
  }

  /**
   * Load popular content
   */
  async loadPopularContent() {
    try {
      const popularData = await mediaService.getPopular(this.activeTab.popular);
      const carousel = this.querySelector('#popular-carousel');
      
      if (carousel && popularData?.results) {
        await this.renderMediaCards(carousel, popularData.results.slice(0, 20));
      }
    } catch (error) {
      console.error('Error loading popular content:', error);
    }
  }

  /**
   * Load top rated content
   */
  async loadTopRatedContent() {
    try {
      const topRatedData = await mediaService.getTopRated(this.activeTab.topRated);
      const carousel = this.querySelector('#top-rated-carousel');
      
      if (carousel && topRatedData?.results) {
        await this.renderMediaCards(carousel, topRatedData.results.slice(0, 20));
      }
    } catch (error) {
      console.error('Error loading top rated content:', error);
    }
  }

  /**
   * Load genre grid for browsing
   */
  async loadGenreGrid() {
    try {
      const genreGrid = this.querySelector('#genre-grid');
      if (!genreGrid) return;

      const currentGenres = this.activeTab.browseGenres === 'movie' ? this.genres.movie : this.genres.tv;
      
      // Clear existing content
      genreGrid.innerHTML = '';

      // Create genre cards
      currentGenres.slice(0, 12).forEach(genre => {
        const genreCard = document.createElement('div');
        genreCard.className = 'genre-card';
        genreCard.innerHTML = `
          <div class="genre-card-content">
            <h3 class="genre-card-title">${genre.name}</h3>
            <p class="genre-card-description">Explore ${genre.name.toLowerCase()} ${this.activeTab.browseGenres === 'movie' ? 'movies' : 'TV shows'}</p>
          </div>
          <div class="genre-card-arrow">→</div>
        `;
        
        // Add click handler
        genreCard.addEventListener('click', () => {
          this.browseGenre(genre.id, genre.name);
        });
        
        genreGrid.appendChild(genreCard);
      });
      
    } catch (error) {
      console.error('Error loading genre grid:', error);
    }
  }

  /**
   * Render media cards in a container
   */
  async renderMediaCards(container, mediaItems) {
    if (!container || !mediaItems) return;

    // Clear existing content
    container.innerHTML = '';

    // Create media cards
    const cardPromises = mediaItems.map(async (item) => {
      const mediaCard = new MediaCard(item, {
        showActions: true,
        showGenres: false,
        imageSize: 'w300'
      });
      
      return await mediaCard.render();
    });

    const cardElements = await Promise.all(cardPromises);
    
    // Append all cards to container
    cardElements.forEach(cardElement => {
      if (cardElement) {
        container.appendChild(cardElement);
      }
    });
  }

  /**
   * Toggle search visibility
   */
  toggleSearch() {
    const searchContainer = this.querySelector('#search-container');
    const searchInput = this.querySelector('#media-search-input');
    
    if (searchContainer) {
      const isHidden = searchContainer.hasAttribute('hidden');
      
      if (isHidden) {
        searchContainer.removeAttribute('hidden');
        searchInput?.focus();
      } else {
        searchContainer.setAttribute('hidden', '');
        this.clearSearch();
      }
    }
  }

  /**
   * Handle search input with debouncing
   */
  handleSearchInput(query) {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.currentSearchQuery = query.trim();

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      if (this.currentSearchQuery.length >= 2) {
        this.performSearch();
      } else if (this.currentSearchQuery.length === 0) {
        this.clearSearchResults();
      }
    }, 300);
  }

  /**
   * Perform search
   */
  async performSearch() {
    if (!this.currentSearchQuery) return;

    try {
      const searchOptions = {
        sort_by: this.currentSortBy
      };

      // Add genre filter if selected
      if (this.currentGenre) {
        searchOptions.with_genres = this.currentGenre;
      }

      const searchResults = await mediaService.search(
        this.currentSearchQuery,
        this.currentContentType,
        1,
        searchOptions
      );

      this.displaySearchResults(searchResults);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed. Please try again.');
    }
  }

  /**
   * Display search results
   */
  async displaySearchResults(searchResults) {
    const searchSection = this.querySelector('#search-results-section');
    const searchGrid = this.querySelector('#search-results-grid');
    
    if (!searchSection || !searchGrid) return;

    // Show search results section
    searchSection.removeAttribute('hidden');

    if (searchResults?.results && searchResults.results.length > 0) {
      await this.renderMediaCards(searchGrid, searchResults.results);
    } else {
      searchGrid.innerHTML = `
        <div class="no-results">
          <p>No results found for "${this.currentSearchQuery}"</p>
        </div>
      `;
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    const searchInput = this.querySelector('#media-search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.currentSearchQuery = '';
    this.clearSearchResults();
  }

  /**
   * Clear search results
   */
  clearSearchResults() {
    const searchSection = this.querySelector('#search-results-section');
    const searchGrid = this.querySelector('#search-results-grid');
    
    if (searchSection) {
      searchSection.setAttribute('hidden', '');
    }
    
    if (searchGrid) {
      searchGrid.innerHTML = '';
    }
  }

  /**
   * Switch content tab
   */
  async switchTab(sectionType, contentType, clickedButton) {
    // Update active tab
    this.activeTab[sectionType] = contentType;

    // Update tab button states
    const section = clickedButton.closest('.content-section');
    const tabButtons = section.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    
    clickedButton.classList.add('active');
    clickedButton.setAttribute('aria-selected', 'true');

    // Load content for the new tab
    const carousel = section.querySelector('.media-carousel');
    if (carousel) {
      carousel.innerHTML = '<div class="loading-message">Loading...</div>';
      
      try {
        let data;
        switch (sectionType) {
          case 'trending':
            data = await mediaService.getTrending(contentType, 'week');
            break;
          case 'popular':
            data = await mediaService.getPopular(contentType);
            break;
          case 'top-rated':
            data = await mediaService.getTopRated(contentType);
            break;
          case 'browse-genres':
            // For genre browsing, reload the genre grid
            await this.loadGenreGrid();
            return;
        }
        
        if (data?.results) {
          await this.renderMediaCards(carousel, data.results.slice(0, 20));
        }
      } catch (error) {
        console.error(`Error loading ${sectionType} ${contentType}:`, error);
        carousel.innerHTML = '<div class="error-message">Failed to load content</div>';
      }
    }
  }

  /**
   * Handle media details view
   */
  handleMediaDetails(detail) {
    console.log('View media details:', detail);
    
    const { mediaData } = detail;
    const mediaType = mediaData.media_type || (mediaData.title ? 'movie' : 'tv');
    
    // Navigate to media details page
    const detailsUrl = `/media-details?id=${mediaData.id}&type=${mediaType}`;
    if (window.router) {
      window.router.navigate(detailsUrl);
    } else {
      window.location.href = detailsUrl;
    }
  }

  /**
   * Handle media download
   */
  handleMediaDownload(detail) {
    console.log('Download media:', detail);
    
    // TODO: Integrate with download system (will be implemented in task 5)
    // For now, show a simple alert
    const { mediaData } = detail;
    const title = mediaData.title || mediaData.name;
    alert(`Download: ${title}\n\nThis will open the download search when implemented.`);
  }

  /**
   * Handle media favorite
   */
  handleMediaFavorite(detail) {
    console.log('Favorite media:', detail);
    
    // TODO: Implement favorites system
    const { mediaData, isFavorited } = detail;
    const title = mediaData.title || mediaData.name;
    const action = isFavorited ? 'Added to' : 'Removed from';
    
    this.showToast(`${action} favorites: ${title}`);
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      this.showPageLoading('Logging out...');

      // Disconnect WebSocket
      if (window.wsClient) {
        window.wsClient.disconnect();
      }

      // Perform logout
      if (window.authStore) {
        await window.authStore.logout();
      }

      this.hidePageLoading();

      // Show success message
      this.showToast('Logged out successfully');

      // Redirect to login
      setTimeout(() => {
        if (window.router) {
          window.router.navigate('/login');
        }
      }, 1000);

    } catch (error) {
      console.error('Logout error:', error);
      this.hidePageLoading();
      this.showError('Error during logout');
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
   * Browse content by genre
   */
  async browseGenre(genreId, genreName) {
    try {
      // Set search filters to browse this genre
      const contentTypeFilter = this.querySelector('#content-type-filter');
      const genreFilter = this.querySelector('#genre-filter');
      const searchInput = this.querySelector('#media-search-input');
      
      if (contentTypeFilter) {
        contentTypeFilter.value = this.activeTab.browseGenres;
        this.currentContentType = this.activeTab.browseGenres;
      }
      
      if (genreFilter) {
        genreFilter.value = genreId;
        this.currentGenre = genreId;
      }
      
      if (searchInput) {
        searchInput.value = genreName;
        this.currentSearchQuery = genreName;
      }

      // Update genre filter options
      this.updateGenreFilter();
      
      // Set the genre filter value again after update
      if (genreFilter) {
        genreFilter.value = genreId;
      }

      // Show search container and perform search
      const searchContainer = this.querySelector('#search-container');
      if (searchContainer) {
        searchContainer.removeAttribute('hidden');
      }

      // Use discover API for better genre-based results
      const genreResults = await mediaService.getByGenre(this.activeTab.browseGenres, genreId, 1);
      this.displaySearchResults(genreResults);

      // Show success message
      this.showToast(`Browsing ${genreName} ${this.activeTab.browseGenres === 'movie' ? 'movies' : 'TV shows'}`);
      
    } catch (error) {
      console.error('Error browsing genre:', error);
      this.showError('Failed to browse genre content');
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
    console.log('Media Discovery Dashboard rendered');
  }
}

export default DashboardPage;