import { apiService } from '../services/api.js'

export default {
  path: '/search/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="search">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link back">
                <i class="f7-icons">chevron_left</i>
                <span class="back-text">Back</span>
              </a>
            </div>
            <div class="title">Search</div>
            <div class="right">
              <a href="#" class="link" id="search-filters">
                <i class="f7-icons">slider_horizontal_3</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- Search Bar -->
          <div class="searchbar searchbar-init searchbar-expandable">
            <div class="searchbar-inner">
              <div class="searchbar-input-wrap">
                <input type="search" placeholder="Search movies and TV shows..." id="search-input" />
                <i class="searchbar-icon"></i>
                <span class="input-clear-button"></span>
              </div>
              <span class="searchbar-disable-button">Cancel</span>
            </div>
          </div>

          <!-- Search Filters -->
          <div class="block" id="search-filters-block">
            <div class="segmented">
              <a href="#" class="button button-active" data-type="all">All</a>
              <a href="#" class="button" data-type="movie">Movies</a>
              <a href="#" class="button" data-type="tv">TV Shows</a>
            </div>
          </div>

          <!-- Loading State -->
          <div class="block text-align-center" id="search-loading" style="display: none;">
            <div class="preloader"></div>
            <p>Searching...</p>
          </div>

          <!-- No Results State -->
          <div class="block text-align-center" id="no-results" style="display: none;">
            <i class="f7-icons" style="font-size: 48px; color: var(--f7-color-gray);">magnifyingglass</i>
            <p class="color-gray">No results found</p>
            <p class="color-gray">Try different keywords or check your spelling</p>
          </div>

          <!-- Search Results -->
          <div class="block" id="search-results">
            <div class="media-grid" id="results-grid">
              <!-- Results will be populated here -->
            </div>
          </div>

          <!-- Load More Button -->
          <div class="block text-align-center" id="load-more-block" style="display: none;">
            <button class="button button-outline" id="load-more-btn">
              Load More Results
            </button>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        searchQuery: '',
        searchType: 'all',
        currentPage: 1,
        totalPages: 1,
        results: [],
        isLoading: false
      },
      on: {
        pageInit: function () {
          console.log('Search page initialized')
          this.setupEventListeners()
          
          // Check if there's an initial query from props
          if (to.route.props && to.route.props.initialQuery) {
            this.data.searchQuery = to.route.props.initialQuery
            this.$el.find('#search-input').val(this.data.searchQuery)
            this.performSearch()
          }
        }
      },
      methods: {
        setupEventListeners() {
          // Search input handler
          this.$el.find('#search-input').on('input', (e) => {
            clearTimeout(this.searchTimeout)
            this.data.searchQuery = e.target.value.trim()
            
            if (this.data.searchQuery.length >= 2) {
              this.searchTimeout = setTimeout(() => {
                this.resetSearch()
                this.performSearch()
              }, 500)
            } else {
              this.clearResults()
            }
          })

          // Search type filters
          this.$el.find('[data-type]').on('click', (e) => {
            e.preventDefault()
            const button = this.$app.$(e.currentTarget)
            const type = button.data('type')
            
            // Update active button
            this.$el.find('[data-type]').removeClass('button-active')
            button.addClass('button-active')
            
            this.data.searchType = type
            
            if (this.data.searchQuery.length >= 2) {
              this.resetSearch()
              this.performSearch()
            }
          })

          // Load more button
          this.$el.find('#load-more-btn').on('click', () => {
            this.loadMoreResults()
          })

          // Result clicks
          this.$el.find('#results-grid').on('click', '.media-card', (e) => {
            const card = this.$app.$(e.currentTarget)
            const id = card.data('id')
            const type = card.data('type')
            
            this.$app.view.main.router.navigate(`/media/${type}/${id}/`)
          })
        },

        async performSearch() {
          if (this.data.isLoading || !this.data.searchQuery) return

          this.data.isLoading = true
          this.showLoadingState()

          try {
            const params = {
              query: this.data.searchQuery,
              page: this.data.currentPage
            }

            if (this.data.searchType !== 'all') {
              params.type = this.data.searchType
            }

            const response = await apiService.get('/media/search', { params })

            if (response.success) {
              const data = response.data
              
              if (this.data.currentPage === 1) {
                this.data.results = data.results || []
              } else {
                this.data.results = [...this.data.results, ...(data.results || [])]
              }
              
              this.data.totalPages = data.total_pages || 1
              this.renderResults()
              
              if (this.data.results.length === 0) {
                this.showNoResults()
              } else {
                this.showLoadMoreButton()
              }
            } else {
              throw new Error(response.message || 'Search failed')
            }
          } catch (error) {
            console.error('Search error:', error)
            this.$app.showError('Failed to search. Please try again.')
          } finally {
            this.data.isLoading = false
            this.hideLoadingState()
          }
        },

        async loadMoreResults() {
          if (this.data.currentPage >= this.data.totalPages) return

          this.data.currentPage++
          await this.performSearch()
        },

        renderResults() {
          const container = this.$el.find('#results-grid')
          
          if (this.data.currentPage === 1) {
            container.empty()
          }

          this.data.results.forEach((item, index) => {
            if (index < this.data.results.length - (this.data.currentPage === 1 ? 0 : 20)) {
              return // Skip already rendered items
            }

            const mediaType = item.media_type || this.data.searchType
            const title = item.title || item.name
            const releaseDate = item.release_date || item.first_air_date
            const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
            
            const cardHtml = `
              <div class="media-card" data-id="${item.id}" data-type="${mediaType}">
                <div class="media-poster">
                  ${item.poster_path ? 
                    `<img src="https://image.tmdb.org/t/p/w300${item.poster_path}" alt="${title}" loading="lazy" />` :
                    '<div class="media-placeholder"><i class="f7-icons">film</i></div>'
                  }
                  <div class="media-overlay">
                    <div class="media-rating">
                      <i class="f7-icons">star_fill</i>
                      ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                </div>
                <div class="media-info">
                  <div class="media-title">${title}</div>
                  <div class="media-meta">
                    <span class="media-type">${mediaType === 'tv' ? 'TV Show' : 'Movie'}</span>
                    ${year ? ` • ${year}` : ''}
                  </div>
                </div>
              </div>
            `
            
            container.append(cardHtml)
          })
        },

        resetSearch() {
          this.data.currentPage = 1
          this.data.results = []
          this.clearResults()
        },

        clearResults() {
          this.$el.find('#results-grid').empty()
          this.$el.find('#no-results').hide()
          this.$el.find('#load-more-block').hide()
        },

        showLoadingState() {
          this.$el.find('#search-loading').show()
          this.$el.find('#no-results').hide()
        },

        hideLoadingState() {
          this.$el.find('#search-loading').hide()
        },

        showNoResults() {
          this.$el.find('#no-results').show()
          this.$el.find('#load-more-block').hide()
        },

        showLoadMoreButton() {
          if (this.data.currentPage < this.data.totalPages) {
            this.$el.find('#load-more-block').show()
          } else {
            this.$el.find('#load-more-block').hide()
          }
        }
      }
    })
  }
}