// Dashboard page controller
import authStore from '../store/auth.js'
import f7Helpers from '../utils/framework7-helpers.js'

// Register page events with Framework7
document.addEventListener('DOMContentLoaded', () => {
  const app = window.app
  
  if (app) {
    // Dashboard page events
    app.on('pageInit', '.page[data-name="dashboard"]', function (page) {
      console.log('Dashboard page initialized')
      
      // Get logout button
      const logoutBtn = page.$el.find('#logout-btn')
      
      // Handle logout
      logoutBtn.on('click', async (e) => {
        e.preventDefault()
        
        // Show confirmation dialog using helper
        f7Helpers.showConfirm(
          'Logout',
          'Are you sure you want to logout?',
          async () => {
            // Show loading
            const loading = f7Helpers.showLoading('Logging out...')
            
            try {
              // Disconnect WebSocket
              if (window.wsClient) {
                window.wsClient.disconnect()
              }
              
              // Perform logout
              await authStore.dispatch('logout')
              
              // Hide loading
              f7Helpers.hideLoading()
              
              // Show success message
              f7Helpers.showSuccess('Logged out successfully')
              
              // Redirect to login
              setTimeout(() => {
                page.app.views.main.router.navigate('/login/', {
                  clearPreviousHistory: true
                })
              }, 1000)
            } catch (error) {
              console.error('Logout error:', error)
              f7Helpers.hideLoading()
              f7Helpers.showError('Error during logout')
            }
          }
        )
      })
      
      // Add demo buttons for Framework7 features
      const demoBtn = page.$el.find('#demo-features-btn')
      if (demoBtn.length > 0) {
        demoBtn.on('click', () => {
          f7Helpers.showActionSheet([
            {
              text: 'Show Toast',
              onClick: () => f7Helpers.showToast('This is a toast message!')
            },
            {
              text: 'Show Success',
              onClick: () => f7Helpers.showSuccess('Operation completed successfully!')
            },
            {
              text: 'Show Error',
              onClick: () => f7Helpers.showError('Something went wrong!')
            },
            {
              text: 'Show Notification',
              onClick: () => f7Helpers.showNotification({
                title: 'New Message',
                text: 'You have a new notification',
                icon: '<i class="f7-icons">bell_fill</i>'
              })
            },
            {
              text: 'Show Popup',
              onClick: () => {
                const popupContent = `
                  <div class="popup">
                    <div class="page">
                      <div class="navbar">
                        <div class="navbar-bg"></div>
                        <div class="navbar-inner">
                          <div class="title">Demo Popup</div>
                          <div class="right">
                            <a href="#" class="link popup-close">Close</a>
                          </div>
                        </div>
                      </div>
                      <div class="page-content">
                        <div class="block">
                          <p>This is a demo popup using full Framework7 features!</p>
                          <p>Device info:</p>
                          <ul>
                            <li>iOS: ${f7Helpers.device.isIos}</li>
                            <li>Android: ${f7Helpers.device.isAndroid}</li>
                            <li>Desktop: ${f7Helpers.device.isDesktop}</li>
                            <li>Mobile: ${f7Helpers.device.isMobile}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                `
                f7Helpers.showPopup(popupContent)
              }
            },
            {
              text: 'Cancel',
              color: 'red'
            }
          ], 'Framework7 Features Demo')
        })
      }

      // Debug button to close panel
      const debugPanelBtn = page.$el.find('#debug-panel-btn')
      if (debugPanelBtn.length > 0) {
        debugPanelBtn.on('click', () => {
          console.log('Debug: Closing panel and ensuring main view visibility')
          
          // Close any open panels
          if (app.panel && app.panel.left && app.panel.left.opened) {
            app.panel.close('left')
          }
          
          // Ensure main view is visible
          const mainView = document.querySelector('.view-main')
          if (mainView) {
            mainView.style.display = 'block'
            mainView.style.visibility = 'visible'
            mainView.style.opacity = '1'
            mainView.style.transform = 'none'
          }
          
          // Force refresh the current page
          page.app.views.main.router.refreshPage()
          
          f7Helpers.showSuccess('Panel closed and main view restored')
        })
      }
      
      // Initialize dashboard functionality here
      // This will be implemented in task 3.1
    })
    
    app.on('pageBeforeIn', '.page[data-name="dashboard"]', function (page) {
      console.log('Dashboard page before in')
      
      // Check authentication
      const isAuthenticated = authStore.getters.isAuthenticated.value
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        page.app.views.main.router.navigate('/login/', {
          clearPreviousHistory: true
        })
        return false // Prevent page transition
      }
    })
    
    app.on('pageAfterIn', '.page[data-name="dashboard"]', function (page) {
      console.log('Dashboard page after in')
    })
    
    app.on('pageBeforeOut', '.page[data-name="dashboard"]', function (page) {
      console.log('Dashboard page before out')
    })
    
    app.on('pageAfterOut', '.page[data-name="dashboard"]', function (page) {
      console.log('Dashboard page after out')
    })
  }
})