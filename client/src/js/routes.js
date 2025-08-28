// Import page controllers
import DashboardPage from './pages/dashboard.js'
import LoginPage from './pages/login.js'

const routes = [
  // Login page
  {
    path: '/login/',
    component: LoginPage
  },
  
  // Dashboard (home) page
  {
    path: '/',
    component: DashboardPage
  },
  
  // Placeholder routes for future implementation
  {
    path: '/downloads/',
    componentUrl: './pages/downloads.html'
  },
  {
    path: '/files/',
    componentUrl: './pages/files.html'
  },
  {
    path: '/containers/',
    componentUrl: './pages/containers.html'
  },
  {
    path: '/jellyfin/',
    componentUrl: './pages/jellyfin.html'
  },
  {
    path: '/settings/',
    componentUrl: './pages/settings.html'
  },
  
  // Default route (404)
  {
    path: '(.*)',
    componentUrl: './pages/404.html'
  }
]

export default routes