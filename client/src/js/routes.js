// Framework7 Routes Configuration
export const routes = [
  {
    path: '/',
    component: () => import('./pages/home.js'),
    options: {
      transition: 'f7-cover'
    }
  },
  {
    path: '/login/',
    component: () => import('./pages/login.js'),
    options: {
      transition: 'f7-fade'
    }
  },
  {
    path: '/downloads/',
    component: () => import('./pages/downloads.js'),
    tabs: [
      {
        path: '/',
        id: 'active-downloads'
      },
      {
        path: '/history/',
        id: 'download-history'
      }
    ]
  },
  {
    path: '/files/',
    component: () => import('./pages/files.js'),
    master: true,
    detailRoutes: [
      {
        path: '/files/folder/*/',
        component: () => import('./pages/folder-details.js')
      }
    ]
  },
  {
    path: '/docker/',
    component: () => import('./pages/docker.js'),
    tabs: [
      {
        path: '/',
        id: 'containers'
      },
      {
        path: '/stacks/',
        id: 'stacks'
      }
    ]
  },
  {
    path: '/settings/',
    component: () => import('./pages/settings.js'),
    routes: [
      {
        path: '/profile/',
        component: () => import('./pages/settings/profile.js')
      },
      {
        path: '/api-tokens/',
        component: () => import('./pages/settings/api-tokens.js')
      },
      {
        path: '/team/',
        component: () => import('./pages/settings/team.js')
      },
      {
        path: '/theme/',
        component: () => import('./pages/settings/theme.js')
      },
      {
        path: '/notifications/',
        component: () => import('./pages/settings/notifications.js')
      }
    ]
  },
  {
    path: '/media/:type/:id/',
    component: () => import('./pages/media-details.js')
  },
  {
    path: '/search/',
    component: () => import('./pages/search.js')
  },
  {
    path: '/torrent-search/',
    component: () => import('./pages/torrent-search.js')
  },
  // Default route (404)
  {
    path: '(.*)',
    component: () => import('./pages/404.js')
  }
]

// Route protection middleware
export const routeGuards = {
  requiresAuth: [
    '/',
    '/downloads/',
    '/files/',
    '/docker/',
    '/settings/',
    '/media/',
    '/search/',
    '/torrent-search/'
  ],
  
  adminOnly: [
    '/settings/api-tokens/',
    '/settings/team/',
    '/docker/'
  ]
}

// Route helper functions
export function isProtectedRoute(path) {
  return routeGuards.requiresAuth.some(route => {
    if (route.endsWith('/')) {
      return path.startsWith(route)
    }
    return path === route
  })
}

export function isAdminRoute(path) {
  return routeGuards.adminOnly.some(route => {
    if (route.endsWith('/')) {
      return path.startsWith(route)
    }
    return path === route
  })
}