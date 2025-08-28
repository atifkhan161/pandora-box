const routes = [
  // Login page
  {
    path: '/login/',
    componentUrl: './pages/login.html'
  },
  
  // Dashboard (home) page
  {
    path: '/',
    componentUrl: './pages/dashboard.html'
  },
  
  // Downloads page
  {
    path: '/downloads/',
    componentUrl: './pages/downloads.html'
  },
  
  // Files page
  {
    path: '/files/',
    componentUrl: './pages/files.html'
  },
  
  // Containers page
  {
    path: '/containers/',
    componentUrl: './pages/containers.html'
  },
  
  // Jellyfin page
  {
    path: '/jellyfin/',
    componentUrl: './pages/jellyfin.html'
  },
  
  // Settings page
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