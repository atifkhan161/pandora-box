// Login page controller
import authStore from '../store/auth.js'

export default {
  path: '/login/',
  componentUrl: './pages/login.html',
  
  on: {
    pageInit(e, page) {
      console.log('Login page initialized')
      
      // Get page elements
      const loginForm = page.$el.find('#login-form')
      const usernameInput = page.$el.find('input[name="username"]')
      const passwordInput = page.$el.find('input[name="password"]')
      const rememberCheckbox = page.$el.find('input[name="remember"]')
      const submitButton = page.$el.find('button[type="submit"]')
      
      // Handle form submission
      loginForm.on('submit', async (e) => {
        e.preventDefault()
        
        // Get form values
        const username = usernameInput.val().trim()
        const password = passwordInput.val()
        const rememberMe = rememberCheckbox.prop('checked')
        
        // Validate inputs
        if (!username || !password) {
          page.app.toast.create({
            text: 'Please enter both username and password',
            position: 'center',
            closeTimeout: 3000
          }).open()
          return
        }
        
        // Show loading state
        submitButton.text('Signing In...')
        submitButton.prop('disabled', true)
        
        try {
          // Attempt login
          const result = await authStore.dispatch('login', {
            username,
            password,
            rememberMe
          })
          
          if (result.success) {
            // Show success message
            page.app.toast.create({
              text: 'Login successful!',
              position: 'center',
              closeTimeout: 2000
            }).open()
            
            // Initialize WebSocket connection
            if (window.wsClient) {
              window.wsClient.connect()
            }
            
            // Redirect to dashboard
            setTimeout(() => {
              page.app.views.main.router.navigate('/', {
                clearPreviousHistory: true
              })
            }, 1000)
          } else {
            // Show error message
            page.app.toast.create({
              text: result.error || 'Login failed',
              position: 'center',
              closeTimeout: 4000
            }).open()
          }
        } catch (error) {
          console.error('Login error:', error)
          page.app.toast.create({
            text: 'Network error. Please try again.',
            position: 'center',
            closeTimeout: 4000
          }).open()
        } finally {
          // Reset button state
          submitButton.text('Sign In')
          submitButton.prop('disabled', false)
        }
      })
      
      // Handle enter key in password field
      passwordInput.on('keypress', (e) => {
        if (e.which === 13) { // Enter key
          loginForm.trigger('submit')
        }
      })
      
      // Auto-focus username field
      setTimeout(() => {
        usernameInput.focus()
      }, 300)
    },
    
    pageBeforeIn(e, page) {
      console.log('Login page before in')
      
      // Check if already authenticated
      if (authStore.getters.isAuthenticated.value) {
        // Redirect to dashboard if already logged in
        page.app.views.main.router.navigate('/', {
          clearPreviousHistory: true
        })
        return false // Prevent page transition
      }
    },
    
    pageAfterIn(e, page) {
      console.log('Login page after in')
    },
    
    pageBeforeOut(e, page) {
      // Clear any error states when leaving
      authStore.dispatch('clearError')
    }
  }
}