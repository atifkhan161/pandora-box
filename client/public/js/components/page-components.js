/**
 * Page Components for Pandora Box PWA
 * Components for rendering different pages in the application
 */

class PageComponents {
  /**
   * Create the login page
   */
  static createLoginPage() {
    const container = document.createElement('div');
    container.className = 'login-page';
    
    container.innerHTML = `
      <div class="login-container">
        <div class="login-header">
          <h1 class="login-title">Pandora Box</h1>
          <p class="login-subtitle">Your Media Management System</p>
        </div>
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" class="form-control" required autocomplete="username">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" class="form-control" required autocomplete="current-password">
          </div>
          <div class="form-group">
            <div class="checkbox">
              <input type="checkbox" id="remember" name="remember">
              <label for="remember">Remember me</label>
            </div>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary btn-block">Login</button>
          </div>
          <div id="login-error" class="alert alert-error" style="display: none;"></div>
        </form>
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create the dashboard page
   */
  static createDashboardPage() {
    const container = document.createElement('div');
    container.className = 'dashboard-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
      </div>
      
      <div class="section mb-lg">
        <div class="section-header">
          <h2 class="section-title">Recently Added</h2>
          <a href="#/media" class="btn btn-text">View All</a>
        </div>
        <div id="recent-media" class="media-grid">
          <!-- Media cards will be inserted here -->
        </div>
      </div>
      
      <div class="section mb-lg">
        <div class="section-header">
          <h2 class="section-title">Active Downloads</h2>
          <a href="#/downloads" class="btn btn-text">View All</a>
        </div>
        <div id="active-downloads" class="list">
          <!-- Download items will be inserted here -->
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">System Status</h2>
        </div>
        <div class="grid grid-cols-2 gap-md">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title">Storage</h3>
              <div class="progress mb-sm">
                <div id="storage-progress" class="progress-bar" style="width: 0%"></div>
              </div>
              <div class="flex justify-between">
                <span id="storage-used">0 GB</span>
                <span id="storage-total">0 GB</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <h3 class="card-title">System Resources</h3>
              <div class="mb-sm">
                <div class="flex justify-between mb-xs">
                  <span>CPU</span>
                  <span id="cpu-usage">0%</span>
                </div>
                <div class="progress">
                  <div id="cpu-progress" class="progress-bar" style="width: 0%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-xs">
                  <span>Memory</span>
                  <span id="memory-usage">0%</span>
                </div>
                <div class="progress">
                  <div id="memory-progress" class="progress-bar" style="width: 0%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create the media library page
   */
  static createMediaPage() {
    const container = document.createElement('div');
    container.className = 'media-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Media Library</h1>
        <div class="page-actions">
          <div class="search-container">
            <input type="text" id="media-search" class="search-input" placeholder="Search media...">
            <button id="media-search-btn" class="search-button" aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
          <div class="dropdown">
            <button class="btn btn-outline dropdown-toggle" id="media-filter">
              <span>All Media</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="dropdown-menu">
              <a href="#" data-filter="all" class="dropdown-item active">All Media</a>
              <a href="#" data-filter="movie" class="dropdown-item">Movies</a>
              <a href="#" data-filter="show" class="dropdown-item">TV Shows</a>
            </div>
          </div>
        </div>
      </div>
      
      <div id="media-container" class="media-grid">
        <!-- Media cards will be inserted here -->
      </div>
      
      <div id="media-pagination" class="pagination">
        <!-- Pagination will be inserted here -->
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create the downloads page
   */
  static createDownloadsPage() {
    const container = document.createElement('div');
    container.className = 'downloads-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Downloads</h1>
        <div class="page-actions">
          <button id="add-download" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Download
          </button>
        </div>
      </div>
      
      <div class="tabs mb-md">
        <button class="tab active" data-tab="all">All</button>
        <button class="tab" data-tab="downloading">Downloading</button>
        <button class="tab" data-tab="completed">Completed</button>
        <button class="tab" data-tab="seeding">Seeding</button>
        <button class="tab" data-tab="paused">Paused</button>
      </div>
      
      <div id="downloads-container" class="list">
        <!-- Download items will be inserted here -->
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create the files page
   */
  static createFilesPage() {
    const container = document.createElement('div');
    container.className = 'files-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">File Manager</h1>
        <div class="page-actions">
          <button id="upload-file" class="btn btn-outline mr-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
            </svg>
            Upload
          </button>
          <button id="create-folder" class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
              <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/>
            </svg>
            New Folder
          </button>
        </div>
      </div>
      
      <div class="breadcrumb mb-md">
        <ol id="file-path">
          <li><a href="#" data-path="/">Home</a></li>
        </ol>
      </div>
      
      <div id="files-container" class="list">
        <!-- File items will be inserted here -->
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create the Docker containers page
   */
  static createContainersPage() {
    const container = document.createElement('div');
    container.className = 'containers-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Docker Containers</h1>
        <div class="page-actions">
          <button id="refresh-containers" class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      <div id="containers-container">
        <!-- Container items will be inserted here -->
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create the Jellyfin page (iframe wrapper)
   */
  static createJellyfinPage() {
    const container = document.createElement('div');
    container.className = 'jellyfin-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Jellyfin</h1>
        <div class="page-actions">
          <button id="refresh-jellyfin" class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Refresh
          </button>
          <button id="open-jellyfin" class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
              <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
            Open in New Tab
          </button>
        </div>
      </div>
      
      <div class="iframe-container">
        <iframe id="jellyfin-iframe" title="Jellyfin Media Server" sandbox="allow-same-origin allow-scripts allow-forms" loading="lazy"></iframe>
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create the settings page
   */
  static createSettingsPage() {
    const container = document.createElement('div');
    container.className = 'settings-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
      </div>
      
      <div class="tabs mb-md">
        <button class="tab active" data-tab="general">General</button>
        <button class="tab" data-tab="appearance">Appearance</button>
        <button class="tab" data-tab="downloads">Downloads</button>
        <button class="tab" data-tab="media">Media</button>
        <button class="tab" data-tab="system">System</button>
      </div>
      
      <div class="tab-content" id="general-tab">
        <div class="card mb-md">
          <div class="card-header">
            <h2 class="card-title">User Settings</h2>
          </div>
          <div class="card-body">
            <form id="user-settings-form">
              <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="settings-username" class="form-control" disabled>
              </div>
              <div class="form-group">
                <label for="change-password">Change Password</label>
                <button id="change-password" class="btn btn-outline">Change Password</button>
              </div>
            </form>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Application Settings</h2>
          </div>
          <div class="card-body">
            <form id="app-settings-form">
              <div class="form-group">
                <label for="default-page">Default Page</label>
                <select id="default-page" class="form-control">
                  <option value="dashboard">Dashboard</option>
                  <option value="media">Media Library</option>
                  <option value="downloads">Downloads</option>
                  <option value="files">File Manager</option>
                </select>
              </div>
              <div class="form-group">
                <div class="checkbox">
                  <input type="checkbox" id="enable-notifications" name="enable-notifications">
                  <label for="enable-notifications">Enable Push Notifications</label>
                </div>
              </div>
              <div class="form-group">
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div class="tab-content hidden" id="appearance-tab">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Theme Settings</h2>
          </div>
          <div class="card-body">
            <form id="theme-settings-form">
              <div class="form-group">
                <label>Theme Mode</label>
                <div class="radio-group">
                  <div class="radio">
                    <input type="radio" id="theme-light" name="theme" value="light">
                    <label for="theme-light">Light</label>
                  </div>
                  <div class="radio">
                    <input type="radio" id="theme-dark" name="theme" value="dark">
                    <label for="theme-dark">Dark</label>
                  </div>
                  <div class="radio">
                    <input type="radio" id="theme-system" name="theme" value="system">
                    <label for="theme-system">System Default</label>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="accent-color">Accent Color</label>
                <div class="color-options">
                  <div class="color-option" data-color="blue">
                    <input type="radio" id="color-blue" name="accent-color" value="blue">
                    <label for="color-blue" style="background-color: var(--color-primary);"></label>
                  </div>
                  <div class="color-option" data-color="purple">
                    <input type="radio" id="color-purple" name="accent-color" value="purple">
                    <label for="color-purple" style="background-color: #9c27b0;"></label>
                  </div>
                  <div class="color-option" data-color="green">
                    <input type="radio" id="color-green" name="accent-color" value="green">
                    <label for="color-green" style="background-color: #4caf50;"></label>
                  </div>
                  <div class="color-option" data-color="orange">
                    <input type="radio" id="color-orange" name="accent-color" value="orange">
                    <label for="color-orange" style="background-color: #ff9800;"></label>
                  </div>
                  <div class="color-option" data-color="red">
                    <input type="radio" id="color-red" name="accent-color" value="red">
                    <label for="color-red" style="background-color: #f44336;"></label>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div class="tab-content hidden" id="downloads-tab">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Download Settings</h2>
          </div>
          <div class="card-body">
            <form id="download-settings-form">
              <div class="form-group">
                <label for="download-location">Default Download Location</label>
                <input type="text" id="download-location" class="form-control" placeholder="/downloads">
              </div>
              <div class="form-group">
                <label for="max-downloads">Maximum Concurrent Downloads</label>
                <input type="number" id="max-downloads" class="form-control" min="1" max="10" value="3">
              </div>
              <div class="form-group">
                <div class="checkbox">
                  <input type="checkbox" id="auto-extract" name="auto-extract">
                  <label for="auto-extract">Automatically Extract Archives</label>
                </div>
              </div>
              <div class="form-group">
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div class="tab-content hidden" id="media-tab">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Media Settings</h2>
          </div>
          <div class="card-body">
            <form id="media-settings-form">
              <div class="form-group">
                <label for="media-location">Media Library Location</label>
                <input type="text" id="media-location" class="form-control" placeholder="/media">
              </div>
              <div class="form-group">
                <div class="checkbox">
                  <input type="checkbox" id="auto-organize" name="auto-organize">
                  <label for="auto-organize">Automatically Organize Media Files</label>
                </div>
              </div>
              <div class="form-group">
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div class="tab-content hidden" id="system-tab">
        <div class="card mb-md">
          <div class="card-header">
            <h2 class="card-title">System Information</h2>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-md">
              <div>
                <p><strong>Version:</strong> <span id="app-version">1.0.0</span></p>
                <p><strong>Server:</strong> <span id="server-info">Loading...</span></p>
                <p><strong>Database:</strong> <span id="db-info">Loading...</span></p>
              </div>
              <div>
                <p><strong>Storage:</strong> <span id="storage-info">Loading...</span></p>
                <p><strong>CPU:</strong> <span id="cpu-info">Loading...</span></p>
                <p><strong>Memory:</strong> <span id="memory-info">Loading...</span></p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">System Actions</h2>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-md">
              <button id="restart-services" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Restart Services
              </button>
              <button id="clear-cache" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
                  <path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z"/>
                </svg>
                Clear Cache
              </button>
              <button id="check-updates" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
                  <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79 2.73 2.71 7.15 2.71 9.88 0 1.36-1.35 2.04-3.13 2.04-4.91h2c0 2.34-.93 4.62-2.77 6.24-3.53 3.5-9.24 3.5-12.77 0-3.53-3.49-3.53-9.15 0-12.64 3.53-3.5 9.24-3.5 12.77 0l2.77-2.83v7.27z"/>
                </svg>
                Check for Updates
              </button>
              <button id="system-logs" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                View System Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create a media details modal
   */
  static createMediaDetailsModal(media) {
    // Default values if properties are missing
    const title = media.title || 'Unknown Title';
    const overview = media.overview || 'No description available.';
    const posterUrl = media.poster || '/assets/images/placeholder-poster.jpg';
    const backdropUrl = media.backdrop || '/assets/images/placeholder-backdrop.jpg';
    const year = media.year || 'Unknown';
    const rating = media.rating || 'N/A';
    const runtime = media.runtime ? `${media.runtime} min` : 'Unknown';
    const genres = media.genres ? media.genres.join(', ') : 'Unknown';
    
    // Create modal content
    const content = `
      <div class="media-details">
        <div class="media-backdrop" style="background-image: url('${backdropUrl}')"></div>
        <div class="media-info">
          <div class="media-poster">
            <img src="${posterUrl}" alt="${title} poster">
          </div>
          <div class="media-meta">
            <h2>${title} ${year ? `(${year})` : ''}</h2>
            
            <div class="media-stats">
              <span class="media-rating">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                ${rating}
              </span>
              <span class="media-runtime">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                ${runtime}
              </span>
              <span class="media-type">${media.type === 'show' ? 'TV Show' : 'Movie'}</span>
            </div>
            
            <div class="media-genres">${genres}</div>
            
            <p class="media-overview">${overview}</p>
            
            ${media.type === 'show' ? `
              <div class="media-seasons">
                <h3>Seasons</h3>
                <div class="select-container">
                  <select id="season-select" class="form-control">
                    ${Array.from({length: media.seasons || 1}, (_, i) => `
                      <option value="${i+1}">Season ${i+1}</option>
                    `).join('')}
                  </select>
                </div>
                <div id="episodes-list" class="list mt-sm">
                  <div class="loading-indicator">
                    <div class="loader loader-sm"></div>
                    <span>Loading episodes...</span>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Create footer with action buttons
    const footer = `
      <button id="play-media" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Play
      </button>
      <button id="download-media" class="btn btn-outline">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Download
      </button>
    `;
    
    return UIComponents.createModal({
      id: `media-modal-${media.id}`,
      title: '',  // We'll use custom title in the content
      content: content,
      footer: footer,
      closeOnBackdrop: true
    });
  }
  
  /**
   * Create an episode item for TV shows
   */
  static createEpisodeItem(episode) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.dataset.id = episode.id;
    
    // Default values if properties are missing
    const title = episode.title || `Episode ${episode.episode}`;
    const overview = episode.overview || 'No description available.';
    const thumbnailUrl = episode.thumbnail || '/assets/images/placeholder-thumbnail.jpg';
    const runtime = episode.runtime ? UIComponents.formatDuration(episode.runtime * 60) : 'Unknown';
    
    item.innerHTML = `
      <div class="episode-thumbnail">
        <img src="${thumbnailUrl}" alt="${title} thumbnail" loading="lazy">
        <button class="play-button" aria-label="Play ${title}">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
      <div class="list-item-content">
        <div class="flex justify-between mb-xs">
          <div class="list-item-title">${episode.episode}. ${title}</div>
          <span>${runtime}</span>
        </div>
        <div class="list-item-subtitle">${overview}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-icon btn-text" data-action="download" aria-label="Download episode">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>
    `;
    
    return item;
  }
  
  /**
   * Create a search results page
   */
  static createSearchResultsPage(query) {
    const container = document.createElement('div');
    container.className = 'search-results-page';
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Search Results</h1>
        <div class="page-actions">
          <div class="search-container">
            <input type="text" id="search-input" class="search-input" value="${query}" placeholder="Search...">
            <button id="search-btn" class="search-button" aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div class="tabs mb-md">
        <button class="tab active" data-tab="all">All</button>
        <button class="tab" data-tab="movies">Movies</button>
        <button class="tab" data-tab="shows">TV Shows</button>
        <button class="tab" data-tab="files">Files</button>
      </div>
      
      <div id="search-results-container">
        <!-- Search results will be inserted here -->
        <div class="loading-indicator">
          <div class="loader loader-lg"></div>
          <p>Searching for "${query}"...</p>
        </div>
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create an error page
   */
  static createErrorPage(error) {
    const container = document.createElement('div');
    container.className = 'error-page';
    
    container.innerHTML = `
      <div class="error-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h1>Error</h1>
        <p>${error.message || 'An unexpected error occurred.'}</p>
        <button id="go-home" class="btn btn-primary mt-md">Go to Dashboard</button>
      </div>
    `;
    
    return container;
  }
  
  /**
   * Create a pagination component
   */
  static createPagination(currentPage, totalPages, onPageChange) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Don't show pagination if there's only one page
    if (totalPages <= 1) {
      return pagination;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-item';
    prevButton.disabled = currentPage === 1;
    prevButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    `;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    });
    pagination.appendChild(prevButton);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page button if not visible
    if (startPage > 1) {
      const firstPageButton = document.createElement('button');
      firstPageButton.className = 'pagination-item';
      firstPageButton.textContent = '1';
      firstPageButton.addEventListener('click', () => onPageChange(1));
      pagination.appendChild(firstPageButton);
      
      // Ellipsis if needed
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('button');
      pageButton.className = `pagination-item ${i === currentPage ? 'active' : ''}`;
      pageButton.textContent = i.toString();
      pageButton.addEventListener('click', () => onPageChange(i));
      pagination.appendChild(pageButton);
    }
    
    // Last page button if not visible
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagination.appendChild(ellipsis);
      }
      
      const lastPageButton = document.createElement('button');
      lastPageButton.className = 'pagination-item';
      lastPageButton.textContent = totalPages.toString();
      lastPageButton.addEventListener('click', () => onPageChange(totalPages));
      pagination.appendChild(lastPageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-item';
    nextButton.disabled = currentPage === totalPages;
    nextButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    `;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    });
    pagination.appendChild(nextButton);
    
    return pagination;
  }
}

// Export the page components
window.PageComponents = PageComponents;