import { apiService } from '../services/api.js'
import websocketService from '../services/websocket.js'

export default {
  path: '/',
  async: function ({ router, to, resolve, reject }) {
    // Page template
    const template = `
      <div class="page" data-name="dashboard">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link panel-open" data-panel="left">
                <i class="f7-icons">menu</i>
              </a>
            </div>
            <div class="title">Pandora Box</div>
            <div class="right">
              <a href="/search/" class="link">
                <i class="f7-icons">search</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- Quick Stats -->
          <div class="block-title">Quick Stats</div>
          <div class="block">
            <div class="row">
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="active-downloads">-</div>
                    <div class="stats-label">Active Downloads</div>
                  </div>
                </div>
              </div>
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="library-items">-</div>
                    <div class="stats-label">Library Items</div>
                  </div>
                </div>
              </div>
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="running-containers">-</div>
                    <div class="stats-label">Running Containers</div>
                  </div>
                </div>
              </div>
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="disk-usage">-</div>
                    <div class="stats-label">Disk Usage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trending Movies -->
          <div class="block-title">Trending Movies</div>
          <div class="block">
            <div class="row" id="trending-movies">
              <!-- Loading skeleton -->
              <div class="col-100">
                <div class="preloader"></div>
                <p class="text-align-center">Loading trending movies...</p>
              </div>
            </div>
          </div>

          <!-- Trending TV Shows -->
          <div class="block-title">Trending TV Shows</div>
          <div class="block">
            <div class="row" id="trending-tv">
              <!-- Loading skeleton -->
              <div class="col-100">
                <div class="preloader"></div>
                <p class="text-align-center">Loading trending TV shows...</p>
              </div>
            </div>
          </div>

          <!-- Recent Downloads -->
          <div class="block-title">Recent Downloads</div>
          <div class="list downloads-list" id="recent-downloads">
            <ul>
              <!-- Loading skeleton -->
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">
                    <div class="preloader"></div>
                    <span>Loading downloads...</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Quick Actions -->
          <div class="block-title">Quick Actions</div>
          <div class="block">
            <div class="row">
              <div class="col-50">
                <a href="/torrent-search/" class="button button-fill color-red">
                  <i class="f7-icons">search</i> Search Torrents
                </a>
              </div>
              <div class="col-50">
                <a href="/files/" class="button button-fill color-blue">
                  <i class="f7-icons">folder</i> Manage Files
                </a>
              </div>
            </div>
            <div class="row margin-top">
              <div class="col-50">
                <a href="/docker/" class="button button-fill color-green">
                  <i class="f7-icons">gear</i> Docker Control
                </a>
              </div>
              <div class="col-50">
                <button class="button button-fill color-orange" id="scan-library">
                  <i class="f7-icons">arrow_clockwise</i> Scan Library
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        trendingMovies: [],
        trendingTV: [],
        recentDownloads: [],
        stats: {
          activeDownloads: 0,
          libraryItems: 0,
          runningContainers: 0,
          diskUsage: '0%'
        }
      },
      on: {
        pageInit: function () {
          console.log('Dashboard page initialized')
          this.loadDashboardData()
          this.setupWebSocketListeners()
          this.setupEventListeners()
        },
        pageBeforeRemove: function () {
          this.cleanupWebSocketListeners()
        }
      },
      methods: {
        async loadDashboardData() {
          try {
            // Load all dashboard data in parallel
            await Promise.all([
              this.loadStats(),
              this.loadTrendingMovies(),
              this.loadTrendingTV(),
              this.loadRecentDownloads()
            ])
          } catch (error) {
            console.error('Error loading dashboard data:', error)
            this.$app.showError('Failed to load dashboard data')
          }
        },

        async loadStats() {
          try {
            // Get download stats
            const downloadsResponse = await apiService.get('/downloads')
            const activeDownloads = downloadsResponse.success ? 
              downloadsResponse.data.torrents.filter(t => t.status === 'downloading').length : 0

            // Get library stats
            const libraryResponse = await apiService.get('/jellyfin/stats')
            const libraryItems = libraryResponse.success ? 
              (libraryResponse.data.movies.total + libraryResponse.data.tvShows.total) : 0

            // Get container stats
            const containerResponse = await apiService.get('/docker/containers')
            const runningContainers = containerResponse.success ? 
              containerResponse.data.containers.filter(c => c.status === 'running').length : 0

            // Update UI
            this.$el.find('#active-downloads').text(activeDownloads)
            this.$el.find('#library-items').text(libraryItems)
            this.$el.find('#running-containers').text(runningContainers)
            this.$el.find('#disk-usage').text('75%') // Placeholder
          } catch (error) {
            console.error('Error loading stats:', error)
          }
        },

        async loadTrendingMovies() {
          try {
            const response = await apiService.get('/media/trending', {
              type: 'movie',
              timeWindow: 'week'
            })

            if (response.success) {
              this.data.trendingMovies = response.data.results.slice(0, 10)
              this.renderMediaGrid('#trending-movies', this.data.trendingMovies, 'movie')
            }
          } catch (error) {
            console.error('Error loading trending movies:', error)
            this.$el.find('#trending-movies').html('<p class="text-align-center">Failed to load trending movies</p>')
          }
        },

        async loadTrendingTV() {
          try {
            const response = await apiService.get('/media/trending', {
              type: 'tv',
              timeWindow: 'week'
            })

            if (response.success) {
              this.data.trendingTV = response.data.results.slice(0, 10)
              this.renderMediaGrid('#trending-tv', this.data.trendingTV, 'tv')
            }
          } catch (error) {
            console.error('Error loading trending TV:', error)
            this.$el.find('#trending-tv').html('<p class="text-align-center">Failed to load trending TV shows</p>')
          }
        },

        async loadRecentDownloads() {
          try {
            const response = await apiService.get('/downloads')

            if (response.success) {
              this.data.recentDownloads = response.data.torrents.slice(0, 5)
              this.renderDownloadsList()
            }
          } catch (error) {
            console.error('Error loading recent downloads:', error)
            this.$el.find('#recent-downloads').html('<p class="text-align-center">Failed to load downloads</p>')
          }
        },

        renderMediaGrid(containerId, items, type) {
          const container = this.$el.find(containerId)
          
          if (!items || items.length === 0) {
            container.html('<p class="text-align-center">No items found</p>')
            return
          }

          const html = items.map(item => `
            <div class="col-20">
              <div class="media-card" data-id="${item.id}" data-type="${type}">
                <img src="https://image.tmdb.org/t/p/w300${item.poster_path}" 
                     alt="${item.title || item.name}" 
                     loading="lazy"
                     onerror="this.src='/images/no-poster.jpg'">
                <div class="media-card-content">
                  <div class="media-card-title">${item.title || item.name}</div>
                  <div class="media-card-subtitle">${item.release_date ? new Date(item.release_date).getFullYear() : 
                    (item.first_air_date ? new Date(item.first_air_date).getFullYear() : '')}</div>
                  <div class="media-card-meta">
                    <span class="rating-badge">${item.vote_average?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')

          container.html(html)
        },

        renderDownloadsList() {
          const container = this.$el.find('#recent-downloads ul')
          
          if (!this.data.recentDownloads || this.data.recentDownloads.length === 0) {
            container.html('<li class="item-content"><div class="item-inner"><div class="item-title">No recent downloads</div></div></li>')
            return
          }

          const html = this.data.recentDownloads.map(download => `
            <li class="item-content">
              <div class="item-media">
                <div class="progress-circle" style="--progress: ${download.progress}%"></div>
              </div>
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${download.name}</div>
                  <div class="item-text">${download.sizeFormatted} • ${download.speed}</div>
                </div>
                <div class="item-after">
                  <span class="badge color-${this.getStatusColor(download.status)}">${download.status}</span>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        getStatusColor(status) {
          const colors = {
            downloading: 'blue',
            completed: 'green',
            paused: 'orange',
            error: 'red',
            queued: 'gray'
          }
          return colors[status] || 'gray'
        },

        setupEventListeners() {
          // Media card clicks
          this.$el.find('.media-card').on('click', (e) => {
            const card = this.$app.$(e.currentTarget)
            const id = card.data('id')
            const type = card.data('type')
            this.$app.view.main.router.navigate(`/media/${type}/${id}/`)
          })

          // Quick scan library
          this.$el.find('#scan-library').on('click', async () => {
            try {
              const response = await apiService.post('/jellyfin/scan', {
                libraryType: 'all'
              })

              if (response.success) {
                this.$app.showSuccess('Library scan started')
              } else {
                this.$app.showError('Failed to start library scan')
              }
            } catch (error) {
              console.error('Error starting library scan:', error)
              this.$app.showError('Failed to start library scan')
            }
          })
        },

        setupWebSocketListeners() {
          // Listen for download updates
          websocketService.onMessage('download', (message) => {
            if (message.event === 'status_update') {
              this.loadRecentDownloads()
              this.loadStats()
            }
          })

          // Listen for Jellyfin updates
          websocketService.onMessage('jellyfin', (message) => {
            if (message.event === 'scan_completed') {
              this.loadStats()
            }
          })
        },

        cleanupWebSocketListeners() {
          // Clean up listeners when leaving page
          websocketService.offMessage('download')
          websocketService.offMessage('jellyfin')
        }
      }
    })
  }
}