// Downloads page controller
import authStore from '../store/auth.js'

// Register page events with Framework7
document.addEventListener('DOMContentLoaded', () => {
  const app = window.app
  
  if (app) {
    app.on('pageInit', '.page[data-name="downloads"]', function (page) {
      console.log('Downloads page initialized')
      // Initialize downloads functionality here
      // This will be implemented in task 4.1
    })
    
    app.on('pageBeforeIn', '.page[data-name="downloads"]', function (page) {
      console.log('Downloads page before in')
      
      // Check authentication
      const isAuthenticated = authStore.getters.isAuthenticated.value
      if (!isAuthenticated) {
        page.app.views.main.router.navigate('/login/', { clearPreviousHistory: true })
        return false
      }
    })
  }
})