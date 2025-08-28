// Jellyfin page controller
import authStore from '../store/auth.js'

export default {
  path: '/jellyfin/',
  componentUrl: './pages/jellyfin.html',
  
  on: {
    pageInit(e, page) {
      console.log('Jellyfin page initialized')
      
      // Initialize jellyfin functionality here
      // This will be implemented in task 7.1
    },
    
    pageBeforeIn(e, page) {
      console.log('Jellyfin page before in')
      
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
      console.log('Jellyfin page after in')
    },
    
    pageBeforeOut(e, page) {
      console.log('Jellyfin page before out')
    },
    
    pageAfterOut(e, page) {
      console.log('Jellyfin page after out')
    }
  }
}