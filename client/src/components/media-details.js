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
                <!-- Torrent search moved to accordion section -->
              </div>
            </div>
          </div>
          
          ${media.overview ? `
            <div class="media-section">
              <h2>Overview</h2>
              <p class="media-overview">${media.overview}</p>
            </div>
          ` : ''}
          
          ${this.mediaType === 'tv' ? this.renderTvInfo() : ''}
        ${this.renderAccordionSections()}
        </div>
      </div>
    `;
    
    this.container.innerHTML = detailsHTML;
    this.initEventListeners();
  }

  /**
   * Render TV show specific information
   */
  renderTvInfo() {
    if (!this.mediaData.seasons) return '';

    const totalEpisodes = this.mediaData.number_of_episodes || 0;
    const totalSeasons = this.mediaData.number_of_seasons || 0;
    const status = this.mediaData.status || 'Unknown';
    const lastAirDate = this.mediaData.last_air_date;
    const nextEpisode = this.mediaData.next_episode_to_air;

    return `
      <div class="tv-info-section">
        <div class="tv-stats">
          <div class="tv-stat">
            <span class="stat-number">${totalSeasons}</span>
            <span class="stat-label">Seasons</span>
          </div>
          <div class="tv-stat">
            <span class="stat-number">${totalEpisodes}</span>
            <span class="stat-label">Episodes</span>
          </div>
          <div class="tv-stat">
            <span class="stat-status">${status}</span>
            <span class="stat-label">Status</span>
          </div>
        </div>
        ${nextEpisode ? `
          <div class="next-episode">
            <h4>Next Episode</h4>
            <p>${nextEpisode.name} - ${new Date(nextEpisode.air_date).toLocaleDateString()}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render torrents accordion
   */
  renderTorrentsAccordion() {
    return `
      <div class="accordion-item">
        <div class="accordion-header" data-accordion="torrents">
          <h3>Torrents</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="torrents-content" style="display: none;">
          <div id="torrent-loading" class="torrent-loading" style="display: none;">
            <div class="loading-spinner">Loading indexers and searching torrents...</div>
          </div>
          <div id="indexer-tabs" class="indexer-tabs" style="display: none;"></div>
          <div id="torrent-results" class="torrent-results"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render accordion sections
   */
  renderAccordionSections() {
    return `
      <div class="accordion-sections">
        ${this.mediaType === 'tv' ? this.renderSeasonsAccordion() : ''}
        ${this.renderCastAccordion()}
        ${this.renderTorrentsAccordion()}
        ${this.renderSimilarAccordion()}
        ${this.renderStreamingAccordion()}
      </div>
    `;
  }

  /**
   * Render cast accordion
   */
  renderCastAccordion() {
    if (!this.mediaData.credits || !this.mediaData.credits.cast) {
      return '';
    }

    const cast = this.mediaData.credits.cast;
    const previewCast = cast.slice(0, 4);
    
    return `
      <div class="accordion-item">
        <div class="accordion-header" data-accordion="cast">
          <h3>Cast (${cast.length})</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="cast-content">
          <div class="cast-preview">
            ${previewCast.map(person => `
              <div class="cast-member-inline" data-person-name="${person.name}" data-person-id="${person.id}">
                <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w92${person.profile_path}` : './assets/placeholder-person.svg'}" 
                     alt="${person.name}" />
                <span>${person.name}</span>
              </div>
            `).join('')}
          </div>
          <div class="cast-full" style="display: none;">
            <div class="cast-grid">
              ${cast.map(person => `
                <div class="cast-member" data-person-name="${person.name}" data-person-id="${person.id}">
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
        </div>
      </div>
    `;
  }

  /**
   * Render similar media accordion
   */
  renderSimilarAccordion() {
    const similar = this.mediaData.similar?.results || [];
    const recommendations = this.mediaData.recommendations?.results || [];
    
    if (!similar.length && !recommendations.length) {
      return '';
    }

    return `
      <div class="accordion-item">
        <div class="accordion-header" data-accordion="similar">
          <h3>Similar & Recommended</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="similar-content" style="display: none;">
          ${similar.length ? `
            <div class="similar-section">
              <h4>Similar ${this.mediaType === 'movie' ? 'Movies' : 'TV Shows'}</h4>
              <div class="similar-grid">
                ${similar.slice(0, 8).map(item => this.renderSimilarItem(item)).join('')}
              </div>
            </div>
          ` : ''}
          ${recommendations.length ? `
            <div class="similar-section">
              <h4>Recommended</h4>
              <div class="similar-grid">
                ${recommendations.slice(0, 8).map(item => this.renderSimilarItem(item)).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render similar item
   */
  renderSimilarItem(item) {
    const title = item.title || item.name;
    const posterPath = item.poster_path 
      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
      : './assets/placeholder-poster.svg';
    
    return `
      <div class="similar-item" data-media-type="${this.mediaType}" data-media-id="${item.id}">
        <img src="${posterPath}" alt="${title}" loading="lazy" />
        <div class="similar-info">
          <h5>${title}</h5>
          <span class="similar-rating">★ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render seasons accordion
   */
  renderSeasonsAccordion() {
    if (!this.mediaData.seasons || !this.mediaData.seasons.length) {
      return '';
    }

    const seasons = this.mediaData.seasons.filter(season => season.season_number > 0);
    
    return `
      <div class="accordion-item">
        <div class="accordion-header" data-accordion="seasons">
          <h3>Seasons (${seasons.length})</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="seasons-content" style="display: none;">
          <div class="seasons-grid">
            ${seasons.map(season => `
              <div class="season-item">
                <div class="season-poster">
                  <img src="${season.poster_path ? `https://image.tmdb.org/t/p/w300${season.poster_path}` : './assets/placeholder-poster.svg'}" 
                       alt="${season.name}" loading="lazy" />
                </div>
                <div class="season-info">
                  <h4>${season.name}</h4>
                  <p class="season-episodes">${season.episode_count} episodes</p>
                  ${season.air_date ? `<p class="season-date">${new Date(season.air_date).getFullYear()}</p>` : ''}
                  ${season.overview ? `<p class="season-overview">${season.overview.substring(0, 100)}...</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render streaming accordion
   */
  renderStreamingAccordion() {
    if (!this.mediaData.streaming || !this.mediaData.streaming.length) {
      return '';
    }

    return `
      <div class="accordion-item">
        <div class="accordion-header" data-accordion="streaming">
          <h3>Available On</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="streaming-content" style="display: none;">
          <div class="streaming-providers">
            ${this.mediaData.streaming.map(provider => `
              <div class="streaming-provider">
                <img src="${provider.logo_path}" alt="${provider.provider_name}" />
                <span>${provider.provider_name}</span>
              </div>
            `).join('')}
          </div>
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
    // Accordion toggle listeners
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => this.toggleAccordion(header));
    });

    // Similar item click listeners
    const similarItems = document.querySelectorAll('.similar-item');
    similarItems.forEach(item => {
      item.addEventListener('click', () => {
        const mediaType = item.dataset.mediaType;
        const mediaId = item.dataset.mediaId;
        window.location.href = `media-details.html?type=${mediaType}&id=${mediaId}`;
      });
    });

    // Cast member click listeners
    const castMembers = document.querySelectorAll('.cast-member, .cast-member-inline');
    castMembers.forEach(member => {
      member.addEventListener('click', () => {
        const personId = member.dataset.personId;
        const personName = member.dataset.personName;
        window.location.href = `search.html?person_id=${personId}&person_name=${encodeURIComponent(personName)}`;
      });
    });

    // Torrents accordion will trigger search automatically when opened
  }

  /**
   * Toggle accordion section
   */
  toggleAccordion(header) {
    const accordionType = header.dataset.accordion;
    const content = document.getElementById(`${accordionType}-content`);
    const icon = header.querySelector('.accordion-icon');
    
    if (content.style.display === 'none' || !content.style.display) {
      content.style.display = 'block';
      icon.textContent = '▲';
      header.classList.add('active');
      
      // Show full cast when cast accordion is opened
      if (accordionType === 'cast') {
        const preview = content.querySelector('.cast-preview');
        const full = content.querySelector('.cast-full');
        if (preview && full) {
          preview.style.display = 'none';
          full.style.display = 'block';
        }
      }
      
      // Start torrent search when torrents accordion is opened
      if (accordionType === 'torrents') {
        this.loadIndexersAndSearch();
      }
    } else {
      content.style.display = 'none';
      icon.textContent = '▼';
      header.classList.remove('active');
      
      // Show preview cast when cast accordion is closed
      if (accordionType === 'cast') {
        const preview = content.querySelector('.cast-preview');
        const full = content.querySelector('.cast-full');
        if (preview && full) {
          preview.style.display = 'block';
          full.style.display = 'none';
        }
      }
    }
  }

  /**
   * Load indexers and search torrents
   */
  async loadIndexersAndSearch() {
    const torrentLoading = document.getElementById('torrent-loading');
    const indexerTabs = document.getElementById('indexer-tabs');
    const torrentResults = document.getElementById('torrent-results');

    // Show loading state
    torrentLoading.style.display = 'block';
    indexerTabs.style.display = 'none';
    torrentResults.innerHTML = '';

    try {
      // Get indexers and search torrents
      const title = this.mediaData.title || this.mediaData.name;
      const year = this.mediaData.release_date || this.mediaData.first_air_date;
      const searchQuery = year ? `${title} ${new Date(year).getFullYear()}` : title;
      
      const response = await api.get(`/downloads/search-torrents/${encodeURIComponent(searchQuery)}`);
      
      if (response && Array.isArray(response)) {
        this.renderIndexerTabs(response);
        this.renderTorrentResults(response, 'all');
      } else {
        this.renderTorrentError('No torrents found');
      }
    } catch (error) {
      console.error('Error loading torrents:', error);
      this.renderTorrentError('Failed to load torrents');
    } finally {
      torrentLoading.style.display = 'none';
      indexerTabs.style.display = 'block';
    }
  }

  /**
   * Render indexer tabs
   */
  renderIndexerTabs(torrents) {
    const indexerTabs = document.getElementById('indexer-tabs');
    const indexers = [...new Set(torrents.map(t => t.Tracker || 'Unknown'))].sort();
    
    const tabsHTML = `
      <div class="tab-buttons">
        <button class="tab-btn active" data-indexer="all">All (${torrents.length})</button>
        ${indexers.map(indexer => {
          const count = torrents.filter(t => (t.Tracker || 'Unknown') === indexer).length;
          return `<button class="tab-btn" data-indexer="${indexer}">${indexer} (${count})</button>`;
        }).join('')}
      </div>
    `;
    
    indexerTabs.innerHTML = tabsHTML;
    
    // Add tab click listeners
    const tabBtns = indexerTabs.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderTorrentResults(torrents, btn.dataset.indexer);
      });
    });
  }

  /**
   * Render torrent search results
   */
  renderTorrentResults(torrents, selectedIndexer = 'all') {
    const torrentResults = document.getElementById('torrent-results');
    
    const filteredTorrents = selectedIndexer === 'all' 
      ? torrents 
      : torrents.filter(t => (t.Tracker || 'Unknown') === selectedIndexer);
    
    if (!filteredTorrents.length) {
      torrentResults.innerHTML = '<p class="no-torrents">No torrents found for this indexer.</p>';
      return;
    }

    const torrentsHTML = filteredTorrents.map(torrent => `
      <div class="torrent-item">
        <div class="torrent-info">
          <h4 class="torrent-title">${torrent.Title || 'Unknown'}</h4>
          <div class="torrent-meta">
            <span class="torrent-size">${this.formatFileSize(torrent.Size || 0)}</span>
            <span class="torrent-seeds">🌱 ${torrent.Seeders || 0}</span>
            <span class="torrent-peers">🔗 ${torrent.Peers || 0}</span>
            <span class="torrent-indexer">${torrent.Tracker || 'Unknown'}</span>
          </div>
        </div>
        <div class="torrent-actions">
          <button class="btn btn-primary download-torrent-btn" 
                  data-magnet="${torrent.MagnetUri || torrent.Link}" 
                  data-title="${torrent.Title || 'Unknown'}">
            ⬇️ Download
          </button>
        </div>
      </div>
    `).join('');

    torrentResults.innerHTML = torrentsHTML;

    // Add download button listeners
    const downloadBtns = torrentResults.querySelectorAll('.download-torrent-btn');
    downloadBtns.forEach(btn => {
      btn.addEventListener('click', () => this.downloadTorrent(btn.dataset.magnet, btn.dataset.title));
    });
  }

  /**
   * Render torrent error
   */
  renderTorrentError(message) {
    const torrentResults = document.getElementById('torrent-results');
    torrentResults.innerHTML = `<p class="torrent-error">${message}</p>`;
  }

  /**
   * Download torrent
   */
  async downloadTorrent(magnetLink, title) {
    if (!magnetLink) {
      alert('Invalid torrent link');
      return;
    }

    try {
      const response = await api.post('/downloads/add-torrent', {
        magnetLink,
        title
      });

      if (response && response.success) {
        alert('Torrent added to download queue successfully!');
      } else {
        alert('Failed to add torrent to download queue');
      }
    } catch (error) {
      console.error('Error downloading torrent:', error);
      alert('Failed to add torrent to download queue');
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}