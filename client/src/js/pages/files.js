// Files page controller
import authStore from '../store/auth.js'

export default {
  path: '/files/',
  componentUrl: './pages/files.html',
  
  on: {
    pageInit(e, page) {
      console.log('Files page initialized')
      
      // Initialize files functionality here
      // This will be implemented in task 5.1
    },
    
    pageBeforeIn(e, page) {
      console.log('Files page before in')
      
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
      console.log('Files page after in')
    },
    
    pageBeforeOut(e, page) {
      console.log('Files page before out')
    },
    
    pageAfterOut(e, page) {
      console.log('Files page after out')
    }
  }
}