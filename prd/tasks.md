# Pandora Box Development Tasks

## Task 1: Backend API Development

### Overview
Implement a complete TypeScript backend API with Express.js and LokiJS database to serve as the proxy layer for all external services and PWA endpoints.

### Requirements
- **Framework**: Node.js with TypeScript, Express.js
- **Database**: LokiJS (embedded NoSQL)
- **Authentication**: JWT tokens with 90-day expiry
- **Architecture**: All API calls must be proxied through backend (no client-side CORS)

### Detailed Implementation Steps

#### Step 1.1: Project Setup
```bash
# Create and initialize project
mkdir pandora-box-backend && cd pandora-box-backend
npm init -y
npm install express cors helmet morgan compression dotenv bcryptjs jsonwebtoken lokijs uuid
npm install -D @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/uuid typescript ts-node nodemon
npx tsc --init
```

#### Step 1.2: Project Structure
Create the following directory structure:
```
src/
├── controllers/
├── middleware/
├── models/
├── services/
├── routes/
├── types/
├── utils/
└── app.ts
```

#### Step 1.3: Database Setup (src/services/database.ts)
- Initialize LokiJS with file persistence
- Create collections: users, downloads, settings, activityLogs, mediaCache
- Set up indices for performance
- Create default admin user (username: admin, password: admin123)

#### Step 1.4: Authentication System
**Files**: `src/controllers/authController.ts`, `src/middleware/auth.ts`
- Implement login endpoint with bcrypt password validation
- JWT token generation with configurable expiry (24h or 90d based on "Remember Me")
- Token refresh endpoint
- Auth middleware for protected routes
- Activity logging for login/logout events

#### Step 1.5: API Proxy Services
**Required Services** (create separate files in `src/services/`):

**tmdbService.ts**:
- `getTrending(mediaType, timeWindow)` - proxy to TMDB trending API
- `getPopular(mediaType)` - proxy to TMDB popular API
- `search(query, mediaType)` - proxy to TMDB search API
- `getDetails(mediaType, id)` - proxy to TMDB details API
- Transform TMDB response format to standardized MediaItem interface

**jackettService.ts**:
- `searchTorrents(query)` - proxy to Jackett `/api/v2.0/indexers/all/results`
- Parse and return torrent results with magnet URLs, seeders, leechers
- Handle API key authentication

**qbittorrentService.ts**:
- `addTorrent(magnetUrl)` - proxy to qBittorrent `/api/v2/torrents/add`
- `getTorrents()` - proxy to qBittorrent `/api/v2/torrents/info`
- `pauseTorrent(hash)`, `resumeTorrent(hash)`, `deleteTorrent(hash)`
- Handle cookie-based authentication

**cloudcmdService.ts**:
- `listFiles(path)` - proxy to Cloud Commander `/api/v1/fs/`
- `moveFile(sourcePath, destPath)` - proxy to Cloud Commander file operations
- Handle authentication if required

**portainerService.ts**:
- `getContainers()` - proxy to Portainer `/api/endpoints/1/docker/containers/json`
- `getStacks()` - proxy to Portainer stacks API
- `restartContainer(id)` - proxy to container restart
- Handle API token authentication

**jellyfinService.ts**:
- `refreshLibrary(libraryType)` - proxy to Jellyfin library refresh API
- `getLibraryStatus()` - proxy to Jellyfin library status
- Handle API key authentication

#### Step 1.6: API Routes Implementation
**Files**: Create route files in `src/routes/`

**auth.ts**:
- `POST /login` - authenticate user
- `POST /refresh` - refresh JWT token
- `POST /logout` - logout user

**media.ts**:
- `GET /trending` - get trending movies/TV
- `GET /popular` - get popular movies/TV  
- `GET /search` - search movies/TV
- `GET /:type/:id` - get movie/TV details

**downloads.ts**:
- `GET /` - list current downloads from qBittorrent
- `POST /search` - search torrents via Jackett
- `POST /add` - add torrent to qBittorrent
- `POST /:id/pause` - pause download
- `POST /:id/resume` - resume download
- `DELETE /:id` - remove download

**files.ts**:
- `GET /list` - list Samba files via Cloud Commander
- `POST /move` - move files between folders
- `GET /downloads` - list download folder contents

**docker.ts**:
- `GET /containers` - list Docker containers
- `GET /stacks` - list Docker stacks
- `POST /containers/:id/restart` - restart container
- `GET /containers/:id/logs` - get container logs

**jellyfin.ts**:
- `POST /library/refresh` - trigger library refresh
- `GET /library/status` - get library status

#### Step 1.7: Error Handling & Logging
**Files**: `src/utils/logger.ts`, error middleware in `src/app.ts`
- Winston logger setup with file and console transports
- Global error handling middleware
- Request/response logging
- Database operation logging

#### Step 1.8: Main Application Setup (src/app.ts)
- Express app configuration
- Middleware setup (helmet, cors, compression, morgan)
- Route mounting
- Static file serving for PWA
- Health check endpoint
- Error handling

