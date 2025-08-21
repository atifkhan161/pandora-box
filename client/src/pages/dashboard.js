// dashboard.js

export async function initDashboard() {
  console.log('Dashboard page initialized');
  const dashboardPage = document.getElementById('dashboard-page');

  // Show loading state
  dashboardPage.innerHTML = '<div class="text-center"><span class="loader loader-lg"></span><p>Loading dashboard...</p></div>';

  // Fetch data from API
  const [mediaStats, downloadStats, systemStats, trendingMovies, trendingTvShows] = await Promise.all([
    window.app.apiRequest('/library/stats'),
    window.app.apiRequest('/downloads/stats'),
    window.app.apiRequest('/system/stats'),
    window.app.apiRequest('/movies/trending'),
    window.app.apiRequest('/tvshows/trending')
  ]);

  console.log('Trending Movies:', trendingMovies);
  console.log('Trending TV Shows:', trendingTvShows);

  // Build dashboard content
  const htmlResponse = await fetch('/pages/dashboard.html');
  let html = await htmlResponse.text();

  // Replace placeholders with actual data
  html = html.replace('{{mediaStats.movies}}', mediaStats.movies || 0);
  html = html.replace('{{mediaStats.shows}}', mediaStats.shows || 0);
  html = html.replace('{{mediaStats.episodes}}', mediaStats.episodes || 0);
  html = html.replace('{{downloadStats.active}}', downloadStats.active || 0);
  html = html.replace('{{downloadStats.completed}}', downloadStats.completed || 0);
  html = html.replace('{{downloadStats.paused}}', downloadStats.paused || 0);
  html = html.replace('{{systemStats.cpu}}', systemStats.cpu || 0);
  html = html.replace('{{systemStats.memory}}', systemStats.memory || 0);
  html = html.replace('{{systemStats.disk}}', systemStats.disk || 0);
  html = html.replace('{{renderMediaGrid(mediaStats.recent)}}', renderMediaGrid(mediaStats.recent || []));
  html = html.replace('{{renderMediaGrid(trendingMovies)}}', renderMediaGrid(trendingMovies || []));
  html = html.replace('{{renderMediaGrid(trendingTvShows)}}', renderMediaGrid(trendingTvShows || []));

  dashboardPage.innerHTML = html;

  // Set up event listeners for navigation buttons
  dashboardPage.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => {
      const page = button.getAttribute('data-page');
      window.app.navigateTo(page);
    });
  });
}

/**
 * Render a grid of media items
 */
function renderMediaGrid(items) {
  if (!items || items.length === 0) {
    return '<p>No recent media found.</p>';
  }

  return items.map(item => `
    <div class="media-card">
      <img src="${item.poster || '/assets/images/placeholder-poster.jpg'}" alt="${item.title}" class="media-card-image">
      <div class="media-card-overlay">
        <h4 class="media-card-title">${item.title}</h4>
        <div class="media-card-info">${item.year || ''} ${item.media_type === 'tv' ? '• TV Show' : '• Movie'}</div>
      </div>
      <div class="media-card-actions">
        <button class="media-card-action" data-id="${item.id}" data-action="play">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button class="media-card-action" data-id="${item.id}" data-action="info">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}