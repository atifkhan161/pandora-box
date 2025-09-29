/**
 * TV Shows Component
 * Displays TV shows with category filters and virtual scrolling
 */

import api from '../services/api.js';

export class TvShowsComponent {
  constructor() {
    this.container = null;
    this.currentCategory = 'popular';
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.tvShows = [];
  }

  /**
   * Render the TV shows component
   */
  async render(container) {
    this.container = container;
    
    const tvShowsHTML = `
      <div class="tvshows-content">
        <div class="content-header">
          <h1>TV Shows</h1>
        </div>
        
        <div class="category-filters">
          <button class="category-btn active" data-category="popular">Popular</button>
          <button class="category-btn" data-category="top_rated">Top Rated</button>
          <button class="category-btn" data-category="on_the_air">On The Air</button>
          <button class="category-btn" data-category="airing_today">Airing Today</button>
        </div>
        
        <div id="tvshows-grid" class="media-grid">
          <div class="loading-spinner">Loading TV shows...</div>
        </div>
      </div>
    `;
    
    container.innerHTML = tvShowsHTML;
    this.initEventListeners();
    await this.loadTvShows(true);
  }

  /**
   * Load TV shows from API
   */
  async loadTvShows(reset = false) {
    if (this.isLoading || (!this.hasMore && !reset)) return;
    
    this.isLoading = true;
    
    if (reset) {
      this.currentPage = 1;
      this.tvShows = [];
      this.hasMore = true;
    }

    try {
      const response = await api.get(`/media/tv/${this.currentCategory}?page=${this.currentPage}`);
      
      if (response.success && response.data.results) {
        if (reset) {
          this.tvShows = response.data.results;
        } else {
          this.tvShows.push(...response.data.results);
        }
        
        this.hasMore = this.currentPage < (response.data.total_pages || 1);
        this.currentPage++;
        
        this.renderTvShows();
      }
    } catch (error) {
      console.error('Error loading TV shows:', error);
      this.renderError();
    }
    
    this.isLoading = false;
  }

  /**
   * Render TV shows grid
   */
  renderTvShows() {
    const tvShowsGrid = document.getElementById('tvshows-grid');
    
    const tvShowsHTML = this.tvShows.map(show => {
      const posterPath = show.poster_path 
        ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
        : './assets/placeholder-poster.svg';
      const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A';
      
      return `
        <div class="media-card" data-media-type="tv" data-media-id="${show.id}">
          <div class="media-poster">
            <img src="${posterPath}" alt="${show.name}" loading="lazy" />
            <div class="media-overlay">
              <button class="play-btn">View Details</button>
            </div>
          </div>
          <div class="media-info">
            <h3 class="media-title">${show.name}</h3>
            <p class="media-year">${year}</p>
            <div class="media-rating">
              <span class="rating-star">★</span>
              <span class="rating-value">${show.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    tvShowsGrid.innerHTML = tvShowsHTML;
  }

  /**
   * Render error state
   */
  renderError() {
    const tvShowsGrid = document.getElementById('tvshows-grid');
    tvShowsGrid.innerHTML = '<p class="error-message">Failed to load TV shows</p>';
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Category filter listeners
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => this.changeCategory(btn));
    });

    // Scroll listener for virtual scrolling
    window.addEventListener('scroll', () => this.handleScroll());

    // TV show card click listeners
    this.container.addEventListener('click', (e) => {
      const mediaCard = e.target.closest('.media-card');
      if (mediaCard) {
        const mediaType = mediaCard.dataset.mediaType;
        const mediaId = mediaCard.dataset.mediaId;
        window.location.href = `media-details.html?type=${mediaType}&id=${mediaId}`;
      }
    });
  }

  /**
   * Change category
   */
  async changeCategory(btn) {
    const category = btn.dataset.category;
    if (category === this.currentCategory) return;

    // Update active button
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    this.currentCategory = category;
    await this.loadTvShows(true);
  }

  /**
   * Handle scroll for virtual scrolling
   */
  handleScroll() {
    if (this.isLoading || !this.hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 1000) {
      this.loadTvShows();
    }
  }
}