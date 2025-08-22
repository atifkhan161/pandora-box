import { apiService } from '../services/api.js'

export default {
  path: '/media/:type/:id/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="media-details">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link back">
                <i class="f7-icons">chevron_left</i>
                <span class="back-text">Back</span>
              </a>
            </div>
            <div class="title" id="media-title">Loading...</div>
            <div class="right">
              <a href="#" class="link" id="search-torrents">
                <i class="f7-icons">search</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- Loading State -->
          <div class="block text-align-center" id="loading-state">
            <div class="preloader"></div>
            <p>Loading media details...</p>
          </div>

          <!-- Content -->
          <div id="media-content" style="display: none;">
            <!-- Hero Section -->
            <div class="block no-padding" id="hero-section">
              <div class="media-hero">
                <div class="media-backdrop" id="backdrop-image"></div>
                <div class="media-hero-content">
                  <div class="row">
                    <div class="col-30">
                      <img id="poster-image" class="media-poster" alt="Poster" />
                    </div>
                    <div class="col-70">
                      <div class="media-info">
                        <h1 id="media-title-main" class="media-title"></h1>
                        <div class="media-meta">
                          <span class="rating-badge" id="rating-badge"></span>
                          <span id="release-year"></span>
                          <span id="runtime"></span>
                        </div>
                        <div class="media-genres" id="genres-list"></div>
                        <p id="overview" class="media-overview"></p>
                        <div class="media-actions">
                          <button class="button button-fill color-red" id="find-torrents-btn">
                            <i class="f7-icons">search</i> Find Torrents
                          </button>
                          <button class="button button-outline color-blue" id="add-to-watchlist-btn">
                            <i class="f7-icons">heart</i> Watchlist
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Streaming Availability -->
            <div class="block" id="streaming-section">
              <div class="block-title">Where to Watch</div>
              <div class="card">
                <div class="card-content" id="streaming-content">
                  <!-- Streaming services will be populated here -->
                </div>
              </div>
            </div>

            <!-- Cast & Crew -->
            <div class="block" id="cast-section">
              <div class="block-title">Cast & Crew</div>
              <div class="horizontal-scroll-container">
                <div class="cast-list" id="cast-list">
                  <!-- Cast members will be populated here -->
                </div>
              </div>
            </div>

            <!-- TV Show Seasons (if applicable) -->
            <div class="block" id="seasons-section" style="display: none;">
              <div class="block-title">Seasons</div>
              <div class="list seasons-list" id="seasons-list">
                <ul>
                  <!-- Seasons will be populated here -->
                </ul>
              </div>
            </div>

            <!-- Similar Content -->
            <div class="block" id="similar-section">
              <div class="block-title">Similar Content</div>
              <div class="horizontal-scroll-container">
                <div class="similar-list" id="similar-list">
                  <!-- Similar content will be populated here -->
                </div>
              </div>
            </div>

            <!-- Videos & Trailers -->
            <div class="block" id="videos-section">
              <div class="block-title">Videos & Trailers</div>
              <div class="horizontal-scroll-container">
                <div class="videos-list" id="videos-list">
                  <!-- Videos will be populated here -->
                </div>
              </div>
            </div>

            <!-- Reviews -->
            <div class="block" id="reviews-section">
              <div class="block-title">Reviews</div>
              <div class="list reviews-list" id="reviews-list">
                <ul>
                  <!-- Reviews will be populated here -->
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    const mediaType = to.params.type
    const mediaId = to.params.id

    resolve({
      template,
      data: {
        mediaType,
        mediaId,
        mediaDetails: null,
        streamingInfo: null,
        cast: [],
        seasons: [],
        similar: [],
        videos: [],
        reviews: []
      },
      on: {
        pageInit: function () {
          console.log(`Media details page initialized for ${mediaType}:${mediaId}`)
          this.loadMediaDetails()
          this.setupEventListeners()
        }
      },
      methods: {
        async loadMediaDetails() {
          try {
            // Load all data in parallel
            await Promise.all([
              this.loadBasicDetails(),
              this.loadStreamingInfo(),
              this.loadCredits(),
              this.loadSimilar(),
              this.loadVideos(),
              this.loadReviews()
            ])

            // Load seasons for TV shows
            if (this.data.mediaType === 'tv') {
              await this.loadSeasons()
            }

            this.renderContent()
          } catch (error) {
            console.error('Error loading media details:', error)
            this.showError('Failed to load media details')
          }
        },

        async loadBasicDetails() {
          const response = await apiService.get(`/media/${this.data.mediaType}/${this.data.mediaId}`)
          
          if (response.success) {
            this.data.mediaDetails = response.data
          } else {
            throw new Error(response.message || 'Failed to load media details')
          }
        },

        async loadStreamingInfo() {
          try {
            const response = await apiService.get(`/media/${this.data.mediaType}/${this.data.mediaId}/streaming`)
            
            if (response.success) {
              this.data.streamingInfo = response.data
            }
          } catch (error) {
            console.error('Error loading streaming info:', error)
          }
        },

        async loadCredits() {
          try {
            const response = await apiService.get(`/media/${this.data.mediaType}/${this.data.mediaId}/credits`)
            
            if (response.success) {
              this.data.cast = response.data.cast || []
            }
          } catch (error) {
            console.error('Error loading credits:', error)
          }
        },

        async loadSeasons() {
          try {
            const response = await apiService.get(`/media/tv/${this.data.mediaId}/seasons`)
            
            if (response.success) {
              this.data.seasons = response.data.seasons || []
            }
          } catch (error) {
            console.error('Error loading seasons:', error)
          }
        },

        async loadSimilar() {
          try {
            const response = await apiService.get(`/media/${this.data.mediaType}/${this.data.mediaId}/similar`)
            
            if (response.success) {
              this.data.similar = response.data.results || []
            }
          } catch (error) {
            console.error('Error loading similar content:', error)
          }
        },

        async loadVideos() {
          try {
            const response = await apiService.get(`/media/${this.data.mediaType}/${this.data.mediaId}/videos`)
            
            if (response.success) {
              this.data.videos = response.data.results || []
            }
          } catch (error) {
            console.error('Error loading videos:', error)
          }
        },

        async loadReviews() {
          try {
            const response = await apiService.get(`/media/${this.data.mediaType}/${this.data.mediaId}/reviews`)
            
            if (response.success) {
              this.data.reviews = response.data.results || []
            }
          } catch (error) {
            console.error('Error loading reviews:', error)
          }
        },

        renderContent() {
          if (!this.data.mediaDetails) return

          const media = this.data.mediaDetails
          
          // Hide loading, show content
          this.$el.find('#loading-state').hide()
          this.$el.find('#media-content').show()

          // Set page title
          const title = media.title || media.name
          this.$el.find('#media-title').text(title)
          this.$el.find('#media-title-main').text(title)

          // Set poster and backdrop
          if (media.poster_path) {
            this.$el.find('#poster-image').attr('src', `https://image.tmdb.org/t/p/w500${media.poster_path}`)
          }
          
          if (media.backdrop_path) {
            this.$el.find('#backdrop-image').css('background-image', 
              `url(https://image.tmdb.org/t/p/w1280${media.backdrop_path})`)
          }

          // Set rating
          if (media.vote_average) {
            this.$el.find('#rating-badge').text(media.vote_average.toFixed(1))
          }

          // Set release year
          const releaseDate = media.release_date || media.first_air_date
          if (releaseDate) {
            this.$el.find('#release-year').text(new Date(releaseDate).getFullYear())
          }

          // Set runtime
          if (media.runtime) {
            const hours = Math.floor(media.runtime / 60)
            const minutes = media.runtime % 60
            this.$el.find('#runtime').text(`${hours}h ${minutes}m`)
          } else if (media.episode_run_time && media.episode_run_time.length > 0) {
            this.$el.find('#runtime').text(`${media.episode_run_time[0]}m/episode`)
          }

          // Set genres
          if (media.genres && media.genres.length > 0) {
            const genresHtml = media.genres.map(genre => 
              `<span class="genre-chip">${genre.name}</span>`
            ).join('')
            this.$el.find('#genres-list').html(genresHtml)
          }

          // Set overview
          this.$el.find('#overview').text(media.overview || 'No overview available.')

          // Render sections
          this.renderStreamingInfo()
          this.renderCast()
          this.renderSeasons()
          this.renderSimilar()
          this.renderVideos()
          this.renderReviews()
        },

        renderStreamingInfo() {
          const container = this.$el.find('#streaming-content')
          
          if (!this.data.streamingInfo || !this.data.streamingInfo.sources || this.data.streamingInfo.sources.length === 0) {
            container.html('<p class="text-align-center color-gray">No streaming information available</p>')
            return
          }

          const html = this.data.streamingInfo.sources.map(source => `
            <div class="streaming-service">
              <div class="streaming-logo">
                <img src="${source.logo_path}" alt="${source.name}" />
              </div>
              <div class="streaming-info">
                <div class="streaming-name">${source.name}</div>
                <div class="streaming-type">${source.type}</div>
                ${source.price ? `<div class="streaming-price">${source.price}</div>` : ''}
              </div>
              ${source.web_url ? `
                <a href="${source.web_url}" target="_blank" class="button button-small button-outline">
                  Watch Now
                </a>
              ` : ''}
            </div>
          `).join('')

          container.html(html)
        },

        renderCast() {
          const container = this.$el.find('#cast-list')
          
          if (!this.data.cast || this.data.cast.length === 0) {
            container.html('<p class="text-align-center color-gray">No cast information available</p>')
            return
          }

          const html = this.data.cast.slice(0, 20).map(person => `
            <div class="cast-card">
              <div class="cast-image">
                ${person.profile_path ? 
                  `<img src="https://image.tmdb.org/t/p/w185${person.profile_path}" alt="${person.name}" />` :
                  '<div class="cast-placeholder"><i class="f7-icons">person</i></div>'
                }
              </div>
              <div class="cast-info">
                <div class="cast-name">${person.name}</div>
                <div class="cast-character">${person.character || person.job}</div>
              </div>
            </div>
          `).join('')

          container.html(html)
        },

        renderSeasons() {
          if (this.data.mediaType !== 'tv' || !this.data.seasons || this.data.seasons.length === 0) {
            this.$el.find('#seasons-section').hide()
            return
          }

          this.$el.find('#seasons-section').show()
          const container = this.$el.find('#seasons-list ul')

          const html = this.data.seasons.map(season => `
            <li class="item-content item-link season-item" data-season="${season.season_number}">
              <div class="item-media">
                ${season.poster_path ? 
                  `<img src="https://image.tmdb.org/t/p/w154${season.poster_path}" class="season-poster" />` :
                  '<div class="season-placeholder"><i class="f7-icons">tv</i></div>'
                }
              </div>
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${season.name}</div>
                  <div class="item-subtitle">
                    ${season.episode_count} episodes
                    ${season.air_date ? ' • ' + new Date(season.air_date).getFullYear() : ''}
                  </div>
                  ${season.overview ? `<div class="item-text">${season.overview}</div>` : ''}
                </div>
                <div class="item-after">
                  <i class="f7-icons">chevron_right</i>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        renderSimilar() {
          const container = this.$el.find('#similar-list')
          
          if (!this.data.similar || this.data.similar.length === 0) {
            container.html('<p class="text-align-center color-gray">No similar content found</p>')
            return
          }

          const html = this.data.similar.slice(0, 10).map(item => `
            <div class="similar-card" data-id="${item.id}" data-type="${this.data.mediaType}">
              <div class="similar-image">
                ${item.poster_path ? 
                  `<img src="https://image.tmdb.org/t/p/w300${item.poster_path}" alt="${item.title || item.name}" />` :
                  '<div class="similar-placeholder"><i class="f7-icons">film</i></div>'
                }
              </div>
              <div class="similar-info">
                <div class="similar-title">${item.title || item.name}</div>
                <div class="similar-rating">${item.vote_average?.toFixed(1) || 'N/A'}</div>
              </div>
            </div>
          `).join('')

          container.html(html)
        },

        renderVideos() {
          const container = this.$el.find('#videos-list')
          
          if (!this.data.videos || this.data.videos.length === 0) {
            container.html('<p class="text-align-center color-gray">No videos available</p>')
            return
          }

          // Prioritize trailers
          const sortedVideos = [...this.data.videos].sort((a, b) => {
            if (a.type === 'Trailer' && b.type !== 'Trailer') return -1
            if (b.type === 'Trailer' && a.type !== 'Trailer') return 1
            return 0
          })

          const html = sortedVideos.slice(0, 6).map(video => `
            <div class="video-card" data-key="${video.key}" data-site="${video.site}">
              <div class="video-thumbnail">
                ${video.site === 'YouTube' ? 
                  `<img src="https://img.youtube.com/vi/${video.key}/mqdefault.jpg" alt="${video.name}" />` :
                  '<div class="video-placeholder"><i class="f7-icons">play_circle</i></div>'
                }
                <div class="video-play-button">
                  <i class="f7-icons">play_fill</i>
                </div>
              </div>
              <div class="video-info">
                <div class="video-title">${video.name}</div>
                <div class="video-type">${video.type}</div>
              </div>
            </div>
          `).join('')

          container.html(html)
        },

        renderReviews() {
          const container = this.$el.find('#reviews-list ul')
          
          if (!this.data.reviews || this.data.reviews.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title color-gray">No reviews available</div>
                </div>
              </li>
            `)
            return
          }

          const html = this.data.reviews.slice(0, 3).map(review => `
            <li class="item-content review-item">
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">
                    ${review.author}
                    ${review.author_details?.rating ? 
                      `<span class="review-rating">${review.author_details.rating}/10</span>` : 
                      ''
                    }
                  </div>
                  <div class="item-text review-content">
                    ${review.content.length > 300 ? 
                      review.content.substring(0, 300) + '...' : 
                      review.content
                    }
                  </div>
                  <div class="item-subtitle">
                    ${new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        showError(message) {
          this.$el.find('#loading-state').html(`
            <div class="text-align-center">
              <i class="f7-icons color-red" style="font-size: 48px;">exclamationmark_triangle</i>
              <p class="color-red">${message}</p>
              <button class="button button-outline" onclick="history.back()">Go Back</button>
            </div>
          `)
        },

        setupEventListeners() {
          // Find torrents button
          this.$el.find('#find-torrents-btn, #search-torrents').on('click', (e) => {
            e.preventDefault()
            const searchQuery = this.data.mediaDetails ? 
              (this.data.mediaDetails.title || this.data.mediaDetails.name) : ''
            
            this.$app.view.main.router.navigate('/torrent-search/', {
              props: { initialQuery: searchQuery }
            })
          })

          // Watchlist button
          this.$el.find('#add-to-watchlist-btn').on('click', (e) => {
            e.preventDefault()
            // TODO: Implement watchlist functionality
            this.$app.showError('Watchlist feature coming soon!')
          })

          // Similar content clicks
          this.$el.find('#similar-list').on('click', '.similar-card', (e) => {
            const card = this.$app.$(e.currentTarget)
            const id = card.data('id')
            const type = card.data('type')
            
            this.$app.view.main.router.navigate(`/media/${type}/${id}/`)
          })

          // Video clicks
          this.$el.find('#videos-list').on('click', '.video-card', (e) => {
            const card = this.$app.$(e.currentTarget)
            const key = card.data('key')
            const site = card.data('site')
            
            if (site === 'YouTube') {
              window.open(`https://www.youtube.com/watch?v=${key}`, '_blank')
            }
          })

          // Season clicks (for TV shows)
          this.$el.find('#seasons-list').on('click', '.season-item', (e) => {
            e.preventDefault()
            const seasonNumber = this.$app.$(e.currentTarget).data('season')
            
            // TODO: Navigate to season details page
            this.$app.showError('Season details page coming soon!')
          })
        }
      }
    })
  }
}