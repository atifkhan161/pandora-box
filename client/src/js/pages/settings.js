// Settings page controller
import authStore from '../store/auth.js'

export default {
  path: '/settings/',
  componentUrl: './pages/settings.html',
  
  on: {
    pageInit(e, page) {
      console.log('Settings page initialized')
      
      // Initialize settings functionality here
      // This will be implemented in task 8.1
    },
    
    pageBeforeIn(e, page) {
      console.log('Settings page before in')
      
      // Check authentication
      const isAuthenticated = authStore.getters.isAuthenticated.value
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        page.app.views.main.router.navigate('/login/', {
          clearPreviousHistory: true
        })
        return false // Prevent page transition
      }
    },
    
    pageAfterIn(e, page) {
      console.log('Settings page after in')
    },
    
    pageBeforeOut(e, page) {
      console.log('Settings page before out')
    },
    
    pageAfterOut(e, page) {
      console.log('Settings page after out')
    }
  }
}