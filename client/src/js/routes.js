const routes = [
  // Login page
  {
    path: '/login/',
    url: './pages/login.html'
  },
  
  // Dashboard (home) page
  {
    path: '/',
    url: './pages/dashboard.html'
  },
  
  // Downloads page
  {
    path: '/downloads/',
    url: './pages/downloads.html'
  },
  
  // Files page
  {
    path: '/files/',
    url: './pages/files.html'
  },
  
  // Containers page
  {
    path: '/containers/',
    url: './pages/containers.html'
  },
  
  // Jellyfin page
  {
    path: '/jellyfin/',
    url: './pages/jellyfin.html'
  },
  
  // Settings page
  {
    path: '/settings/',
    url: './pages/settings.html'
  },
  
  // Default route (404)
  {
    path: '(.*)',
    url: './pages/404.html'
  }
]

export default routes