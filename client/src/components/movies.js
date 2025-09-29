/**
 * Movies Component
 * Displays movies with category filters and virtual scrolling
 */

import api from '../services/api.js';

export class MoviesComponent {
  constructor() {
    this.container = null;
    this.currentCategory = 'popular';
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.movies = [];
  }

  /**
   * Render the movies component
   */
  async render(container) {
    this.container = container;
    
    const moviesHTML = `
      <div class="movies-content">
        <div class="content-header">
          <h1>Movies</h1>
        </div>
        
        <div class="category-tabs">
          <div class="category-filters">
            <button class="category-btn active" data-category="popular">Popular</button>
            <button class="category-btn" data-category="top_rated">Top Rated</button>
            <button class="category-btn" data-category="now_playing">Now Playing</button>
            <button class="category-btn" data-category="upcoming">Upcoming</button>
          </div>
        </div>
        
        <div id="movies-grid" class="media-grid">
          <div class="loading-spinner">Loading movies...</div>
        </div>
      </div>
    `;
    
    container.innerHTML = moviesHTML;
    this.initEventListeners();
    await this.loadMovies(true);
  }

  /**
   * Load movies from API
   */
  async loadMovies(reset = false) {
    if (this.isLoading || (!this.hasMore && !reset)) return;
    
    this.isLoading = true;
    
    if (reset) {
      this.currentPage = 1;
      this.movies = [];
      this.hasMore = true;
    }

    try {
      const response = await api.get(`/media/movies/${this.currentCategory}?page=${this.currentPage}`);
      
      if (response.success && response.data.results) {
        if (reset) {
          this.movies = response.data.results;
        } else {
          this.movies.push(...response.data.results);
        }
        
        this.hasMore = this.currentPage < (response.data.total_pages || 1);
        this.currentPage++;
        
        this.renderMovies();
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      this.renderError();
    }
    
    this.isLoading = false;
  }

  /**
   * Render movies grid
   */
  renderMovies() {
    const moviesGrid = document.getElementById('movies-grid');
    
    const moviesHTML = this.movies.map(movie => {
      const posterPath = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : './assets/placeholder-poster.svg';
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
      
      return `
        <div class="media-card" data-media-type="movie" data-media-id="${movie.id}">
          <div class="media-poster">
            <img src="${posterPath}" alt="${movie.title}" loading="lazy" />
            <div class="media-overlay">
              <button class="play-btn">View Details</button>
            </div>
          </div>
          <div class="media-info">
            <h3 class="media-title">${movie.title}</h3>
            <p class="media-year">${year}</p>
            <div class="media-rating">
              <span class="rating-star">★</span>
              <span class="rating-value">${movie.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    moviesGrid.innerHTML = moviesHTML;
  }

  /**
   * Render error state
   */
  renderError() {
    const moviesGrid = document.getElementById('movies-grid');
    moviesGrid.innerHTML = '<p class="error-message">Failed to load movies</p>';
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

    // Movie card click listeners
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
    await this.loadMovies(true);
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
      this.loadMovies();
    }
  }
}