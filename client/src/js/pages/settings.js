import { apiService } from '../services/api.js'
import { authService } from '../services/auth.js'

export default {
  path: '/settings/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="settings">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link back">
                <i class="f7-icons">chevron_left</i>
                <span class="back-text">Back</span>
              </a>
            </div>
            <div class="title">Settings</div>
            <div class="right">
              <a href="#" class="link" id="save-settings">
                <i class="f7-icons">checkmark</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- User Profile -->
          <div class="block-title">User Profile</div>
          <div class="list">
            <ul>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">person</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Username</div>
                  <div class="item-input-wrap">
                    <input type="text" id="username" readonly disabled>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">mail</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Email</div>
                  <div class="item-input-wrap">
                    <input type="email" id="email" placeholder="Enter email">
                  </div>
                </div>
              </li>
              <li class="item-content item-link" id="change-password">
                <div class="item-media">
                  <i class="f7-icons">lock</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Change Password</div>
                  <div class="item-after">
                    <i class="f7-icons">chevron_right</i>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- API Configuration -->
          <div class="block-title">API Configuration</div>
          <div class="list">
            <ul>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">film</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">TMDB API Key</div>
                  <div class="item-input-wrap">
                    <input type="password" id="tmdb-api-key" placeholder="Enter TMDB API key">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">tv</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Watchmode API Key</div>
                  <div class="item-input-wrap">
                    <input type="password" id="watchmode-api-key" placeholder="Enter Watchmode API key">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">search</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Jackett URL</div>
                  <div class="item-input-wrap">
                    <input type="url" id="jackett-url" placeholder="http://localhost:9117">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">key</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Jackett API Key</div>
                  <div class="item-input-wrap">
                    <input type="password" id="jackett-api-key" placeholder="Enter Jackett API key">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Service Configuration -->
          <div class="block-title">Service Configuration</div>
          <div class="list">
            <ul>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">tray_arrow_down</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">qBittorrent URL</div>
                  <div class="item-input-wrap">
                    <input type="url" id="qbittorrent-url" placeholder="http://localhost:8080">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">person</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">qBittorrent Username</div>
                  <div class="item-input-wrap">
                    <input type="text" id="qbittorrent-username" placeholder="admin">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">lock</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">qBittorrent Password</div>
                  <div class="item-input-wrap">
                    <input type="password" id="qbittorrent-password" placeholder="Enter password">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">folder</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Cloud Commander URL</div>
                  <div class="item-input-wrap">
                    <input type="url" id="cloudcommander-url" placeholder="http://localhost:8000">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">cube_box</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Portainer URL</div>
                  <div class="item-input-wrap">
                    <input type="url" id="portainer-url" placeholder="http://localhost:9000">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">key</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Portainer API Key</div>
                  <div class="item-input-wrap">
                    <input type="password" id="portainer-api-key" placeholder="Enter Portainer API key">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">tv_music_note</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Jellyfin URL</div>
                  <div class="item-input-wrap">
                    <input type="url" id="jellyfin-url" placeholder="http://localhost:8096">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">key</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Jellyfin API Key</div>
                  <div class="item-input-wrap">
                    <input type="password" id="jellyfin-api-key" placeholder="Enter Jellyfin API key">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Media Paths -->
          <div class="block-title">Media Paths</div>
          <div class="list">
            <ul>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">film</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Movies Path</div>
                  <div class="item-input-wrap">
                    <input type="text" id="movies-path" placeholder="/media/movies">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">tv</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">TV Shows Path</div>
                  <div class="item-input-wrap">
                    <input type="text" id="tv-path" placeholder="/media/tv">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">tray_arrow_down</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Downloads Path</div>
                  <div class="item-input-wrap">
                    <input type="text" id="downloads-path" placeholder="/downloads">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
              <li class="item-content item-input">
                <div class="item-media">
                  <i class="f7-icons">folder</i>
                </div>
                <div class="item-inner">
                  <div class="item-title item-label">Temp Path</div>
                  <div class="item-input-wrap">
                    <input type="text" id="temp-path" placeholder="/tmp">
                    <span class="input-clear-button"></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Application Settings -->
          <div class="block-title">Application Settings</div>
          <div class="list">
            <ul>
              <li class="item-content">
                <div class="item-media">
                  <i class="f7-icons">moon</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Dark Theme</div>
                  <div class="item-after">
                    <label class="toggle toggle-init">
                      <input type="checkbox" id="dark-theme">
                      <span class="toggle-icon"></span>
                    </label>
                  </div>
                </div>
              </li>
              <li class="item-content">
                <div class="item-media">
                  <i class="f7-icons">bell</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Push Notifications</div>
                  <div class="item-after">
                    <label class="toggle toggle-init">
                      <input type="checkbox" id="push-notifications">
                      <span class="toggle-icon"></span>
                    </label>
                  </div>
                </div>
              </li>
              <li class="item-content">
                <div class="item-media">
                  <i class="f7-icons">arrow_clockwise</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Auto Library Scan</div>
                  <div class="item-after">
                    <label class="toggle toggle-init">
                      <input type="checkbox" id="auto-library-scan">
                      <span class="toggle-icon"></span>
                    </label>
                  </div>
                </div>
              </li>
              <li class="item-content">
                <div class="item-media">
                  <i class="f7-icons">trash</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Auto Delete Completed Downloads</div>
                  <div class="item-after">
                    <label class="toggle toggle-init">
                      <input type="checkbox" id="auto-delete-downloads">
                      <span class="toggle-icon"></span>
                    </label>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Test Connections -->
          <div class="block-title">Test Connections</div>
          <div class="block">
            <div class="row">
              <div class="col-50">
                <button class="button button-fill color-blue" id="test-qbittorrent">
                  <i class="f7-icons">checkmark_circle</i> Test qBittorrent
                </button>
              </div>
              <div class="col-50">
                <button class="button button-fill color-green" id="test-jellyfin">
                  <i class="f7-icons">checkmark_circle</i> Test Jellyfin
                </button>
              </div>
            </div>
            <div class="row margin-top">
              <div class="col-50">
                <button class="button button-fill color-orange" id="test-portainer">
                  <i class="f7-icons">checkmark_circle</i> Test Portainer
                </button>
              </div>
              <div class="col-50">
                <button class="button button-fill color-purple" id="test-jackett">
                  <i class="f7-icons">checkmark_circle</i> Test Jackett
                </button>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="block-title">Danger Zone</div>
          <div class="list">
            <ul>
              <li class="item-content item-link" id="reset-settings">
                <div class="item-media">
                  <i class="f7-icons">arrow_clockwise</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Reset All Settings</div>
                  <div class="item-after">
                    <i class="f7-icons">chevron_right</i>
                  </div>
                </div>
              </li>
              <li class="item-content item-link" id="clear-cache">
                <div class="item-media">
                  <i class="f7-icons">trash</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Clear Cache</div>
                  <div class="item-after">
                    <i class="f7-icons">chevron_right</i>
                  </div>
                </div>
              </li>
              <li class="item-content item-link" id="logout">
                <div class="item-media">
                  <i class="f7-icons">square_arrow_right</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Logout</div>
                  <div class="item-after">
                    <i class="f7-icons">chevron_right</i>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- App Info -->
          <div class="block-title">App Information</div>
          <div class="list">
            <ul>
              <li class="item-content">
                <div class="item-media">
                  <i class="f7-icons">info_circle</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">Version</div>
                  <div class="item-after">1.0.0</div>
                </div>
              </li>
              <li class="item-content item-link" id="about">
                <div class="item-media">
                  <i class="f7-icons">doc_text</i>
                </div>
                <div class="item-inner">
                  <div class="item-title">About Pandora Box</div>
                  <div class="item-after">
                    <i class="f7-icons">chevron_right</i>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        settings: {},
        hasChanges: false
      },
      on: {
        pageInit: function () {
          console.log('Settings page initialized')
          this.loadSettings()
          this.setupEventListeners()
        },
        pageBeforeRemove: function () {
          if (this.data.hasChanges) {
            // Auto-save on page leave if there are changes
            this.saveSettings()
          }
        }
      },
      methods: {
        async loadSettings() {
          try {
            const response = await apiService.get('/settings')

            if (response.success) {
              this.data.settings = response.data
              this.populateForm(this.data.settings)
            }

            // Load user info
            const user = authService.getCurrentUser()
            if (user) {
              this.$el.find('#username').val(user.username)
            }
          } catch (error) {
            console.error('Error loading settings:', error)
            this.$app.showError('Failed to load settings')
          }
        },

        populateForm(settings) {
          // API Configuration
          this.$el.find('#tmdb-api-key').val(settings.tmdbApiKey || '')
          this.$el.find('#watchmode-api-key').val(settings.watchmodeApiKey || '')
          this.$el.find('#jackett-url').val(settings.jackettUrl || '')
          this.$el.find('#jackett-api-key').val(settings.jackettApiKey || '')

          // Service Configuration
          this.$el.find('#qbittorrent-url').val(settings.qbittorrentUrl || '')
          this.$el.find('#qbittorrent-username').val(settings.qbittorrentUsername || '')
          this.$el.find('#qbittorrent-password').val(settings.qbittorrentPassword || '')
          this.$el.find('#cloudcommander-url').val(settings.cloudCommanderUrl || '')
          this.$el.find('#portainer-url').val(settings.portainerUrl || '')
          this.$el.find('#portainer-api-key').val(settings.portainerApiKey || '')
          this.$el.find('#jellyfin-url').val(settings.jellyfinUrl || '')
          this.$el.find('#jellyfin-api-key').val(settings.jellyfinApiKey || '')

          // Media Paths
          this.$el.find('#movies-path').val(settings.moviesPath || '/media/movies')
          this.$el.find('#tv-path').val(settings.tvPath || '/media/tv')
          this.$el.find('#downloads-path').val(settings.downloadsPath || '/downloads')
          this.$el.find('#temp-path').val(settings.tempPath || '/tmp')

          // Application Settings
          this.$el.find('#dark-theme').prop('checked', settings.darkTheme || false)
          this.$el.find('#push-notifications').prop('checked', settings.pushNotifications || false)
          this.$el.find('#auto-library-scan').prop('checked', settings.autoLibraryScan || false)
          this.$el.find('#auto-delete-downloads').prop('checked', settings.autoDeleteDownloads || false)

          this.$el.find('#email').val(settings.email || '')
        },

        collectSettings() {
          return {
            // API Configuration
            tmdbApiKey: this.$el.find('#tmdb-api-key').val(),
            watchmodeApiKey: this.$el.find('#watchmode-api-key').val(),
            jackettUrl: this.$el.find('#jackett-url').val(),
            jackettApiKey: this.$el.find('#jackett-api-key').val(),

            // Service Configuration
            qbittorrentUrl: this.$el.find('#qbittorrent-url').val(),
            qbittorrentUsername: this.$el.find('#qbittorrent-username').val(),
            qbittorrentPassword: this.$el.find('#qbittorrent-password').val(),
            cloudCommanderUrl: this.$el.find('#cloudcommander-url').val(),
            portainerUrl: this.$el.find('#portainer-url').val(),
            portainerApiKey: this.$el.find('#portainer-api-key').val(),
            jellyfinUrl: this.$el.find('#jellyfin-url').val(),
            jellyfinApiKey: this.$el.find('#jellyfin-api-key').val(),

            // Media Paths
            moviesPath: this.$el.find('#movies-path').val(),
            tvPath: this.$el.find('#tv-path').val(),
            downloadsPath: this.$el.find('#downloads-path').val(),
            tempPath: this.$el.find('#temp-path').val(),

            // Application Settings
            darkTheme: this.$el.find('#dark-theme').is(':checked'),
            pushNotifications: this.$el.find('#push-notifications').is(':checked'),
            autoLibraryScan: this.$el.find('#auto-library-scan').is(':checked'),
            autoDeleteDownloads: this.$el.find('#auto-delete-downloads').is(':checked'),

            email: this.$el.find('#email').val()
          }
        },

        async saveSettings() {
          try {
            const settings = this.collectSettings()
            const response = await apiService.post('/settings', settings)

            if (response.success) {
              this.$app.showSuccess('Settings saved successfully')
              this.data.hasChanges = false
              
              // Apply theme change immediately
              if (settings.darkTheme) {
                document.body.classList.add('theme-dark')
              } else {
                document.body.classList.remove('theme-dark')
              }
            } else {
              throw new Error(response.message || 'Failed to save settings')
            }
          } catch (error) {
            console.error('Error saving settings:', error)
            this.$app.showError('Failed to save settings')
          }
        },

        async testConnection(service) {
          try {
            const response = await apiService.get(`/settings/test/${service}`)
            
            if (response.success) {
              this.$app.showSuccess(`${service} connection successful`)
            } else {
              this.$app.showError(`${service} connection failed: ${response.message}`)
            }
          } catch (error) {
            console.error(`Error testing ${service} connection:`, error)
            this.$app.showError(`Failed to test ${service} connection`)
          }
        },

        showChangePasswordDialog() {
          const dialog = this.$app.dialog.create({
            title: 'Change Password',
            content: `
              <div class="list">
                <ul>
                  <li class="item-content item-input">
                    <div class="item-inner">
                      <div class="item-title item-label">Current Password</div>
                      <div class="item-input-wrap">
                        <input type="password" id="current-password" placeholder="Enter current password">
                      </div>
                    </div>
                  </li>
                  <li class="item-content item-input">
                    <div class="item-inner">
                      <div class="item-title item-label">New Password</div>
                      <div class="item-input-wrap">
                        <input type="password" id="new-password" placeholder="Enter new password">
                      </div>
                    </div>
                  </li>
                  <li class="item-content item-input">
                    <div class="item-inner">
                      <div class="item-title item-label">Confirm Password</div>
                      <div class="item-input-wrap">
                        <input type="password" id="confirm-password" placeholder="Confirm new password">
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            `,
            buttons: [
              { text: 'Cancel' },
              {
                text: 'Change',
                onClick: async () => {
                  const currentPassword = dialog.$el.find('#current-password').val()
                  const newPassword = dialog.$el.find('#new-password').val()
                  const confirmPassword = dialog.$el.find('#confirm-password').val()

                  if (!currentPassword || !newPassword || !confirmPassword) {
                    this.$app.showError('Please fill all fields')
                    return
                  }

                  if (newPassword !== confirmPassword) {
                    this.$app.showError('Passwords do not match')
                    return
                  }

                  try {
                    const response = await apiService.post('/auth/change-password', {
                      currentPassword,
                      newPassword
                    })

                    if (response.success) {
                      this.$app.showSuccess('Password changed successfully')
                    } else {
                      throw new Error(response.message)
                    }
                  } catch (error) {
                    console.error('Error changing password:', error)
                    this.$app.showError('Failed to change password')
                  }
                }
              }
            ]
          })

          dialog.open()
        },

        setupEventListeners() {
          // Save settings
          this.$el.find('#save-settings').on('click', (e) => {
            e.preventDefault()
            this.saveSettings()
          })

          // Track changes
          this.$el.find('input, select').on('input change', () => {
            this.data.hasChanges = true
          })

          // Change password
          this.$el.find('#change-password').on('click', (e) => {
            e.preventDefault()
            this.showChangePasswordDialog()
          })

          // Test connections
          this.$el.find('#test-qbittorrent').on('click', () => this.testConnection('qbittorrent'))
          this.$el.find('#test-jellyfin').on('click', () => this.testConnection('jellyfin'))
          this.$el.find('#test-portainer').on('click', () => this.testConnection('portainer'))
          this.$el.find('#test-jackett').on('click', () => this.testConnection('jackett'))

          // Reset settings
          this.$el.find('#reset-settings').on('click', (e) => {
            e.preventDefault()
            this.$app.dialog.confirm(
              'This will reset all settings to default values. Are you sure?',
              'Reset Settings',
              async () => {
                try {
                  const response = await apiService.post('/settings/reset')
                  if (response.success) {
                    this.$app.showSuccess('Settings reset successfully')
                    this.loadSettings()
                  }
                } catch (error) {
                  this.$app.showError('Failed to reset settings')
                }
              }
            )
          })

          // Clear cache
          this.$el.find('#clear-cache').on('click', (e) => {
            e.preventDefault()
            this.$app.dialog.confirm(
              'This will clear all cached data. Continue?',
              'Clear Cache',
              async () => {
                try {
                  const response = await apiService.post('/settings/clear-cache')
                  if (response.success) {
                    this.$app.showSuccess('Cache cleared successfully')
                  }
                } catch (error) {
                  this.$app.showError('Failed to clear cache')
                }
              }
            )
          })

          // Logout
          this.$el.find('#logout').on('click', (e) => {
            e.preventDefault()
            this.$app.dialog.confirm(
              'Are you sure you want to logout?',
              'Logout',
              () => {
                authService.logout()
                this.$app.view.main.router.navigate('/login/', { clearPreviousHistory: true })
              }
            )
          })

          // About
          this.$el.find('#about').on('click', (e) => {
            e.preventDefault()
            this.$app.dialog.alert(
              'Pandora Box PWA v1.0.0<br><br>A unified media management interface for self-hosted services.<br><br>Built with Framework7, Node.js, and lots of ❤️',
              'About Pandora Box'
            )
          })
        }
      }
    })
  }
}