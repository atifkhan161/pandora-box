// Import page controllers
import DashboardPage from './pages/dashboard.js'
import LoginPage from './pages/login.js'
import DownloadsPage from './pages/downloads.js'
import FilesPage from './pages/files.js'
import ContainersPage from './pages/containers.js'
import JellyfinPage from './pages/jellyfin.js'
import SettingsPage from './pages/settings.js'

// Import route guards
import { requireAuth, redirectIfAuthenticated } from './utils/auth-guard.js'

const routes = [
  // Login page (redirect if already authenticated)
  {
    path: '/login/',
    component: LoginPage,
    beforeEnter: redirectIfAuthenticated
  },
  
  // Dashboard (home) page (requires authentication)
  {
    path: '/',
    component: DashboardPage,
    beforeEnter: requireAuth
  },
  
  // Downloads page (requires authentication)
  {
    path: '/downloads/',
    component: DownloadsPage,
    beforeEnter: requireAuth
  },
  
  // Files page (requires authentication)
  {
    path: '/files/',
    component: FilesPage,
    beforeEnter: requireAuth
  },
  
  // Containers page (requires authentication)
  {
    path: '/containers/',
    component: ContainersPage,
    beforeEnter: requireAuth
  },
  
  // Jellyfin page (requires authentication)
  {
    path: '/jellyfin/',
    component: JellyfinPage,
    beforeEnter: requireAuth
  },
  
  // Settings page (requires authentication)
  {
    path: '/settings/',
    component: SettingsPage,
    beforeEnter: requireAuth
  },
  
  // Default route (404)
  {
    path: '(.*)',
    componentUrl: './pages/404.html'
  }
]

export default routes