#### Step 1.9: Environment Configuration
Create `.env.example` with all required variables:
```env
NODE_ENV=development
PORT=8080
JWT_SECRET=your_jwt_secret
DATABASE_PATH=./data/database.db
TMDB_API_KEY=your_tmdb_key
JACKETT_URL=http://jackett:9117
JACKETT_API_KEY=your_jackett_key
QBITTORRENT_URL=http://qbittorrent:8080
CLOUDCMD_URL=http://cloudcmd:8000
PORTAINER_URL=http://portainer:9000
JELLYFIN_URL=http://jellyfin:8096
```

#### Step 1.10: Docker Configuration
**Dockerfile**:
- Multi-stage build with Node.js 18 Alpine
- TypeScript compilation
- Non-root user setup
- Health check

**docker-compose.yml**:
- Pandora Box service
- Cloud Commander, Portainer, Jackett, qBittorrent services
- Named volumes for persistence
- Network configuration

### Testing Requirements

#### Unit Tests
- Authentication controller tests (login, token refresh, logout)
- Service proxy tests with mocked external APIs
- Database operations tests
- JWT token validation tests

#### Integration Tests
- Full API endpoint tests
- Database persistence tests
- External service connectivity tests
- Docker container health checks

#### Test Implementation
```bash
npm install -D jest @types/jest supertest
# Create test files in src/__tests__/
# Test database operations with in-memory LokiJS
# Mock external API calls
# Test authentication flows
# Test error handling
```

### Acceptance Criteria
- [ ] All API endpoints respond correctly with proper error handling
- [ ] JWT authentication works with token refresh
- [ ] All external service proxies function without CORS errors
- [ ] Database operations persist correctly
- [ ] Docker deployment works with all services
- [ ] Comprehensive test coverage (>80%)
- [ ] API documentation generated (Swagger/OpenAPI)

---

## Task 2: Frontend PWA Development

### Overview
Develop a mobile-first Progressive Web Application with vanilla JavaScript that consumes the backend API and provides a Netflix-inspired interface for media management.

### Requirements
- **Technology**: Vanilla JavaScript ES6+, HTML5, CSS3
- **Design**: Mobile-first, Netflix dark theme, responsive
- **Features**: Installable PWA, offline capability, touch-optimized
- **Authentication**: IndexedDB token storage, auto-login

### Detailed Implementation Steps

#### Step 2.1: Project Structure
```
public/
├── index.html
├── manifest.json
├── sw.js (service worker)
├── css/
│   ├── style.css
│   ├── components.css
│   └── themes.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── api.js
│   ├── router.js
│   ├── components/
│   └── utils/
└── assets/
    ├── icons/
    └── images/
```

#### Step 2.2: HTML Structure (index.html)
- Semantic HTML5 structure
- Meta tags for PWA (viewport, theme-color)
- Manifest link and service worker registration
- Single page with all views as hidden divs
- Bottom navigation bar for mobile
- Toast notification container
- Modal containers

#### Step 2.3: CSS Framework (css/style.css)
**CSS Variables Setup**:
```css
:root {
  --pb-primary: #e50914;
  --pb-background: #141414;
  --pb-surface: #1f1f1f;
  --pb-text: #ffffff;
  --pb-text-secondary: #b3b3b3;
  /* Add all Netflix-inspired color variables */
}
```

**Component Styles**:
- Cards for media items with hover effects
- Progress bars for downloads
- Grid layouts for media collections
- Form controls with consistent styling
- Loading spinners and skeletons
- Toast notifications
- Modal overlays

**Responsive Design**:
- Mobile-first approach with min-width breakpoints
- Touch-friendly button sizes (44px minimum)
- Optimized typography scales
- Flexible grid systems

#### Step 2.4: API Layer (js/api.js)
**Core API Class**:
```javascript
class API {
  constructor() {
    this.baseURL = '/api/v1';
    this.token = null;
  }
  
  async request(endpoint, options = {}) {
    // Add authorization headers
    // Handle errors and token refresh
    // Return standardized responses
  }
  
  // Authentication methods
  async login(credentials) {}
  async refreshToken() {}
  
  // Media methods
  async getTrending() {}
  async getPopular() {}
  async searchMedia(query) {}
  
  // Download methods
  async searchTorrents(query) {}
  async addDownload(magnetUrl) {}
  async getDownloads() {}
  
  // File methods
  async listFiles(path) {}
  async moveFile(source, dest) {}
  
  // Docker methods
  async getContainers() {}
  async restartContainer(id) {}
  
  // Jellyfin methods
  async refreshLibrary(type) {}
}
```

#### Step 2.5: Authentication System (js/auth.js)
**Token Management**:
- IndexedDB storage for JWT tokens
- Automatic token refresh logic
- Login/logout state management
- Route protection

