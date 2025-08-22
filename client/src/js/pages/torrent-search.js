import { apiService } from '../services/api.js'

export default {
  path: '/torrent-search/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="torrent-search">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link back">
                <i class="f7-icons">chevron_left</i>
                <span class="back-text">Back</span>
              </a>
            </div>
            <div class="title">Torrent Search</div>
            <div class="right">
              <a href="#" class="link" id="search-filters">
                <i class="f7-icons">slider_horizontal_3</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- Search Form -->
          <div class="block">
            <div class="row">
              <div class="col-80">
                <div class="item-input-wrap">
                  <input type="search" id="search-query" placeholder="Search for torrents..." />
                  <span class="input-clear-button"></span>
                </div>
              </div>
              <div class="col-20">
                <button class="button button-fill color-red" id="search-btn">
                  <i class="f7-icons">search</i>
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Search Suggestions -->
          <div class="block" id="quick-suggestions" style="display: none;">
            <div class="block-title">Quick Suggestions</div>
            <div class="chip-outline" id="suggestions-container">
              <!-- Suggestions will be populated here -->
            </div>
          </div>

          <!-- Search Filters -->
          <div class="block" id="search-filters-block" style="display: none;">
            <div class="card">
              <div class="card-content card-content-padding">
                <div class="row">
                  <div class="col-50">
                    <div class="item-input-wrap">
                      <select id="category-filter" class="input">
                        <option value="">All Categories</option>
                        <option value="movies">Movies</option>
                        <option value="tv">TV Shows</option>
                        <option value="music">Music</option>
                        <option value="games">Games</option>
                        <option value="software">Software</option>
                        <option value="books">Books</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-50">
                    <div class="item-input-wrap">
                      <select id="sort-filter" class="input">
                        <option value="seeders">Sort by Seeders</option>
                        <option value="size">Sort by Size</option>
                        <option value="date">Sort by Date</option>
                        <option value="title">Sort by Title</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="row margin-top">
                  <div class="col-50">
                    <label class="checkbox">
                      <input type="checkbox" id="verified-only">
                      <i class="icon-checkbox"></i>
                      <span>Verified only</span>
                    </label>
                  </div>
                  <div class="col-50">
                    <label class="checkbox">
                      <input type="checkbox" id="freeleech-only">
                      <i class="icon-checkbox"></i>
                      <span>Freeleech only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Search Results -->
          <div class="block" id="search-results-block" style="display: none;">
            <div class="block-title">
              Search Results 
              <span id="results-count">(0)</span>
              <span class="float-right">
                <a href="#" id="clear-results">Clear</a>
              </span>
            </div>
            
            <!-- Results List -->
            <div class="list search-results" id="search-results">
              <ul>
                <!-- Results will be populated here -->
              </ul>
            </div>
            
            <!-- Load More -->
            <div class="block text-align-center" id="load-more-block" style="display: none;">
              <button class="button button-outline color-red" id="load-more-btn">
                Load More Results
              </button>
            </div>
          </div>

          <!-- Recent Searches -->
          <div class="block" id="recent-searches-block">
            <div class="block-title">Recent Searches</div>
            <div class="list" id="recent-searches">
              <ul>
                <li class="item-content">
                  <div class="item-inner">
                    <div class="item-title">No recent searches</div>
                    <div class="item-subtitle">Your search history will appear here</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Popular Torrents -->
          <div class="block" id="popular-torrents-block">
            <div class="block-title">Popular Today</div>
            <div class="list" id="popular-torrents">
              <ul>
                <!-- Loading -->
                <li class="item-content">
                  <div class="item-inner">
                    <div class="item-title">
                      <div class="preloader"></div>
                      <span>Loading popular torrents...</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        searchResults: [],
        recentSearches: [],
        popularTorrents: [],
        currentQuery: '',
        currentPage: 1,
        hasMoreResults: false,
        isSearching: false
      },
      on: {
        pageInit: function () {
          console.log('Torrent Search page initialized')
          this.loadRecentSearches()
          this.loadPopularTorrents()
          this.setupEventListeners()
        }
      },
      methods: {
        async searchTorrents(query, page = 1, append = false) {
          if (!query.trim()) {
            this.$app.showError('Please enter a search query')
            return
          }

          this.data.isSearching = true
          this.$el.find('#search-btn').addClass('button-loading')

          try {
            const params = {
              query: query.trim(),
              page: page,
              category: this.$el.find('#category-filter').val(),
              sort: this.$el.find('#sort-filter').val(),
              verified: this.$el.find('#verified-only').is(':checked'),
              freeleech: this.$el.find('#freeleech-only').is(':checked')
            }

            const response = await apiService.get('/torrent/search', params)

            if (response.success) {
              const results = response.data.results || []
              
              if (append) {
                this.data.searchResults = [...this.data.searchResults, ...results]
              } else {
                this.data.searchResults = results
                this.data.currentQuery = query
                this.data.currentPage = 1
              }

              this.data.hasMoreResults = response.data.hasMore || false
              this.renderSearchResults()
              this.showSearchResults()
              this.saveSearchQuery(query)
            } else {
              throw new Error(response.message || 'Search failed')
            }
          } catch (error) {
            console.error('Search error:', error)
            this.$app.showError('Search failed. Please try again.')
            this.showSearchError()
          } finally {
            this.data.isSearching = false
            this.$el.find('#search-btn').removeClass('button-loading')
          }
        },

        renderSearchResults() {
          const container = this.$el.find('#search-results ul')
          
          if (!this.data.searchResults || this.data.searchResults.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">No results found</div>
                  <div class="item-subtitle">Try different search terms or filters</div>
                </div>
              </li>
            `)
            this.$el.find('#load-more-block').hide()
            return
          }

          const html = this.data.searchResults.map(torrent => `
            <li class="item-content torrent-item" data-link="${torrent.link}" data-magnet="${torrent.magnetUri}">
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${torrent.title}</div>
                  <div class="item-subtitle">
                    <span class="badge color-${this.getCategoryColor(torrent.category)}">${torrent.category}</span>
                    ${torrent.verified ? '<span class="badge color-green">✓</span>' : ''}
                    ${torrent.freeleech ? '<span class="badge color-blue">FL</span>' : ''}
                    <span class="tracker-name">${torrent.tracker}</span>
                  </div>
                  <div class="item-text">
                    <div class="torrent-stats">
                      <span class="stat-item">
                        <i class="f7-icons">tray_arrow_up color-green"></i>
                        ${torrent.seeders || 0}
                      </span>
                      <span class="stat-item">
                        <i class="f7-icons">tray_arrow_down color-red"></i>
                        ${torrent.leechers || 0}
                      </span>
                      <span class="stat-item">
                        <i class="f7-icons">doc color-gray"></i>
                        ${torrent.size || 'Unknown'}
                      </span>
                      <span class="stat-item">
                        <i class="f7-icons">calendar color-gray"></i>
                        ${torrent.publishDate ? new Date(torrent.publishDate).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="item-after">
                  <div class="torrent-actions">
                    <button class="button button-small button-fill color-red download-btn" 
                            data-magnet="${torrent.magnetUri}" 
                            data-title="${torrent.title}">
                      <i class="f7-icons">tray_arrow_down</i>
                    </button>
                    ${torrent.infoUrl ? `
                      <button class="button button-small button-outline info-btn" 
                              data-url="${torrent.infoUrl}">
                        <i class="f7-icons">info_circle</i>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
          
          // Update results count
          this.$el.find('#results-count').text(`(${this.data.searchResults.length})`)
          
          // Show/hide load more button
          if (this.data.hasMoreResults) {
            this.$el.find('#load-more-block').show()
          } else {
            this.$el.find('#load-more-block').hide()
          }
        },

        showSearchResults() {
          this.$el.find('#recent-searches-block').hide()
          this.$el.find('#popular-torrents-block').hide()
          this.$el.find('#search-results-block').show()
        },

        showSearchError() {
          this.$el.find('#search-results ul').html(`
            <li class="item-content">
              <div class="item-inner">
                <div class="item-title color-red">Search Failed</div>
                <div class="item-subtitle">Please check your connection and try again</div>
              </div>
            </li>
          `)
          this.showSearchResults()
        },

        getCategoryColor(category) {
          const colors = {
            movies: 'red',
            tv: 'blue',
            music: 'green',
            games: 'purple',
            software: 'orange',
            books: 'gray'
          }
          return colors[category?.toLowerCase()] || 'gray'
        },

        async downloadTorrent(magnetUri, title) {
          try {
            const response = await apiService.post('/downloads/add', {
              magnetUri: magnetUri,
              title: title
            })

            if (response.success) {
              this.$app.showSuccess('Download added successfully')
            } else {
              throw new Error(response.message || 'Failed to add download')
            }
          } catch (error) {
            console.error('Download error:', error)
            this.$app.showError('Failed to add download')
          }
        },

        saveSearchQuery(query) {
          if (!query || this.data.recentSearches.includes(query)) return

          this.data.recentSearches.unshift(query)
          if (this.data.recentSearches.length > 10) {
            this.data.recentSearches = this.data.recentSearches.slice(0, 10)
          }

          // Save to localStorage
          localStorage.setItem('pandora_recent_searches', JSON.stringify(this.data.recentSearches))
          this.renderRecentSearches()
        },

        loadRecentSearches() {
          try {
            const saved = localStorage.getItem('pandora_recent_searches')
            if (saved) {
              this.data.recentSearches = JSON.parse(saved)
              this.renderRecentSearches()
            }
          } catch (error) {
            console.error('Error loading recent searches:', error)
          }
        },

        renderRecentSearches() {
          const container = this.$el.find('#recent-searches ul')
          
          if (!this.data.recentSearches || this.data.recentSearches.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">No recent searches</div>
                  <div class="item-subtitle">Your search history will appear here</div>
                </div>
              </li>
            `)
            return
          }

          const html = this.data.recentSearches.map(query => `
            <li class="item-content item-link recent-search-item" data-query="${query}">
              <div class="item-media">
                <i class="f7-icons">clock</i>
              </div>
              <div class="item-inner">
                <div class="item-title">${query}</div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        async loadPopularTorrents() {
          try {
            const response = await apiService.get('/torrent/popular')

            if (response.success) {
              this.data.popularTorrents = response.data.results || []
              this.renderPopularTorrents()
            }
          } catch (error) {
            console.error('Error loading popular torrents:', error)
            this.$el.find('#popular-torrents ul').html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">Failed to load popular torrents</div>
                </div>
              </li>
            `)
          }
        },

        renderPopularTorrents() {
          const container = this.$el.find('#popular-torrents ul')
          
          if (!this.data.popularTorrents || this.data.popularTorrents.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">No popular torrents available</div>
                </div>
              </li>
            `)
            return
          }

          const html = this.data.popularTorrents.slice(0, 5).map(torrent => `
            <li class="item-content item-link popular-torrent-item" data-title="${torrent.title}">
              <div class="item-media">
                <i class="f7-icons">flame color-red"></i>
              </div>
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${torrent.title}</div>
                  <div class="item-subtitle">
                    <span class="badge color-${this.getCategoryColor(torrent.category)}">${torrent.category}</span>
                    ${torrent.size || 'Unknown size'}
                  </div>
                </div>
                <div class="item-after">
                  <span class="badge color-green">${torrent.seeders || 0}</span>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        setupEventListeners() {
          // Search button
          this.$el.find('#search-btn').on('click', (e) => {
            e.preventDefault()
            const query = this.$el.find('#search-query').val()
            this.searchTorrents(query)
          })

          // Search input enter key
          this.$el.find('#search-query').on('keypress', (e) => {
            if (e.which === 13) {
              const query = this.$app.$(e.currentTarget).val()
              this.searchTorrents(query)
            }
          })

          // Search input focus/blur for suggestions
          this.$el.find('#search-query').on('focus', () => {
            if (this.data.recentSearches.length > 0) {
              this.$el.find('#quick-suggestions').show()
              this.renderQuickSuggestions()
            }
          })

          this.$el.find('#search-query').on('blur', () => {
            setTimeout(() => {
              this.$el.find('#quick-suggestions').hide()
            }, 200)
          })

          // Download buttons
          this.$el.find('#search-results').on('click', '.download-btn', (e) => {
            e.stopPropagation()
            const button = this.$app.$(e.currentTarget)
            const magnetUri = button.data('magnet')
            const title = button.data('title')
            
            this.downloadTorrent(magnetUri, title)
          })

          // Info buttons
          this.$el.find('#search-results').on('click', '.info-btn', (e) => {
            e.stopPropagation()
            const button = this.$app.$(e.currentTarget)
            const url = button.data('url')
            
            if (url) {
              window.open(url, '_blank')
            }
          })

          // Recent search items
          this.$el.find('#recent-searches').on('click', '.recent-search-item', (e) => {
            e.preventDefault()
            const query = this.$app.$(e.currentTarget).data('query')
            this.$el.find('#search-query').val(query)
            this.searchTorrents(query)
          })

          // Popular torrent items
          this.$el.find('#popular-torrents').on('click', '.popular-torrent-item', (e) => {
            e.preventDefault()
            const title = this.$app.$(e.currentTarget).data('title')
            this.$el.find('#search-query').val(title)
            this.searchTorrents(title)
          })

          // Search filters toggle
          this.$el.find('#search-filters').on('click', (e) => {
            e.preventDefault()
            const filtersBlock = this.$el.find('#search-filters-block')
            filtersBlock.toggle()
          })

          // Load more results
          this.$el.find('#load-more-btn').on('click', (e) => {
            e.preventDefault()
            this.data.currentPage++
            this.searchTorrents(this.data.currentQuery, this.data.currentPage, true)
          })

          // Clear results
          this.$el.find('#clear-results').on('click', (e) => {
            e.preventDefault()
            this.clearSearchResults()
          })
        },

        renderQuickSuggestions() {
          const container = this.$el.find('#suggestions-container')
          const suggestions = this.data.recentSearches.slice(0, 5)
          
          const html = suggestions.map(query => `
            <div class="chip chip-outline suggestion-chip" data-query="${query}">
              <div class="chip-label">${query}</div>
            </div>
          `).join('')

          container.html(html)

          // Handle suggestion clicks
          container.find('.suggestion-chip').on('click', (e) => {
            const query = this.$app.$(e.currentTarget).data('query')
            this.$el.find('#search-query').val(query)
            this.searchTorrents(query)
            this.$el.find('#quick-suggestions').hide()
          })
        },

        clearSearchResults() {
          this.data.searchResults = []
          this.data.currentQuery = ''
          this.data.currentPage = 1
          this.data.hasMoreResults = false
          
          this.$el.find('#search-results-block').hide()
          this.$el.find('#recent-searches-block').show()
          this.$el.find('#popular-torrents-block').show()
          this.$el.find('#search-query').val('')
        }
      }
    })
  }
}