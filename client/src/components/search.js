/**
 * Search Component
 * Provides search functionality for movies, TV shows, and people
 */

import api from '../services/api.js';

export class SearchComponent {
  constructor() {
    this.container = null;
    this.searchTimeout = null;
    this.autocompleteTimeout = null;
    this.autocompleteVisible = false;
  }

  /**
   * Render the search component
   * @param {HTMLElement} container - Container element
   */
  render(container) {
    this.container = container;
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';
    const initialType = urlParams.get('type') || 'multi';
    const personId = urlParams.get('person_id');
    const personName = urlParams.get('person_name');
    
    const searchHTML = `
      <div class="search-content">
        <div class="content-header">
          <h1>Search</h1>
          <p>Find movies, TV shows, and people</p>
        </div>
        
        <div class="search-form">
          <div class="search-input-container">
            <input type="text" id="search-input" placeholder="Search for movies, TV shows, or people..." value="${initialQuery}" autocomplete="off" />
            <div id="autocomplete-dropdown" class="autocomplete-dropdown" style="display: none;"></div>
            <button id="search-btn" class="btn btn-primary">Search</button>
          </div>
          
          <div class="search-filters">
            <label>
              <input type="radio" name="search-type" value="multi" ${initialType === 'multi' ? 'checked' : ''} />
              All
            </label>
            <label>
              <input type="radio" name="search-type" value="movie" ${initialType === 'movie' ? 'checked' : ''} />
              Movies
            </label>
            <label>
              <input type="radio" name="search-type" value="tv" ${initialType === 'tv' ? 'checked' : ''} />
              TV Shows
            </label>
            <label>
              <input type="radio" name="search-type" value="person" ${initialType === 'person' ? 'checked' : ''} />
              People
            </label>
          </div>
        </div>
        
        <div id="search-results" class="search-results">
          <div class="search-placeholder">
            <p>Enter a search term to find movies, TV shows, and people</p>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = searchHTML;
    this.initEventListeners();
    
    // Perform initial search if query exists or show person filmography
    if (personId && personName) {
      this.showPersonFilmography(personId, decodeURIComponent(personName));
    } else if (initialQuery) {
      this.performSearch(initialQuery);
    }
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchTypeRadios = document.querySelectorAll('input[name="search-type"]');
    
    // Search on input with debounce and autocomplete
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      clearTimeout(this.autocompleteTimeout);
      const query = e.target.value.trim();
      
      if (query.length >= 2) {
        // Show autocomplete suggestions
        this.autocompleteTimeout = setTimeout(() => {
          this.fetchAutocompleteSuggestions(query);
        }, 200);
        
        // Perform full search with longer delay
        this.searchTimeout = setTimeout(() => {
          this.performSearch(query);
        }, 500);
      } else if (query.length === 0) {
        this.hideAutocomplete();
        this.showPlaceholder();
      } else {
        this.hideAutocomplete();
      }
    });
    
    // Search on button click
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        this.performSearch(query);
      }
    });
    
    // Handle keyboard navigation and search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          this.hideAutocomplete();
          this.performSearch(query);
        }
      } else if (e.key === 'Escape') {
        this.hideAutocomplete();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateAutocomplete(e.key === 'ArrowDown' ? 1 : -1);
      }
    });
    
    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-container')) {
        this.hideAutocomplete();
      }
    });
    
    // Re-search when type changes
    searchTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const query = searchInput.value.trim();
        if (query) {
          this.performSearch(query);
        }
      });
    });
  }

  /**
   * Fetch autocomplete suggestions from Watchmode API
   * @param {string} query - Search query
   */
  async fetchAutocompleteSuggestions(query) {
    try {
      const response = await api.get(`/media/autocomplete?query=${encodeURIComponent(query)}`);
      
      if (response.success && response.data && response.data.length > 0) {
        this.showAutocompleteSuggestions(response.data);
      } else {
        this.hideAutocomplete();
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      this.hideAutocomplete();
    }
  }

  /**
   * Show autocomplete suggestions
   * @param {Array} suggestions - Array of suggestions
   */
  showAutocompleteSuggestions(suggestions) {
    const dropdown = document.getElementById('autocomplete-dropdown');
    
    const suggestionsHTML = suggestions.slice(0, 8).map((item, index) => {
      const title = item.name || item.title;
      const year = item.year ? ` (${item.year})` : '';
      const type = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '';
      
      return `
        <div class="autocomplete-item" data-index="${index}" data-title="${title}">
          <div class="autocomplete-content">
            <span class="autocomplete-title">${title}${year}</span>
            ${type ? `<span class="autocomplete-type">${type}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    dropdown.innerHTML = suggestionsHTML;
    dropdown.style.display = 'block';
    this.autocompleteVisible = true;
    
    // Add click listeners to suggestions
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        const title = item.dataset.title;
        document.getElementById('search-input').value = title;
        this.hideAutocomplete();
        this.performSearch(title);
      });
    });
  }

  /**
   * Hide autocomplete dropdown
   */
  hideAutocomplete() {
    const dropdown = document.getElementById('autocomplete-dropdown');
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    this.autocompleteVisible = false;
    
    // Remove active state from all items
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.classList.remove('active');
    });
  }

  /**
   * Navigate autocomplete suggestions with keyboard
   * @param {number} direction - 1 for down, -1 for up
   */
  navigateAutocomplete(direction) {
    if (!this.autocompleteVisible) return;
    
    const dropdown = document.getElementById('autocomplete-dropdown');
    const items = dropdown.querySelectorAll('.autocomplete-item');
    const activeItem = dropdown.querySelector('.autocomplete-item.active');
    
    let newIndex = 0;
    
    if (activeItem) {
      const currentIndex = parseInt(activeItem.dataset.index);
      newIndex = currentIndex + direction;
      activeItem.classList.remove('active');
    } else {
      newIndex = direction > 0 ? 0 : items.length - 1;
    }
    
    // Wrap around
    if (newIndex >= items.length) newIndex = 0;
    if (newIndex < 0) newIndex = items.length - 1;
    
    if (items[newIndex]) {
      items[newIndex].classList.add('active');
      const title = items[newIndex].dataset.title;
      document.getElementById('search-input').value = title;
    }
  }

  /**
   * Perform search
   * @param {string} query - Search query
   */
  async performSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    const selectedType = document.querySelector('input[name="search-type"]:checked').value;
    
    // Show loading state
    resultsContainer.innerHTML = `
      <div class="search-loading">
        <div class="loading-spinner">Searching...</div>
      </div>
    `;
    
    try {
      const searchType = selectedType === 'multi' ? undefined : selectedType;
      const response = await api.get(`/media/search?query=${encodeURIComponent(query)}${searchType ? `&type=${searchType}` : ''}`);
      
      if (response.success && response.data) {
        this.renderSearchResults(response.data, query);
      } else {
        this.renderNoResults(query);
      }
    } catch (error) {
      console.error('Search error:', error);
      this.renderError('Failed to perform search. Please try again.');
    }
  }

  /**
   * Render search results
   * @param {Object} data - Search results data
   * @param {string} query - Original search query
   */
  renderSearchResults(data, query) {
    const resultsContainer = document.getElementById('search-results');
    
    if (!data.results || data.results.length === 0) {
      this.renderNoResults(query);
      return;
    }
    
    // Group results by type
    const groupedResults = this.groupResultsByType(data.results);
    
    let resultsHTML = `
      <div class="search-results-header">
        <h2>Search Results for "${query}"</h2>
        <p>${data.total_results || data.results.length} results found</p>
      </div>
    `;
    
    // Render each category
    Object.keys(groupedResults).forEach(type => {
      if (groupedResults[type].length > 0) {
        resultsHTML += this.renderResultsSection(type, groupedResults[type]);
      }
    });
    
    resultsContainer.innerHTML = resultsHTML;
    this.initResultsEventListeners();
  }

  /**
   * Group results by media type
   * @param {Array} results - Search results
   * @returns {Object} Grouped results
   */
  groupResultsByType(results) {
    const grouped = {
      movie: [],
      tv: [],
      person: []
    };
    
    results.forEach(item => {
      if (item.media_type) {
        if (grouped[item.media_type]) {
          grouped[item.media_type].push(item);
        }
      } else {
        // Fallback: determine type based on properties
        if (item.title) {
          grouped.movie.push(item);
        } else if (item.name && !item.known_for) {
          grouped.tv.push(item);
        } else if (item.known_for) {
          grouped.person.push(item);
        }
      }
    });
    
    return grouped;
  }

  /**
   * Render results section for a specific type
   * @param {string} type - Media type
   * @param {Array} results - Results for this type
   * @returns {string} HTML string
   */
  renderResultsSection(type, results) {
    const typeLabels = {
      movie: 'Movies',
      tv: 'TV Shows',
      person: 'People'
    };
    
    return `
      <div class="results-section">
        <h3>${typeLabels[type]} (${results.length})</h3>
        <div class="results-grid ${type}-results">
          ${results.map(item => this.renderResultItem(item, type)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render individual result item
   * @param {Object} item - Result item
   * @param {string} type - Media type
   * @returns {string} HTML string
   */
  renderResultItem(item, type) {
    if (type === 'person') {
      return this.renderPersonResult(item);
    } else {
      return this.renderMediaResult(item, type);
    }
  }

  /**
   * Render media result (movie/TV)
   * @param {Object} item - Media item
   * @param {string} type - Media type
   * @returns {string} HTML string
   */
  renderMediaResult(item, type) {
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const posterPath = item.poster_path 
      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
      : './assets/placeholder-poster.svg';
    
    return `
      <div class="result-item media-result" data-media-type="${type}" data-media-id="${item.id}">
        <div class="result-poster">
          <img src="${posterPath}" alt="${title}" loading="lazy" />
        </div>
        <div class="result-info">
          <h4 class="result-title">${title}</h4>
          <p class="result-year">${year}</p>
          <div class="result-rating">
            <span class="rating-star">★</span>
            <span class="rating-value">${item.vote_average?.toFixed(1) || 'N/A'}</span>
          </div>
          ${item.overview ? `<p class="result-overview">${item.overview.substring(0, 100)}...</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render person result
   * @param {Object} item - Person item
   * @returns {string} HTML string
   */
  renderPersonResult(item) {
    const profilePath = item.profile_path 
      ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
      : './assets/placeholder-person.svg';
    
    const knownFor = item.known_for 
      ? item.known_for.slice(0, 3).map(work => work.title || work.name).join(', ')
      : '';
    
    return `
      <div class="result-item person-result" data-person-id="${item.id}">
        <div class="result-photo">
          <img src="${profilePath}" alt="${item.name}" loading="lazy" />
        </div>
        <div class="result-info">
          <h4 class="result-name">${item.name}</h4>
          <p class="result-department">${item.known_for_department || 'Acting'}</p>
          ${knownFor ? `<p class="result-known-for">Known for: ${knownFor}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render no results message
   * @param {string} query - Search query
   */
  renderNoResults(query) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = `
      <div class="no-results">
        <h2>No Results Found</h2>
        <p>No results found for "${query}". Try a different search term.</p>
      </div>
    `;
  }

  /**
   * Render error message
   * @param {string} message - Error message
   */
  renderError(message) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = `
      <div class="search-error">
        <h2>Search Error</h2>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Show person filmography
   */
  async showPersonFilmography(personId, personName) {
    const resultsContainer = document.getElementById('search-results');
    const searchInput = document.getElementById('search-input');
    
    // Update search input
    searchInput.value = personName;
    
    // Show loading
    resultsContainer.innerHTML = `
      <div class="search-loading">
        <div class="loading-spinner">Loading filmography...</div>
      </div>
    `;
    
    try {
      const response = await api.get(`/media/person/${personId}/credits`);
      
      if (response.success && response.data) {
        this.renderPersonFilmography(response.data, personName);
      } else {
        this.renderError('Failed to load filmography');
      }
    } catch (error) {
      console.error('Error loading filmography:', error);
      this.renderError('Failed to load filmography');
    }
  }

  /**
   * Render person filmography
   */
  renderPersonFilmography(data, personName) {
    const resultsContainer = document.getElementById('search-results');
    const movies = data.cast?.filter(item => item.media_type === 'movie') || [];
    const tvShows = data.cast?.filter(item => item.media_type === 'tv') || [];
    
    let resultsHTML = `
      <div class="search-results-header">
        <h2>${personName} - Filmography</h2>
        <p>${movies.length + tvShows.length} credits found</p>
      </div>
      
      <div class="filmography-tabs">
        <div class="category-filters">
          <button class="category-btn active" data-tab="movies">Movies (${movies.length})</button>
          <button class="category-btn" data-tab="tvshows">TV Shows (${tvShows.length})</button>
        </div>
        
        <div class="tab-content">
          <div id="movies-tab" class="tab-panel active">
            ${movies.length > 0 ? this.renderFilmographyGrid(movies, 'movie') : '<p class="no-results">No movies found</p>'}
          </div>
          <div id="tvshows-tab" class="tab-panel" style="display: none;">
            ${tvShows.length > 0 ? this.renderFilmographyGrid(tvShows, 'tv') : '<p class="no-results">No TV shows found</p>'}
          </div>
        </div>
      </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    this.initFilmographyTabs();
    this.initResultsEventListeners();
  }

  /**
   * Render filmography grid
   */
  renderFilmographyGrid(items, type) {
    return `
      <div class="results-grid ${type}-results">
        ${items.map(item => this.renderMediaResult(item, type)).join('')}
      </div>
    `;
  }

  /**
   * Initialize filmography tabs
   */
  initFilmographyTabs() {
    const tabButtons = document.querySelectorAll('.filmography-tabs .category-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active button
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show/hide tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.style.display = 'none';
          panel.classList.remove('active');
        });
        
        const activePanel = document.getElementById(`${tabName}-tab`);
        if (activePanel) {
          activePanel.style.display = 'block';
          activePanel.classList.add('active');
        }
      });
    });
  }

  /**
   * Show placeholder message
   */
  showPlaceholder() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = `
      <div class="search-placeholder">
        <p>Enter a search term to find movies, TV shows, and people</p>
      </div>
    `;
  }

  /**
   * Initialize event listeners for search results
   */
  initResultsEventListeners() {
    // Add click listeners to media results
    const mediaResults = document.querySelectorAll('.media-result');
    mediaResults.forEach(result => {
      result.addEventListener('click', () => {
        const mediaType = result.dataset.mediaType;
        const mediaId = result.dataset.mediaId;
        window.location.href = `media-details.html?type=${mediaType}&id=${mediaId}`;
      });
    });
    
    // Add click listeners to person results
    const personResults = document.querySelectorAll('.person-result');
    personResults.forEach(result => {
      result.addEventListener('click', () => {
        const personId = result.dataset.personId;
        const personName = result.querySelector('.result-name').textContent;
        this.showPersonFilmography(personId, personName);
      });
    });
  }
}