**Implementation**:
```javascript
class AuthManager {
  async login(username, password, rememberMe) {
    // Call backend login API
    // Store token in IndexedDB
    // Update UI state
  }
  
  async logout() {
    // Clear stored tokens
    // Call backend logout
    // Redirect to login
  }
  
  async checkAuth() {
    // Verify stored token
    // Auto-refresh if needed
    // Return auth status
  }
}
```

#### Step 2.6: Router System (js/router.js)
**Client-Side Routing**:
```javascript
class Router {
  constructor() {
    this.routes = {
      '/': 'dashboard',
      '/downloads': 'downloads',
      '/files': 'files',
      '/docker': 'docker',
      '/jellyfin': 'jellyfin',
      '/settings': 'settings'
    };
  }
  
  navigate(route) {
    // Update URL without reload
    // Show/hide appropriate views
    // Update navigation state
  }
}
```

#### Step 2.7: Page Components

**Login Page**:
- Username/password form
- Remember Me checkbox
- Loading states
- Error handling
- Auto-login on page load if token exists

**Dashboard Page**:
- Hero banner with featured content
- Horizontal scrolling categories (Trending, Popular, etc.)
- Media cards with posters and basic info
- Search functionality
- Download modal with torrent search results
- Category filter navigation

**Downloads Page**:
- List of active/completed downloads
- Real-time progress updates via WebSocket simulation
- Pause/resume/delete controls
- Status indicators (downloading, seeding, completed, error)
- Speed and ETA display

**Files Page (Ness)**:
- Breadcrumb navigation
- File/folder listing with icons
- File size and modification date
- Move operations modal
- Download folder highlighting
- Context menus for file actions

**Docker Page**:
- Container list with status indicators
- Stack grouping
- Restart/stop/logs actions
- Resource usage display (CPU, memory)
- Special handling for ARR stack and gluetun country selection

**Jellyfin Page**:
- Library update buttons (Movies, TV, Collections)
- Update progress indicators
- Last scan timestamps
- Success/error feedback

**Settings Page**:
- User profile section (password change)
- API tokens management with connectivity status
- Theme selector with live preview
- Team management (add/remove users)
- Logout button

#### Step 2.8: PWA Implementation

**Service Worker (sw.js)**:
```javascript
// Cache static assets
// Implement offline fallbacks
// Handle background sync
// Manage cache updates
```

**Manifest (manifest.json)**:
```json
{
  "name": "Pandora Box",
  "short_name": "Pandora",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#141414",
  "background_color": "#141414",
  "icons": [
    // Various icon sizes for different devices
  ]
}
```

#### Step 2.9: Real-time Updates
**WebSocket Simulation**:
- Periodic polling for download status
- Real-time progress updates
- Toast notifications for completed downloads
- Connection status indicators

#### Step 2.10: UI/UX Enhancements
**Interactions**:
- Loading skeletons for content
- Smooth page transitions
- Pull-to-refresh on mobile
- Infinite scrolling for large lists
- Touch gestures for navigation
- Keyboard shortcuts for power users

**Accessibility**:
- ARIA labels and roles
- Keyboard navigation support
- High contrast mode compatibility
- Screen reader optimization
- Focus management

### Testing Requirements

#### Unit Tests
```javascript
// Mock API responses
// Test authentication flows
// Test router functionality  
// Test component rendering
// Test error handling
```

#### Integration Tests
```javascript
// Test full user workflows
// Test PWA installation
// Test offline functionality
// Test API integration
// Test responsive design
```

#### E2E Tests
```javascript
// Login flow
// Media discovery and download
// File management operations
// Docker container management
// Settings configuration
// Theme switching
```

#### Performance Tests
- Lighthouse PWA audit (score >90)
- Page load performance
- Memory usage optimization
- Bundle size analysis

### Acceptance Criteria
- [ ] PWA installable on mobile devices with score >90
- [ ] All pages responsive and touch-optimized
- [ ] Offline functionality for cached content
- [ ] Smooth animations and transitions
- [ ] Netflix-inspired theme with customizable colors
- [ ] Real-time download progress updates
- [ ] Complete user workflow from login to media download
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance metrics meet requirements
- [ ] Comprehensive test coverage

---

## Integration Testing (Both Tasks)

### End-to-End Integration Tests
1. **Full Deployment Test**: Deploy both frontend and backend with all services
2. **API Integration Test**: Verify all frontend API calls work through backend proxy
3. **Authentication Flow Test**: Complete login, token refresh, and logout cycle  
4. **Media Workflow Test**: Search, download, and file management workflow
5. **Docker Management Test**: Container control and monitoring
6. **PWA Installation Test**: Install and use app offline

### Performance Requirements
- API response times <500ms for cached content
- PWA installation and first load <3s on 3G
- Memory usage <50MB for frontend app
- Backend handles 100+ concurrent users

### Documentation Deliverables
- API documentation (Swagger/OpenAPI)
- Frontend component documentation
- Deployment guide with Docker Compose
- User manual for administrators
- Development setup instructions

Each task is designed to be independent and can be assigned to different developers or AI assistants with clear acceptance criteria and testing requirements.