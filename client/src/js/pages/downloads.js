import { apiService } from '../services/api.js'
import websocketService from '../services/websocket.js'

export default {
  path: '/downloads/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="downloads">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link back">
                <i class="f7-icons">chevron_left</i>
                <span class="back-text">Back</span>
              </a>
            </div>
            <div class="title">Downloads</div>
            <div class="right">
              <a href="/torrent-search/" class="link">
                <i class="f7-icons">plus</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- Transfer Info -->
          <div class="block-title">Transfer Statistics</div>
          <div class="block">
            <div class="row">
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="download-speed">-</div>
                    <div class="stats-label">Download Speed</div>
                  </div>
                </div>
              </div>
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="upload-speed">-</div>
                    <div class="stats-label">Upload Speed</div>
                  </div>
                </div>
              </div>
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="total-downloaded">-</div>
                    <div class="stats-label">Downloaded</div>
                  </div>
                </div>
              </div>
              <div class="col-25">
                <div class="card stats-card">
                  <div class="card-content card-content-padding">
                    <div class="stats-number" id="total-uploaded">-</div>
                    <div class="stats-label">Uploaded</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filter Controls -->
          <div class="block">
            <div class="segmented segmented-strong">
              <a href="#" class="button button-active" data-filter="all">All</a>
              <a href="#" class="button" data-filter="downloading">Downloading</a>
              <a href="#" class="button" data-filter="completed">Completed</a>
              <a href="#" class="button" data-filter="paused">Paused</a>
              <a href="#" class="button" data-filter="error">Error</a>
            </div>
          </div>

          <!-- Downloads List -->
          <div class="list downloads-list" id="downloads-list">
            <ul>
              <!-- Loading -->
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

          <!-- Floating Action Button -->
          <div class="fab fab-right-bottom fab-extended" id="add-download-fab">
            <a href="/torrent-search/">
              <i class="f7-icons">plus</i>
              <div class="fab-text">Add Download</div>
            </a>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        downloads: [],
        currentFilter: 'all',
        transferInfo: null,
        updateInterval: null
      },
      on: {
        pageInit: function () {
          console.log('Downloads page initialized')
          this.loadDownloads()
          this.loadTransferInfo()
          this.setupEventListeners()
          this.setupWebSocketListeners()
          this.startAutoRefresh()
        },
        pageBeforeRemove: function () {
          this.stopAutoRefresh()
          this.cleanupWebSocketListeners()
        }
      },
      methods: {
        async loadDownloads(filter = null) {
          try {
            const params = {}
            if (filter && filter !== 'all') {
              params.filter = filter
            }

            const response = await apiService.get('/downloads', params)

            if (response.success) {
              this.data.downloads = response.data.torrents || []
              this.renderDownloadsList()
            } else {
              throw new Error(response.message || 'Failed to load downloads')
            }
          } catch (error) {
            console.error('Error loading downloads:', error)
            this.$app.showError('Failed to load downloads')
            this.$el.find('#downloads-list ul').html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">Failed to load downloads</div>
                </div>
              </li>
            `)
          }
        },

        async loadTransferInfo() {
          try {
            const response = await apiService.get('/downloads/transfer-info')

            if (response.success) {
              this.data.transferInfo = response.data.transferInfo
              this.updateTransferStats()
            }
          } catch (error) {
            console.error('Error loading transfer info:', error)
          }
        },

        renderDownloadsList() {
          const container = this.$el.find('#downloads-list ul')
          
          if (!this.data.downloads || this.data.downloads.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">No downloads found</div>
                  <div class="item-subtitle">Tap the + button to add a download</div>
                </div>
              </li>
            `)
            return
          }

          const html = this.data.downloads.map(download => `
            <li class="item-content item-link" data-hash="${download.hash}">
              <div class="item-media">
                <div class="progress-circle-container">
                  <svg class="progress-circle" width="40" height="40">
                    <circle cx="20" cy="20" r="15" 
                            stroke="var(--pb-border)" 
                            stroke-width="2" 
                            fill="none"/>
                    <circle cx="20" cy="20" r="15" 
                            stroke="var(--pb-primary)" 
                            stroke-width="2" 
                            fill="none"
                            stroke-dasharray="${2 * Math.PI * 15}"
                            stroke-dashoffset="${2 * Math.PI * 15 * (1 - download.progress / 100)}"
                            transform="rotate(-90 20 20)"/>
                  </svg>
                  <div class="progress-text">${download.progress}%</div>
                </div>
              </div>
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${download.name}</div>
                  <div class="item-subtitle">
                    ${download.sizeFormatted} • ${download.dlspeedFormatted} ↓ ${download.upspeedFormatted} ↑
                  </div>
                  <div class="item-text">
                    ETA: ${download.etaFormatted} • Ratio: ${download.ratio} • Seeds: ${download.num_seeds}/${download.num_leechs}
                  </div>
                </div>
                <div class="item-after">
                  <div class="download-actions">
                    <span class="badge color-${this.getStatusColor(download.state)}">${download.state}</span>
                    <div class="button-group">
                      ${this.getActionButtons(download)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        getStatusColor(status) {
          const colors = {
            downloading: 'blue',
            uploading: 'green',
            stalledDL: 'orange',
            stalledUP: 'orange',
            pausedDL: 'gray',
            pausedUP: 'gray',
            queuedDL: 'purple',
            queuedUP: 'purple',
            error: 'red',
            missingFiles: 'red',
            allocating: 'yellow'
          }
          return colors[status] || 'gray'
        },

        getActionButtons(download) {
          const buttons = []
          
          if (download.state === 'pausedDL' || download.state === 'pausedUP') {
            buttons.push(`<button class="button button-small button-fill color-blue action-btn" data-action="resume" data-hash="${download.hash}">Resume</button>`)
          } else if (download.state === 'downloading' || download.state === 'uploading') {
            buttons.push(`<button class="button button-small button-fill color-orange action-btn" data-action="pause" data-hash="${download.hash}">Pause</button>`)
          }
          
          buttons.push(`<button class="button button-small button-fill color-red action-btn" data-action="delete" data-hash="${download.hash}">Delete</button>`)
          
          return buttons.join('')
        },

        updateTransferStats() {
          if (!this.data.transferInfo) return

          this.$el.find('#download-speed').text(this.data.transferInfo.dl_info_speed)
          this.$el.find('#upload-speed').text(this.data.transferInfo.up_info_speed)
          this.$el.find('#total-downloaded').text(this.data.transferInfo.dl_info_data)
          this.$el.find('#total-uploaded').text(this.data.transferInfo.up_info_data)
        },

        async controlDownload(hash, action) {
          try {
            const response = await apiService.post(`/downloads/${hash}/control`, {
              action: action,
              deleteFiles: action === 'delete'
            })

            if (response.success) {
              this.$app.showSuccess(`Download ${action} successful`)
              this.loadDownloads(this.data.currentFilter)
            } else {
              throw new Error(response.message || `Failed to ${action} download`)
            }
          } catch (error) {
            console.error(`Error ${action} download:`, error)
            this.$app.showError(`Failed to ${action} download`)
          }
        },

        setupEventListeners() {
          // Filter buttons
          this.$el.find('.segmented .button').on('click', (e) => {
            e.preventDefault()
            const button = this.$app.$(e.currentTarget)
            const filter = button.data('filter')
            
            // Update active state
            this.$el.find('.segmented .button').removeClass('button-active')
            button.addClass('button-active')
            
            // Load filtered downloads
            this.data.currentFilter = filter
            this.loadDownloads(filter)
          })

          // Download item clicks (show details)
          this.$el.find('#downloads-list').on('click', '.item-content', (e) => {
            if (this.$app.$(e.target).hasClass('action-btn')) return
            
            const hash = this.$app.$(e.currentTarget).data('hash')
            if (hash) {
              this.$app.view.main.router.navigate(`/downloads/${hash}/details/`)
            }
          })

          // Action buttons
          this.$el.find('#downloads-list').on('click', '.action-btn', (e) => {
            e.stopPropagation()
            const button = this.$app.$(e.currentTarget)
            const action = button.data('action')
            const hash = button.data('hash')
            
            if (action === 'delete') {
              this.$app.dialog.confirm(
                'Are you sure you want to delete this download?',
                'Confirm Delete',
                () => {
                  this.controlDownload(hash, action)
                }
              )
            } else {
              this.controlDownload(hash, action)
            }
          })

          // Pull to refresh
          const ptr = this.$app.ptr.create('.page-content')
          this.$el.find('.page-content').on('ptr:refresh', () => {
            this.loadDownloads(this.data.currentFilter)
            this.loadTransferInfo()
            this.$app.ptr.done()
          })
        },

        setupWebSocketListeners() {
          // Listen for real-time download updates
          websocketService.onMessage('download', (message) => {
            switch (message.event) {
              case 'status_update':
                this.updateDownloadStatus(message.data)
                break
              case 'download_added':
                this.loadDownloads(this.data.currentFilter)
                break
              case 'download_completed':
                this.loadDownloads(this.data.currentFilter)
                this.loadTransferInfo()
                break
            }
          })
        },

        updateDownloadStatus(data) {
          // Find and update specific download in the list
          const download = this.data.downloads.find(d => d.hash === data.hash)
          if (download) {
            download.progress = data.progress
            download.status = data.status
            download.speed = data.speed
            
            // Update the UI element
            const listItem = this.$el.find(`[data-hash="${data.hash}"]`)
            if (listItem.length) {
              listItem.find('.progress-text').text(`${data.progress}%`)
              const circle = listItem.find('.progress-circle circle:last-child')
              const circumference = 2 * Math.PI * 15
              const offset = circumference * (1 - data.progress / 100)
              circle.css('stroke-dashoffset', offset)
            }
          }
        },

        startAutoRefresh() {
          // Refresh every 5 seconds
          this.data.updateInterval = setInterval(() => {
            this.loadTransferInfo()
          }, 5000)
        },

        stopAutoRefresh() {
          if (this.data.updateInterval) {
            clearInterval(this.data.updateInterval)
            this.data.updateInterval = null
          }
        },

        cleanupWebSocketListeners() {
          websocketService.offMessage('download')
        }
      }
    })
  }
}