// Dashboard page controller
import authStore from '../store/auth.js'

export default {
  path: '/',
  componentUrl: './pages/dashboard.html',
  
  on: {
    pageInit(e, page) {
      console.log('Dashboard page initialized')
      
      // Get logout button
      const logoutBtn = page.$el.find('#logout-btn')
      
      // Handle logout
      logoutBtn.on('click', async (e) => {
        e.preventDefault()
        
        // Show confirmation dialog
        page.app.dialog.confirm(
          'Are you sure you want to logout?',
          'Logout',
          async () => {
            try {
              // Disconnect WebSocket
              if (window.wsClient) {
                window.wsClient.disconnect()
              }
              
              // Perform logout
              await authStore.dispatch('logout')
              
              // Show success message
              page.app.toast.create({
                text: 'Logged out successfully',
                position: 'center',
                closeTimeout: 2000
              }).open()
              
              // Redirect to login
              setTimeout(() => {
                page.app.views.main.router.navigate('/login/', {
                  clearPreviousHistory: true
                })
              }, 1000)
            } catch (error) {
              console.error('Logout error:', error)
              page.app.toast.create({
                text: 'Error during logout',
                position: 'center',
                closeTimeout: 3000
              }).open()
            }
          }
        )
      })
      
      // Initialize dashboard functionality here
      // This will be implemented in task 3.1
    },
    
    pageBeforeIn(e, page) {
      console.log('Dashboard page before in')
    },
    
    pageAfterIn(e, page) {
      console.log('Dashboard page after in')
    },
    
    pageBeforeOut(e, page) {
      console.log('Dashboard page before out')
    },
    
    pageAfterOut(e, page) {
      console.log('Dashboard page after out')
    }
  }
}