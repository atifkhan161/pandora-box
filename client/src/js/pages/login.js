import { authService } from '../services/auth.js'

export default {
  path: '/login/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="login">
        <div class="page-content login-screen-content">
          <div class="login-screen">
            <div class="view">
              <div class="page">
                <div class="page-content">
                  <div class="login-screen-title">
                    <img src="/assets/logo.png" alt="Pandora Box" style="width: 80px; height: 80px; margin-bottom: 20px;" />
                    <h1>Pandora Box</h1>
                    <p>Media Management Hub</p>
                  </div>
                  
                  <form class="list" id="login-form">
                    <ul>
                      <li class="item-content item-input item-input-outline">
                        <div class="item-inner">
                          <div class="item-title item-label">Username</div>
                          <div class="item-input-wrap">
                            <input type="text" name="username" placeholder="Enter username" required validate>
                            <span class="input-clear-button"></span>
                          </div>
                        </div>
                      </li>
                      <li class="item-content item-input item-input-outline">
                        <div class="item-inner">
                          <div class="item-title item-label">Password</div>
                          <div class="item-input-wrap">
                            <input type="password" name="password" placeholder="Enter password" required validate>
                            <span class="input-clear-button"></span>
                          </div>
                        </div>
                      </li>
                    </ul>
                    
                    <div class="block">
                      <button type="submit" class="button button-large button-fill button-raised color-red" id="login-btn">
                        <span class="button-text">Sign In</span>
                        <div class="preloader button-preloader" style="display: none;"></div>
                      </button>
                    </div>
                    
                    <div class="block-footer">
                      <p>New to Pandora Box? <a href="/register/" class="link">Create Account</a></p>
                    </div>
                  </form>
                  
                  <div class="block" id="error-message" style="display: none;">
                    <div class="block-title color-red">Error</div>
                    <p class="color-red" id="error-text"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        isLoading: false
      },
      on: {
        pageInit: function () {
          console.log('Login page initialized')
          this.setupEventListeners()
          this.checkExistingAuth()
        },
        pageBeforeIn: function () {
          // Hide any existing error messages
          this.$el.find('#error-message').hide()
        }
      },
      methods: {
        setupEventListeners() {
          // Handle form submission
          this.$el.find('#login-form').on('submit', (e) => {
            e.preventDefault()
            this.handleLogin()
          })

          // Handle enter key in password field
          this.$el.find('input[name="password"]').on('keypress', (e) => {
            if (e.which === 13) {
              this.handleLogin()
            }
          })

          // Clear error message when user starts typing
          this.$el.find('input').on('input', () => {
            this.hideError()
          })
        },

        async handleLogin() {
          if (this.data.isLoading) return

          const username = this.$el.find('input[name="username"]').val().trim()
          const password = this.$el.find('input[name="password"]').val()

          // Validate inputs
          if (!username || !password) {
            this.showError('Please enter both username and password')
            return
          }

          this.setLoading(true)
          this.hideError()

          try {
            const result = await authService.login(username, password)
            
            if (result.success) {
              this.$app.showSuccess('Login successful!')
              
              // Navigate to dashboard
              this.$app.view.main.router.navigate('/', {
                clearPreviousHistory: true,
                animate: true
              })
            } else {
              throw new Error(result.message || 'Login failed')
            }
          } catch (error) {
            console.error('Login error:', error)
            this.showError(error.message || 'Login failed. Please check your credentials.')
          } finally {
            this.setLoading(false)
          }
        },

        async checkExistingAuth() {
          try {
            const isAuthenticated = await authService.verifyToken()
            if (isAuthenticated) {
              // User is already logged in, redirect to dashboard
              this.$app.view.main.router.navigate('/', {
                clearPreviousHistory: true,
                animate: false
              })
            }
          } catch (error) {
            // User is not authenticated, stay on login page
            console.log('User not authenticated, showing login form')
          }
        },

        setLoading(loading) {
          this.data.isLoading = loading
          const button = this.$el.find('#login-btn')
          const buttonText = button.find('.button-text')
          const preloader = button.find('.button-preloader')

          if (loading) {
            button.addClass('button-loading')
            buttonText.text('Signing In...')
            preloader.show()
            button.prop('disabled', true)
          } else {
            button.removeClass('button-loading')
            buttonText.text('Sign In')
            preloader.hide()
            button.prop('disabled', false)
          }
        },

        showError(message) {
          this.$el.find('#error-text').text(message)
          this.$el.find('#error-message').show()
        },

        hideError() {
          this.$el.find('#error-message').hide()
        }
      }
    })
  }
}