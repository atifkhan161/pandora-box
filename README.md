# Pandora Box 📦

> **Self-hosted media management PWA for your home server ecosystem**

A comprehensive, mobile-first Progressive Web Application designed to unify media discovery, torrent downloads, file management, Docker orchestration, and Jellyfin server control into a single, Netflix-inspired interface. Built for Raspberry Pi and home lab deployments.

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen)](https://web.dev/progressive-web-apps/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Backend-blue)](https://www.typescriptlang.org/)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Mobile First](https://img.shields.io/badge/Mobile-First-green)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## 🎯 **Overview**

Pandora Box serves as your **single point of control** for a self-hosted media ecosystem, integrating:

- **🎬 Media Discovery** - TMDB & Watchmode APIs for trending movies/TV shows
- **🌊 Torrent Management** - Jackett search with qBittorrent downloads
- **📁 File Operations** - Samba share browsing via Cloud Commander
- **🐳 Container Control** - Docker management through Portainer
- **📺 Media Server** - Jellyfin library updates and monitoring
- **📱 PWA Experience** - Installable, offline-capable mobile app

### **Key Benefits**
- ✅ **CORS-Free Architecture** - All API calls proxied through backend
- ✅ **Mobile-Optimized** - Touch-friendly Netflix-inspired dark theme
- ✅ **Self-Contained** - No external dependencies or cloud services
- ✅ **Docker-Native** - Complete containerized deployment
- ✅ **Real-Time Updates** - Live download progress and system status

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌──────────────────────────────────┐
│   PWA Frontend  │◄──►│        Backend API Server        │
│                 │    │                                  │
│ • Vanilla JS    │    │ • Node.js + TypeScript          │
│ • Service Worker│    │ • Express.js + LokiJS           │
│ • IndexedDB     │    │ • JWT Authentication            │
│ • CSS Variables │    │ • API Proxy Layer               │
└─────────────────┘    └──────────────┬───────────────────┘
                                      │
                       ┌──────────────▼───────────────────┐
                       │        External Services         │
                       │                                  │
                       │ • TMDB/Watchmode (Metadata)     │
                       │ • Jackett (Torrent Search)      │
                       │ • qBittorrent (Downloads)       │
                       │ • Cloud Commander (Files)       │
                       │ • Portainer (Docker)            │
                       │ • Jellyfin (Media Server)       │
                       └──────────────────────────────────┘
```

---

## 📱 **Features & Screenshots**

### **Dashboard - Media Discovery**
- Trending and popular movies/TV shows from TMDB
- Category browsing with horizontal carousels
- Search functionality with real-time results
- One-click torrent search and download

### **Downloads Manager**
- Real-time progress tracking with WebSocket updates
- Pause/resume/delete torrent controls
- Auto-move completed downloads to Samba folders
- Speed, ETA, and seeder/leecher information

### **Ness File Manager**
- Browse Samba shares with breadcrumb navigation
- Move files between Movies/TV Shows folders
- Auto-trigger Jellyfin library refreshes
- File type icons and metadata display

### **Docker Operations**
- Container and stack status monitoring
- One-click restart and log viewing
- ARR stack management with gluetun country switching
- Resource usage monitoring (CPU/Memory)

### **Jellyfin Control**
- Library update triggers for Movies/TV/Collections
- Scan progress monitoring
- Last update timestamps and status

### **Settings & Configuration**
- API token management with connectivity status
- User profile and password management
- Theme customization with live preview
- Team member management

---

## 🚀 **Quick Start**

### **Prerequisites**

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for development)
- **npm 8+**

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/pandora-box.git
cd pandora-box
```

### **2. Production Deployment (Docker)**

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Start all services
docker-compose up -d
```

**Access Points:**
- **Pandora Box PWA**: http://localhost:8080
- **Cloud Commander**: http://localhost:8500
- **Portainer**: http://localhost:9000
- **Jackett**: http://localhost:9117
- **qBittorrent**: http://localhost:8081

### **3. Development Setup**

```bash
# Build and start both services
node build.js

# Or individually:
# Client development
cd client && npm run dev

# Server development  
cd server && npm run dev
```

**Development Servers:**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

---

## ⚙️ **Configuration**

### **Environment Variables**

Create `.env` file in project root:

```env
# Server Configuration
NODE_ENV=production
PORT=8080
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_chars
JWT_EXPIRES_IN=90d

# Database
DATABASE_PATH=./data/database.db

# External API Keys
TMDB_API_KEY=your_tmdb_api_key_from_themoviedb.org
WATCHMODE_API_KEY=your_watchmode_api_key_from_watchmode.com

# Local Services (Docker containers)
JACKETT_URL=http://jackett:9117
JACKETT_API_KEY=your_jackett_api_key

QBITTORRENT_URL=http://qbittorrent:8080  
QBITTORRENT_USERNAME=admin
QBITTORRENT_PASSWORD=your_qbittorrent_password

CLOUDCMD_URL=http://cloudcmd:8000

PORTAINER_URL=http://portainer:9000
PORTAINER_API_KEY=your_portainer_api_key

JELLYFIN_URL=http://jellyfin:8096
JELLYFIN_API_KEY=your_jellyfin_api_key

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Samba Mount Path
SAMBA_MOUNT_PATH=/mnt/samba
```

### **Docker Compose Services**

The included `docker-compose.yml` orchestrates:

| Service | Purpose | Port | Configuration |
|---------|---------|------|---------------|
| **pandora-box** | Main PWA + API | 8080 | JWT auth, API proxy |
| **cloudcmd** | File manager | 8500 | Samba mount access |
| **portainer** | Docker management | 9000 | Docker socket access |
| **jackett** | Torrent indexer | 9117 | Auto-update enabled |
| **qbittorrent** | Download client | 8081 | WebUI enabled |

### **API Keys Setup**

1. **TMDB API Key**:
   - Register at [themoviedb.org](https://www.themoviedb.org/settings/api)
   - Generate API key for free account

2. **Watchmode API Key**:
   - Register at [watchmode.com](https://api.watchmode.com/)
   - Get free tier API key

3. **Service API Keys**:
   - Start Docker services first
   - Access each service web UI to generate API keys
   - Update `.env` file with generated keys

---

## 🔧 **Development Guide**

### **Project Structure**

```
pandora-box/
├── client/                        # PWA Frontend
│   ├── public/
│   │   ├── index.html            # Main HTML file
│   │   ├── manifest.json         # PWA manifest
│   │   ├── sw.js                # Service worker
│   │   └── assets/              # Icons, images
│   ├── css/
│   │   ├── style.css            # Main styles with CSS variables
│   │   └── components.css       # Component-specific styles
│   └── js/
│       ├── app.js               # Main application logic
│       ├── api.js               # API layer
│       ├── auth.js              # Authentication
│       └── router.js            # Client-side routing
│
├── server/                        # TypeScript Backend
│   ├── src/
│   │   ├── controllers/         # Route controllers
│   │   ├── services/            # External API services
│   │   ├── middleware/          # Auth, validation middleware
│   │   ├── routes/              # API route definitions
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Helper functions
│   ├── data/                    # LokiJS database files
│   └── dist/                    # Compiled JavaScript
│
├── docker/                       # Docker configuration
├── docs/                        # Documentation
├── docker-compose.yml           # Service orchestration
├── .env.example                 # Environment template
├── build.js                     # Unified build script
└── README.md                    # This file
```

### **Development Workflow**

#### **Client Development**
```bash
cd client
npm install
npm run dev        # Start dev server with hot reload
npm run build      # Production build
npm run test       # Run tests
npm run lint       # ESLint check
```

#### **Server Development**
```bash
cd server  
npm install
npm run dev        # Start with nodemon + ts-node
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run test       # Run Jest tests
npm run lint       # ESLint + TypeScript check
```

### **API Development**

Backend follows REST conventions:

```typescript
// Example service implementation
export class TMDBService {
  async getTrending(mediaType: 'movie' | 'tv' = 'movie'): Promise<MediaItem[]> {
    const response = await axios.get(`${TMDB_BASE_URL}/trending/${mediaType}/week`, {
      params: { api_key: this.apiKey }
    });
    return response.data.results.map(this.transformMediaItem);
  }
}

// Example route handler
router.get('/trending', authMiddleware, async (req, res) => {
  try {
    const trending = await tmdbService.getTrending(req.query.type);
    res.json({ success: true, data: trending });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### **Frontend Architecture**

Uses modular vanilla JavaScript with ES6 classes:

```javascript
// API Layer
class API {
  async request(endpoint, options = {}) {
    const token = await this.getToken();
    // Handle authentication, errors, token refresh
    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: { 
        'Authorization': `Bearer ${token}`,
        ...options.headers 
      }
    });
  }
}

// Component Pattern
class MediaCard {
  constructor(mediaItem) {
    this.media = mediaItem;
    this.element = this.render();
  }
  
  render() {
    return `
      <div class="media-card" data-id="${this.media.id}">
        <img src="${this.media.poster}" alt="${this.media.title}">
        <div class="media-info">
          <h3>${this.media.title}</h3>
          <span class="year">${this.media.year}</span>
        </div>
      </div>
    `;
  }
}
```

---

## 🧪 **Testing**

### **Running Tests**

```bash
# Full test suite
npm run test

# Frontend tests
cd pandora-box-frontend && npm test

# Backend tests  
cd pandora-box-backend && npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### **Test Types**

1. **Unit Tests**
   - API service functions
   - Authentication logic
   - Component rendering
   - Database operations

2. **Integration Tests**
   - API endpoint responses
   - Database persistence
   - External service mocking
   - PWA functionality

3. **E2E Tests**
   - Complete user workflows
   - Cross-browser testing
   - Mobile device testing
   - PWA installation

### **Performance Testing**

```bash
# PWA Lighthouse audit
npm run audit:pwa

# Bundle size analysis
npm run analyze:bundle

# Load testing
npm run test:load
```

**Performance Targets:**
- PWA Score: >90
- First Load: <3s on 3G
- API Response: <500ms
- Bundle Size: <2MB gzipped

---

## 🐳 **Docker Deployment**

### **Production Deployment**

```bash
# Clone and configure
git clone https://github.com/yourusername/pandora-box.git
cd pandora-box
cp .env.example .env
# Edit .env with your configuration

# Deploy with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f pandora-box

# Update deployment
docker-compose pull
docker-compose up -d --no-deps pandora-box
```

### **Custom Docker Build**

```bash
# Build custom image
docker build -t pandora-box:latest .

# Run with custom configuration
docker run -d \
  --name pandora-box \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  -v /mnt/samba:/mnt/samba:ro \
  --env-file .env \
  pandora-box:latest
```

### **Service Dependencies**

Pandora Box integrates with these containers:

```yaml
# Minimal docker-compose.yml
version: '3.8'
services:
  pandora-box:
    image: pandora-box:latest
    ports: ["8080:8080"]
    depends_on: [cloudcmd, portainer, jackett, qbittorrent]
    
  cloudcmd:
    image: coderaiser/cloudcmd:latest
    ports: ["8500:8000"]
    volumes: ["/mnt/samba:/mnt/fs"]
    
  # ... other services
```

---

## 🔒 **Security**

### **Authentication & Authorization**

- **JWT Tokens**: 90-day expiry with refresh capability
- **bcrypt Hashing**: Secure password storage
- **RBAC**: Role-based access control (admin, team)
- **API Key Management**: Encrypted storage in LokiJS

### **Network Security**

- **CORS Configuration**: Restricted origins
- **HTTPS Enforcement**: Via reverse proxy (Caddy/Nginx)
- **Helmet.js**: Security headers
- **Rate Limiting**: API endpoint protection

### **Data Security**

- **Local Storage**: All data stays on your server
- **Encrypted Tokens**: AES-256-GCM encryption
- **No Telemetry**: No external tracking or analytics
- **Docker Isolation**: Containerized service boundaries

### **Security Best Practices**

```bash
# Change default passwords
# Use strong JWT secrets (32+ characters)
# Enable firewall for Docker ports
# Regular security updates
docker-compose pull && docker-compose up -d
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **PWA Not Installing**
```bash
# Check HTTPS requirement
# Verify manifest.json
# Ensure service worker registration
```

#### **API Connection Errors**
```bash
# Check backend service status
docker-compose logs pandora-box

# Verify environment variables
docker-compose config

# Test API endpoints
curl -X GET http://localhost:8080/api/v1/health
```

#### **External Service Integration**
```bash
# Test service connectivity
docker exec pandora-box curl http://jackett:9117/api/v2.0/indexers

# Check API keys
grep -E "API_KEY|URL" .env

# Restart services
docker-compose restart
```

#### **Database Issues**
```bash
# Check LokiJS file permissions
ls -la data/database.db

# Reset database
docker-compose down
rm -f data/database.db
docker-compose up -d
```

### **Debug Mode**

```bash
# Enable debug logging
NODE_ENV=development docker-compose up

# View detailed logs
docker-compose logs -f --tail=100 pandora-box

# Access container shell
docker exec -it pandora-box sh
```

### **Performance Issues**

```bash
# Monitor resource usage
docker stats

# Check disk space
df -h

# Analyze bundle size
cd pandora-box-frontend && npm run analyze
```

---

## 📚 **API Documentation**

### **Authentication Endpoints**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "rememberMe": true
}
```

### **Media Endpoints**

```http
GET /api/v1/media/trending?type=movie&timeWindow=week
Authorization: Bearer <token>

GET /api/v1/media/popular?type=tv
Authorization: Bearer <token>

GET /api/v1/media/search?query=dune&type=movie
Authorization: Bearer <token>
```

### **Download Endpoints**

```http
GET /api/v1/downloads
Authorization: Bearer <token>

POST /api/v1/downloads/search
Content-Type: application/json
{
  "query": "Dune 2024 1080p"
}

POST /api/v1/downloads/add
Content-Type: application/json
{
  "magnetUrl": "magnet:?xt=urn:btih:..."
}
```

For complete API documentation, run the development server and visit:
**http://localhost:3000/api-docs** (Swagger UI)

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**

```bash
# Fork and clone
git clone https://github.com/yourusername/pandora-box.git
cd pandora-box

# Install dependencies
npm run install:all

# Start development
npm run dev

# Run tests
npm run test:all

# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### **Code Style**

- **TypeScript**: Backend with strict type checking
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

---

## 📈 **Roadmap**

### **Version 2.0** 
- [ ] **Subtitle Integration** - Bazarr API integration
- [ ] **Multi-language Support** - i18n implementation  
- [ ] **Advanced Search** - Filters and sorting options
- [ ] **Statistics Dashboard** - Download and usage analytics

### **Version 2.1**
- [ ] **Federation Support** - Multiple Jackett instances
- [ ] **Remote Access** - WireGuard VPN integration
- [ ] **AI Recommendations** - Local ML-based suggestions
- [ ] **Backup/Sync** - Configuration backup to cloud

### **Long-term**
- [ ] **Plugin System** - Custom extensions
- [ ] **Multi-user** - Individual user profiles and permissions
- [ ] **Advanced Theming** - Custom CSS injection
- [ ] **Notification System** - Discord/Telegram integration

---

## 🙏 **Acknowledgments**

Built with these amazing open-source projects:

- **[TMDB](https://www.themoviedb.org/)** - Movie and TV metadata
- **[Watchmode](https://api.watchmode.com/)** - Streaming availability data
- **[Jackett](https://github.com/Jackett/Jackett)** - Torrent indexer aggregation
- **[qBittorrent](https://www.qbittorrent.org/)** - BitTorrent client
- **[Cloud Commander](https://github.com/coderaiser/cloudcmd)** - Web file manager
- **[Portainer](https://www.portainer.io/)** - Docker container management
- **[Jellyfin](https://jellyfin.org/)** - Media server software
- **[LokiJS](https://github.com/techfort/LokiJS)** - JavaScript database

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⭐ **Support**

If you find this project helpful, please consider:

- ⭐ **Starring** this repository
- 🐛 **Reporting bugs** via GitHub Issues  
- 💡 **Suggesting features** via GitHub Discussions
- 🤝 **Contributing** code improvements

---

**Made with ❤️ for the self-hosting community**

*Pandora Box - Open the box to your media universe* 📦✨