// Containers page controller
import authStore from '../store/auth.js'

export default {
  path: '/containers/',
  componentUrl: './pages/containers.html',

  on: {
    pageInit(e, page) {
      console.log('Containers page initialized')

      // Initialize containers functionality here
      // This will be implemented in task 6.1
    },

    pageBeforeIn(e, page) {
      console.log('Containers page before in')
      
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
      console.log('Containers page after in')
    },

    pageBeforeOut(e, page) {
      console.log('Containers page before out')
    },

    pageAfterOut(e, page) {
      console.log('Containers page after out')
    }
  }
}