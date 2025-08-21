# Pandora Box PWA Development Tasks (Enhanced with Context)

## Overview
This document breaks down the development of Pandora Box PWA into prioritized, testable tasks divided between Backend and Frontend development. Each task includes detailed context paragraphs and bullet-point instructions for AI code assistants to understand the full requirements and system architecture.

---

## Priority 1: Core Infrastructure & Authentication

### Task 1: Backend Foundation Setup
**Priority:** Critical - Must be completed first
**Estimated Time:** 4-6 hours
**Testing:** Basic server startup and API endpoints

#### Requirements Context:
Pandora Box is a self-hosted Progressive Web Application designed to unify media discovery, download management, file operations, container control, and media server updates on a Raspberry Pi or similar home server. The backend serves as the central proxy for all API calls to prevent CORS issues and secure API key management. This foundation task establishes the core Node.js/TypeScript/Express.js architecture that will handle all API proxying to third-party services (TMDB, Watchmode, Jackett, qBittorrent, Cloud Commander, Portainer, Jellyfin). The backend must be configured with proper security middleware, error handling, and environment configuration to support JWT authentication, RBAC (admin/team roles), and secure token management. All sensitive data will be stored server-side in LokiJS database, never exposed to the frontend. The server needs to support both REST API endpoints and WebSocket connections for real-time updates, particularly for download status monitoring from qBittorrent.

#### Backend Instructions:
- Set up Node.js project with TypeScript configuration
- Install dependencies: express, cors, helmet, jsonwebtoken, bcryptjs, dotenv, ws (WebSocket)
- Create project structure: `/src`, `/src/routes`, `/src/middleware`, `/src/controllers`, `/src/models`, `/src/utils`, `/src/services`
- Configure TypeScript with strict mode and ES2020 target
- Set up Express.js server with middleware for CORS, JSON parsing, security headers (helmet)
- Create environment configuration using dotenv for port, JWT secret, API keys placeholders
- Implement basic error handling middleware with proper HTTP status codes
- Create health check endpoint (`GET /api/v1/health`)
- Set up development scripts in package.json (dev, build, start, test)
- Configure nodemon for development auto-restart
- Add basic logging setup using winston or similar

#### Frontend Instructions (Minimal Setup):
- Create basic HTML5 structure with PWA meta tags and viewport configuration
- Set up service worker registration placeholder for offline functionality
- Create basic CSS with CSS variables namespace `--pb-` for Netflix-inspired dark theme
- Implement basic ES6 module structure with proper imports/exports
- Create config.js for API base URL configuration and environment detection
- Add basic error handling for network requests

---

### Task 2: LokiJS Database Integration
**Priority:** Critical - Required for all data persistence
**Estimated Time:** 3-4 hours
**Testing:** Database operations and data persistence

#### Requirements Context:
LokiJS serves as the embedded NoSQL database for Pandora Box, storing all user data, configuration, authentication credentials, API tokens, session information, activity logs, and persistent application state. Unlike traditional databases, LokiJS is a JavaScript-based embedded database that runs in-process with the Node.js application, providing fast reads/writes without external dependencies. The database must support multiple collections for different data types: users (admin/team), sessions (JWT tokens), settings (user preferences), api_tokens (encrypted third-party API keys), download_history (qBittorrent activity), file_operations (Cloud Commander actions), container_logs (Portainer status), and media_cache (TMDB/Watchmode responses). The database file must be persisted to disk and support automatic saving, backup capabilities, and data encryption for sensitive information like API keys and passwords. Collections should have proper indexing for performance and validation schemas to ensure data integrity.

#### Backend Instructions:
- Install lokijs dependency and @types/lokijs for TypeScript support
- Create database connection service in `/src/services/database.ts`
- Initialize LokiJS with file persistence mode and automatic save intervals
- Create collections: users, sessions, settings, api_tokens, download_history, file_operations, container_logs, media_cache
- Implement database service methods: insert, find, update, delete, findOne for each collection
- Add proper indexing on frequently queried fields (user_id, session_token, timestamps)
- Create database initialization script with default admin user (password: hashed)
- Add database backup/restore utilities with timestamp-based naming
- Implement data validation schemas for each collection using joi or similar
- Create database health check methods and connection status monitoring
- Add database connection to Express app startup with proper error handling
- Implement data encryption for sensitive fields using crypto module

---

### Task 3: User Authentication System
**Priority:** Critical - Required for all secure operations
**Estimated Time:** 5-6 hours
**Testing:** Login, logout, token validation, session management

#### Requirements Context:
Authentication is fundamental to Pandora Box's security model, protecting access to sensitive operations like torrent downloads, file management, and Docker container control. The system must support a default "admin" user with configurable password, JWT token-based sessions with 90-day expiry for "Remember Me" functionality, and role-based access control (RBAC) for admin and team users. All authentication data must be stored securely in LokiJS with password hashing using bcryptjs. The frontend must store JWT tokens in IndexedDB (not localStorage) for enhanced security. The system needs to handle session expiry gracefully, provide automatic token refresh, and support user management features like password changes and team member administration. Rate limiting must be implemented to prevent brute force attacks, and all authentication events should be logged for security auditing.

#### Backend Instructions:
- Create User model with password hashing using bcryptjs (salt rounds: 12)
- Implement JWT token generation and validation middleware with proper secret rotation
- Create authentication controller with login, logout, token refresh, change password endpoints
- Add password strength validation (minimum 8 chars, uppercase, lowercase, numbers, special chars)
- Implement "Remember Me" functionality with 90-day token expiry vs 24-hour default
- Create RBAC middleware for admin/team roles with endpoint-level authorization
- Add rate limiting for login attempts (5 attempts per 15 minutes per IP)
- Create user management endpoints (create user, delete user, list users, change roles)
- Implement session cleanup job for expired tokens (runs every hour)
- Add authentication routes: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/verify`, `POST /api/v1/auth/refresh`
- Create audit logging for all authentication events
- Add password reset functionality with secure token generation

#### Frontend Instructions:
- Create responsive login form with username, password, and "Remember Me" checkbox
- Implement secure token storage using IndexedDB with proper error handling
- Create authentication service for login/logout operations with automatic retry
- Add automatic token refresh logic with background renewal 5 minutes before expiry
- Implement login state management across application with reactive state updates
- Create password change form with strength validation and confirmation
- Add logout functionality with token cleanup and redirect to login
- Implement route protection for authenticated areas using navigation guards
- Create authentication status indicators in UI (user avatar, login status)
- Add session expiry handling with automatic redirect and user notification
- Implement offline authentication state persistence

---

## Priority 2: Core PWA Features

### Task 4: Progressive Web App Implementation
**Priority:** High - Essential for mobile experience
**Estimated Time:** 4-5 hours
**Testing:** PWA installation, offline functionality, responsive design

#### Requirements Context:
Pandora Box is designed as a mobile-first PWA optimized for touch interfaces and small screens, providing a Netflix-inspired dark theme experience. The PWA must be installable on mobile devices and desktops, support offline functionality for core features, and provide responsive layouts that work across all screen sizes. The service worker should implement intelligent caching strategies: cache-first for static assets (CSS, JS, images) and network-first for API calls with fallbacks. The app should support offline viewing of cached media metadata, previously loaded download status, and basic navigation. The manifest.json must be configured with proper app metadata, icons, and display modes. The CSS architecture should use CSS variables with the `--pb-` namespace to enable dynamic theming, starting with a Netflix-inspired dark palette that can be switched in real-time without page reloads.

#### Frontend Instructions:
- Create comprehensive manifest.json with app icons (192x192, 512x512), theme colors, display mode "standalone"
- Implement service worker for caching strategies: cache-first for static assets, network-first for API calls
- Add offline page and offline detection with proper user feedback
- Create responsive CSS grid/flexbox layouts for mobile-first design (breakpoints: 320px, 768px, 1024px, 1440px)
- Implement touch-friendly UI components with minimum 44px touch targets
- Add PWA installation prompts and install button with browser support detection
- Create app icons in multiple sizes including maskable icons for Android
- Implement Netflix-inspired dark theme with CSS variables: `--pb-primary`, `--pb-secondary`, `--pb-accent`, `--pb-background`, `--pb-surface`, `--pb-text`
- Add loading states and skeleton screens for better perceived performance
- Configure viewport meta tag for mobile optimization and prevent zoom on inputs
- Add swipe gestures for navigation on touch devices
- Implement pull-to-refresh functionality for data updates

#### Backend Instructions:
- Serve manifest.json and service worker files with proper MIME types
- Configure static file serving with proper cache headers (1 year for immutable assets)
- Add Content-Security-Policy headers for PWA security compliance
- Implement gzip compression for assets and API responses
- Add PWA-specific API endpoints for offline data sync and cache management
- Create cache invalidation endpoints for forcing updates

---

### Task 5: API Proxy Infrastructure
**Priority:** High - Required for all third-party integrations
**Estimated Time:** 4-5 hours
**Testing:** Proxy endpoints working without CORS issues

#### Requirements Context:
All client-side API calls in Pandora Box must route exclusively through the backend proxy to prevent CORS issues, centralize API key management, and provide unified error handling and logging. The proxy infrastructure will handle communications with TMDB (movie/TV metadata), Watchmode (streaming availability), Jackett (torrent indexing), qBittorrent (download management), Cloud Commander (file operations), Portainer (container management), and Jellyfin (media server control). Each service requires different authentication mechanisms: API keys for TMDB/Watchmode, basic auth for qBittorrent, and various token-based auth for other services. The proxy must implement request/response logging, error mapping to user-friendly messages, timeout handling, retry logic with exponential backoff, and rate limiting per service. Caching should be implemented for metadata requests to improve performance and reduce API usage, with different cache durations based on data volatility.

#### Backend Instructions:
- Create generic HTTP client service using axios with interceptors for logging and error handling
- Implement API proxy middleware with service-specific configuration (timeouts, retry logic, rate limits)
- Create configuration service for managing API endpoints, keys, and authentication methods
- Add comprehensive request/response logging with request IDs for tracing
- Implement request timeout handling (10s for metadata, 30s for file operations, 5s for status checks)
- Create retry logic with exponential backoff (3 retries max, starting with 1s delay)
- Add rate limiting per API service (TMDB: 40 req/10s, qBittorrent: 100 req/min)
- Implement caching layer for metadata requests: TMDB trending (6 hours), search results (1 hour), movie details (24 hours)
- Create health check endpoints for each external service with connectivity monitoring
- Add API error mapping to user-friendly messages with proper HTTP status codes
- Implement API key validation and rotation mechanisms
- Create proxy endpoints structure: `/api/v1/proxy/{service}/{endpoint}`

#### Frontend Instructions:
- Create centralized API service layer with service-specific methods
- Implement request interceptors for authentication token injection
- Add error handling and user-friendly error messages with retry options
- Create loading states for API calls with progress indicators
- Implement toast notification system for API errors and success messages
- Add connectivity status indicators with real-time service health display
- Create API status dashboard component showing service availability and response times
- Implement request caching on frontend for frequently accessed data
- Add offline support with cached data fallbacks

---

## Priority 3: Media Discovery & Search

### Task 6: TMDB Integration
**Priority:** High - Core feature for media discovery
**Estimated Time:** 6-7 hours
**Testing:** Movie/TV search, metadata display, trending content

#### Requirements Context:
TMDB (The Movie Database) integration provides the core media discovery functionality for Pandora Box, delivering movie and TV show metadata including titles, posters, cast, crew, ratings, and detailed information. The integration must support trending content (daily/weekly), popular content, top-rated, upcoming releases, and comprehensive search functionality. Data should be cached appropriately to minimize API usage while keeping content fresh - trending data can be cached for 6 hours, search results for 1 hour, and detailed metadata for 24 hours. The system must handle TMDB's image URL construction for posters and backdrops in multiple sizes, implement pagination for large result sets, and provide filtering capabilities by genre, year, rating, and content type. All TMDB API calls must be proxied through the backend with proper API key management and error handling.

#### Backend Instructions:
- Create TMDB service with API v3 integration and proper TypeScript interfaces
- Implement endpoints: trending (movie/tv, day/week), popular, top-rated, upcoming, search, genre list
- Add detailed metadata endpoints for movies and TV shows with full cast/crew information
- Implement TMDB image URL construction helper for different sizes (w300, w500, w780, original)
- Create caching strategy: trending (6 hours), popular (12 hours), search (1 hour), details (24 hours)
- Implement search functionality with filters (genre, year, rating, adult content)
- Add pagination support with proper limit/offset handling (default 20 items per page)
- Create data transformation layer to normalize TMDB responses for frontend consumption
- Implement TMDB API key validation and quota monitoring
- Add endpoints: `GET /api/v1/tmdb/trending/{type}/{time}`, `GET /api/v1/tmdb/search`, `GET /api/v1/tmdb/details/{type}/{id}`, `GET /api/v1/tmdb/popular/{type}`, `GET /api/v1/tmdb/genres`
- Create metadata enrichment by combining multiple TMDB endpoints
- Add error handling for TMDB rate limits and service unavailability

#### Frontend Instructions:
- Create responsive movie/TV card components with poster, title, year, rating, and genre badges
- Implement horizontal carousel for trending/popular content with touch/swipe support
- Create comprehensive search interface with autocomplete and advanced filters
- Add detailed view modal/page for selected content with full cast, crew, and metadata
- Implement infinite scrolling for search results with loading indicators
- Create responsive grid layouts for different screen sizes (2 cols mobile, 4 cols tablet, 6 cols desktop)
- Add image lazy loading for posters with placeholder images and error handling
- Implement genre filtering with multi-select and sorting options (popularity, rating, release date)
- Create local watchlist functionality with persistent storage
- Add cast and crew information display with expandable sections
- Implement similar content recommendations display
- Create content type switcher (movies/TV shows) with state persistence

---

### Task 7: Watchmode Integration
**Priority:** Medium - Enhances media discovery with streaming availability
**Estimated Time:** 4-5 hours
**Testing:** Streaming availability data, provider information

#### Requirements Context:
Watchmode integration enhances the media discovery experience by providing streaming availability information, showing users where content can be watched across different platforms like Netflix, Hulu, Amazon Prime, etc. This integration works in conjunction with TMDB data, using TMDB IDs to lookup streaming availability across different regions. The system must support provider filtering by region (default US, but configurable), display provider logos and direct links, and cache availability data appropriately since it changes less frequently than other metadata. The integration should handle cases where streaming availability is not found gracefully and provide fallback options. Data should be merged intelligently with TMDB information to create a unified content discovery experience.

#### Backend Instructions:
- Create Watchmode service integration with proper API authentication
- Implement streaming availability lookup using TMDB IDs as cross-reference
- Add provider filtering by region with configurable default (US) and support for multiple regions
- Create data merging logic to combine TMDB and Watchmode data efficiently
- Implement Watchmode API error handling with graceful fallbacks when availability not found
- Add caching for streaming availability data (cache for 24 hours due to relative stability)
- Create provider information endpoints with logos, names, and direct links
- Add region management for availability lookups with user preference storage
- Implement availability change tracking and notifications (future enhancement hook)
- Create endpoints: `GET /api/v1/watchmode/availability/{tmdb_id}`, `GET /api/v1/watchmode/providers`, `GET /api/v1/watchmode/regions`
- Add data transformation to normalize provider information
- Implement provider priority ranking based on user preferences

#### Frontend Instructions:
- Add streaming provider badges to movie/TV cards with provider logos
- Create comprehensive "Where to Watch" section in detailed content views
- Implement provider filtering in search with provider logo display
- Add provider availability indicators with pricing information when available
- Create region selection interface for streaming availability with flag icons
- Add "Available Now" vs "Coming Soon" indicators with dates
- Implement provider priority display based on user subscription preferences
- Create provider comparison view for content available on multiple platforms
- Add direct links to streaming providers with proper external link handling
- Implement availability notifications for watchlist items (preparation for future features)

---

## Priority 4: Download Management

### Task 8: Jackett Torrent Search Integration
**Priority:** High - Core feature for content acquisition
**Estimated Time:** 5-6 hours
**Testing:** Torrent search, magnet link handling, indexer management

#### Requirements Context:
Jackett serves as the torrent index aggregator for Pandora Box, providing unified search across multiple torrent indexers/trackers. The integration must search across all configured indexers simultaneously, aggregate and deduplicate results, and present them in a user-friendly format with quality filtering, seeder/leecher information, and file size details. The system should support quality filtering (4K, 1080p, 720p, etc.), trusted uploader identification, and sorting by various criteria. Magnet links must be validated before being passed to qBittorrent for downloading. Search results should be cached temporarily (15 minutes) to improve performance for repeated searches. The integration should monitor indexer health and provide feedback when indexers are unavailable or experiencing issues.

#### Backend Instructions:
- Create Jackett service integration using Jackett's REST API with proper authentication
- Implement comprehensive torrent search across all configured indexers with parallel requests
- Add search result aggregation and deduplication based on info hash and file name similarity
- Create quality/resolution filtering with regex patterns (4K/2160p, 1080p, 720p, 480p)
- Implement seeders/leechers ratio sorting and minimum seeder filtering
- Add trusted uploader filtering with configurable trusted user lists
- Create magnet link validation and info hash extraction
- Add search result caching with 15-minute expiry to improve repeat search performance
- Implement indexer health monitoring with connectivity checks and error reporting
- Create search history storage with user-specific search logging in LokiJS
- Add advanced search filters: file size range, upload date, category (movie/TV)
- Create endpoints: `POST /api/v1/jackett/search`, `GET /api/v1/jackett/indexers`, `GET /api/v1/jackett/categories`
- Implement search result ranking algorithm based on seeders, quality, and file size
- Add NSFW content filtering with configurable settings

#### Frontend Instructions:
- Create comprehensive torrent search modal with quality and size filters
- Implement search results table with sortable columns (seeders, leechers, size, quality, age)
- Add download buttons for magnet links with confirmation dialogs
- Create indexer status indicators showing available/unavailable trackers
- Implement search history with quick re-search functionality
- Add quality preference settings with automatic filtering
- Create torrent details view showing complete file listings and tracker information
- Add search filters for file size ranges and upload date with date picker
- Implement trusted uploader highlighting with badges or color coding
- Create search result export functionality for external download managers
- Add keyboard shortcuts for search and result navigation
- Implement search suggestions based on previously searched content

---

### Task 9: qBittorrent Integration
**Priority:** High - Essential for download management
**Estimated Time:** 6-7 hours
**Testing:** Download initiation, progress tracking, file management

#### Requirements Context:
qBittorrent integration manages the actual downloading of torrents initiated from Jackett searches, providing real-time download monitoring, control, and automation features. The system must support adding torrents via magnet links, monitoring download progress through WebSocket connections for real-time updates, and providing full download control (pause, resume, delete, priority management). Downloads should be automatically categorized (movies vs TV shows) and moved to appropriate folders upon completion. The integration needs to trigger Jellyfin library refreshes after successful downloads and file moves. Speed limiting, bandwidth monitoring, and download queue management are essential features. All download activities must be logged in LokiJS for history tracking and troubleshooting.

#### Backend Instructions:
- Create qBittorrent Web API integration with session management and authentication
- Implement torrent addition via magnet links with automatic categorization (movies/TV)
- Add comprehensive download status monitoring with real-time WebSocket updates
- Create torrent control actions: pause, resume, delete, set priority, force recheck
- Implement automatic file moving after completion to designated Samba folders
- Add download speed limiting controls (global and per-torrent limits)
- Create download categorization system with automatic folder assignment
- Implement bandwidth usage monitoring and statistics collection
- Add download queue management with priority-based ordering
- Create automatic Jellyfin library refresh triggers after successful file moves
- Implement download completion notifications and email alerts (if configured)
- Add endpoints: `POST /api/v1/qbittorrent/add`, `GET /api/v1/qbittorrent/torrents`, `POST /api/v1/qbittorrent/control/{action}/{hash}`
- Create download history logging with detailed status tracking
- Implement disk space monitoring and download path management

#### Frontend Instructions:
- Create comprehensive downloads dashboard with real-time progress bars and status indicators
- Implement WebSocket connection for live download updates with reconnection logic
- Add download control interface with pause, resume, delete, and priority buttons
- Create download queue management with drag-and-drop reordering
- Implement download notifications using browser notification API
- Add bandwidth usage charts showing download/upload speeds over time
- Create download history view with filtering by status, date, and category
- Implement file preview for completed downloads with file type detection
- Add download categorization interface with folder mapping
- Create batch operations for multiple torrent selection and control
- Implement download completion sound notifications and visual indicators
- Add download statistics dashboard with success rates and speed averages

---

## Priority 5: File Management

### Task 10: Cloud Commander Integration (Samba File Management)
**Priority:** High - Essential for file organization
**Estimated Time:** 5-6 hours
**Testing:** File browsing, moving files, folder operations

#### Requirements Context:
Cloud Commander integration provides the file management capabilities for organizing downloaded content within Samba shares, allowing users to browse the file system, move files between folders (especially from Downloads to Movies/TV Shows), and perform various file operations. The system must support hierarchical folder navigation with breadcrumb trails, file operations (move, copy, delete, rename), and automatic Jellyfin library refresh triggers when files are moved to media folders. File operations should be logged in LokiJS for audit purposes and undo functionality. The interface must be touch-friendly for mobile users and support drag-and-drop operations. Special attention is needed for media file organization with automatic folder creation and path sanitization to prevent conflicts.

#### Backend Instructions:
- Create Cloud Commander API integration with proper Samba share authentication
- Implement comprehensive file browser with recursive directory listing and metadata
- Add file operations: move, copy, delete, rename with proper error handling and rollback
- Create folder structure navigation with breadcrumb generation and parent directory tracking
- Implement file permission handling and access control validation
- Add file type detection with MIME type identification and custom icons
- Create automatic media folder creation (Movies/TV Shows) with proper path sanitization
- Implement file operation logging in LokiJS with operation history and undo capabilities
- Add batch file operations with progress tracking for large operations
- Create automatic Jellyfin library refresh triggers after media folder changes
- Implement file search functionality within directory structures
- Add endpoints: `GET /api/v1/cloudcmd/browse/{path}`, `POST /api/v1/cloudcmd/operation`, `GET /api/v1/cloudcmd/search`
- Create file operation queuing system for large batch operations
- Add disk usage monitoring and storage analytics

#### Frontend Instructions:
- Create intuitive file browser interface with folder tree and list views
- Implement breadcrumb navigation with clickable path segments
- Add drag-and-drop file operations with visual feedback and confirmation
- Create context menu for file actions with keyboard shortcut support
- Implement file selection with multi-select using checkboxes and keyboard modifiers
- Add file operation progress indicators with cancellation options
- Create media folder quick actions (Move to Movies/TV Shows) with one-click operations
- Implement file search within directories with real-time filtering
- Add file operation history and undo functionality with operation replay
- Create file preview capabilities for images and text files
- Implement file sorting by name, size, date, and type with persistent preferences
- Add folder creation and management tools with templates for media organization

---

## Priority 6: Container Management

### Task 11: Portainer Integration
**Priority:** Medium - System monitoring and control
**Estimated Time:** 5-6 hours
**Testing:** Container status, stack management, log viewing

#### Requirements Context:
Portainer integration provides Docker container and stack monitoring and management capabilities, allowing users to monitor the health of all services in their Pandora Box ecosystem including the ARR stack (Jackett, qBittorrent, etc.), view container logs, restart services, and manage Docker stacks. The system must distinguish between individual containers and Docker Compose stacks, provide color-coded health indicators (green for running, amber for issues, red for stopped), and offer control actions like restart, stop, and log viewing. Special functionality is needed for the ARR stack to change gluetun VPN country settings and restart the entire stack. All container operations should be logged for audit purposes and troubleshooting.

#### Backend Instructions:
- Create Portainer API integration with proper authentication token management
- Implement container listing with comprehensive status information and metadata
- Add Docker stack management with stack-specific operations and dependencies
- Create container control actions: start, stop, restart, remove with proper error handling
- Implement log retrieval with pagination, filtering, and real-time log streaming
- Add container health monitoring with custom health check definitions
- Create resource usage monitoring (CPU, memory, network, disk) with historical data
- Implement gluetun country change functionality for ARR stack with automatic restart
- Add container update checking with version comparison and update notifications
- Create container operation logging with detailed action history in LokiJS
- Implement stack template management for easy deployment of new services
- Add endpoints: `GET /api/v1/portainer/containers`, `POST /api/v1/portainer/control`, `GET /api/v1/portainer/logs/{id}`, `GET /api/v1/portainer/stacks`
- Create container dependency mapping and cascade operation handling
- Add Docker image management with cleanup and optimization tools

#### Frontend Instructions:
- Create comprehensive containers dashboard with status cards and health indicators
- Implement color-coded health status system (green=running, amber=warning, red=stopped)
- Add container control interface with confirmation dialogs for destructive operations
- Create log viewer with real-time updates, filtering, and search capabilities
- Implement stack management interface with stack-level operations
- Add resource usage visualization with charts and historical data
- Create container update notifications with change highlighting
- Implement ARR stack special controls with gluetun country selection
- Add container dependency visualization showing service relationships
- Create container troubleshooting tools with guided problem resolution
- Implement container performance monitoring with alerting capabilities
- Add bulk container operations with batch selection and execution

---

## Priority 7: Media Server Integration

### Task 12: Jellyfin Integration
**Priority:** Medium - Media library management
**Estimated Time:** 4-5 hours
**Testing:** Library scans, server status, update triggers

#### Requirements Context:
Jellyfin integration provides media server management capabilities, allowing users to trigger library scans for Movies, TV Shows, and Collections after new content is downloaded and organized. The system must monitor scan status and progress, display library statistics, and provide automated scan scheduling based on file operations. Integration should handle Jellyfin's API authentication, manage multiple library types, and provide detailed scan history and error reporting. The system should automatically trigger appropriate library scans when files are moved to media folders through Cloud Commander operations.

#### Backend Instructions:
- Create Jellyfin API integration with proper authentication and session management
- Implement library scan triggers for Movies, TV Shows, Collections, and mixed libraries
- Add scan status monitoring with progress tracking and completion notifications
- Create library statistics retrieval including item counts, disk usage, and scan history
- Implement Jellyfin server health monitoring with connectivity checks and version information
- Add user library access management with permissions and sharing controls
- Create automatic scan scheduling with configurable intervals and triggers
- Implement scan history logging with detailed success/failure tracking in LokiJS
- Add library cleanup operations with duplicate detection and removal
- Create metadata refresh capabilities with external provider integration
- Implement scan queue management to prevent concurrent scan conflicts
- Add endpoints: `POST /api/v1/jellyfin/scan`, `GET /api/v1/jellyfin/status`, `GET /api/v1/jellyfin/libraries`, `GET /api/v1/jellyfin/stats`
- Create automatic scan triggers based on Cloud Commander file operations
- Add Jellyfin plugin management for enhanced functionality

#### Frontend Instructions:
- Create Jellyfin control panel with library-specific scan buttons
- Add scan progress indicators with real-time status updates and estimated completion times
- Implement library statistics dashboard with visual charts and data summaries
- Create scan history view with filtering by library, date, and status
- Add automatic scan configuration interface with trigger settings
- Implement scan notifications with completion status and item counts
- Create library health monitoring with error reporting and troubleshooting tips
- Add scan queue management showing pending and active scans
- Implement library performance metrics with scan duration and success rates
- Create Jellyfin server status dashboard with version and connectivity information

---

## Priority 8: Settings & Configuration

### Task 13: Settings Management
**Priority:** Medium - User configuration and preferences
**Estimated Time:** 4-5 hours
**Testing:** Settings persistence, API token management, theme switching

#### Requirements Context:
Settings management provides comprehensive user configuration capabilities including API token management for all integrated services, user profile management, team user administration, and application preferences. All sensitive API keys and tokens must be encrypted and stored in LokiJS, never exposed to the frontend. The system must support role-based access control for different user types (admin vs team), password management with strength requirements, and theme customization using CSS variables. Settings should be organized into logical sections (Profile, API Tokens, Team Management, Appearance, Notifications) with proper validation and error handling.

#### Backend Instructions:
- Create comprehensive settings management service with encrypted storage
- Implement API token storage and management with encryption using crypto module
- Add user profile management including password changes with strength validation
- Create team user management with role assignment and permission control
- Implement settings validation with schema-based input checking
- Add settings backup and restore functionality with export/import capabilities
- Create settings change logging with audit trail for security purposes
- Implement settings versioning for rollback capabilities and change tracking
- Add notification preferences management with email/push notification controls
- Create theme settings storage with custom CSS variable management
- Implement settings synchronization across multiple user sessions
- Add endpoints: `GET /api/v1/settings`, `PUT /api/v1/settings/{category}`, `POST /api/v1/users/manage`, `GET /api/v1/users/profile`
- Create settings migration system for application updates
- Add settings validation and sanitization for security

#### Frontend Instructions:
- Create comprehensive settings dashboard with tabbed interface and navigation
- Implement API token management form with masked input fields and validation
- Add user profile management with password change functionality and strength meter
- Create team user management interface with role assignment and user lifecycle management
- Implement theme customization interface with real-time preview and CSS variable editing
- Add settings validation with real-time feedback and error highlighting
- Create settings import/export functionality with file handling and validation
- Implement settings search and filtering for large configuration sets
- Add settings backup reminder and automatic backup scheduling
- Create settings reset functionality with confirmation dialogs and selective reset options

---

### Task 14: Theme System & UI Polish
**Priority:** Low - Visual enhancement
**Estimated Time:** 3-4 hours
**Testing:** Theme switching, responsive design, accessibility

#### Requirements Context:
The theme system enables dynamic customization of Pandora Box's appearance using CSS variables with the `--pb-` namespace, starting with a Netflix-inspired dark theme as default. The system must support real-time theme switching without page reloads, multiple theme presets, and custom theme creation. Accessibility is crucial with proper color contrast ratios, focus indicators, and ARIA labels throughout the interface. The responsive design must work seamlessly across all device sizes from mobile phones to desktop displays, with touch-friendly interactions and keyboard navigation support.

#### Frontend Instructions:
- Implement complete CSS variables theme system with `--pb-` namespace for all colors, spacing, and typography
- Create multiple theme presets: Netflix Dark (default), Light Mode, High Contrast, Accessibility Enhanced
- Add real-time theme switching without page reload using CSS variable updates
- Implement responsive breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+), large desktop (1440px+)
- Add comprehensive accessibility features: focus indicators, ARIA labels, screen reader support, keyboard navigation
- Create smooth loading animations and transitions with reduced motion support
- Implement keyboard navigation support with proper tab order and focus management
- Add print styles for reports and documentation with optimized layouts
- Create comprehensive error state illustrations and empty state designs
- Implement tooltip system for help text with proper positioning and accessibility
- Add micro-interactions for button hover states, form validation, and user feedback
- Create consistent spacing system using CSS custom properties for margins and padding

---

## Priority 9: Advanced Features

### Task 15: Real-time Notifications & WebSocket Integration
**Priority:** Low - Enhanced user experience
**Estimated Time:** 4-5 hours
**Testing:** Real-time updates, notification system

#### Requirements Context:
Real-time notifications enhance the user experience by providing instant feedback about download progress, container status changes, and system events through WebSocket connections. The system must support browser notifications (when HTTPS is available), toast notifications within the app, and persistent notification history. WebSocket connections should handle reconnection automatically and provide fallback polling for unreliable connections. Notifications should be categorized by type (downloads, system, errors) with user-configurable preferences for each category.

#### Backend Instructions:
- Implement WebSocket server using ws library with connection management and heartbeat
- Create notification service with categorization (download, system, error, info)
- Add real-time container status updates with change detection and broadcasting
- Implement broadcast messaging for system events and maintenance notifications
- Create notification persistence in LokiJS with history tracking and cleanup
- Add notification preferences management with per-user and per-category settings
- Implement notification queuing for offline users with delivery on reconnection
- Create notification templates with variable substitution and formatting
- Add notification rate limiting to prevent spam and system overload
- Implement notification acknowledgment and read status tracking

#### Frontend Instructions:
- Implement WebSocket client with automatic reconnection and connection status indication
- Create comprehensive toast notification system with multiple severity levels
- Add browser push notification support with proper permission handling (HTTPS required)
- Implement notification history with filtering by category and date
- Create notification settings interface with granular control per notification type
- Add notification sound effects with user-configurable volume and sound selection
- Implement notification badges and counters for unread notifications
- Create notification grouping for related events (e.g., multiple download completions)
- Add notification actions (dismiss, mark as read, quick actions)
- Implement notification persistence across browser sessions

---

### Task 16: Backup & Recovery System
**Priority:** Low - System maintenance
**Estimated Time:** 3-4 hours
**Testing:** Data backup, configuration export

#### Requirements Context:
The backup and recovery system ensures data safety and enables easy migration of Pandora Box configurations and user data. The system must support automated backups of the LokiJS database, configuration exports including API tokens and user settings, backup scheduling with retention policies, and complete system recovery procedures. Backups should be encrypted and stored securely, with options for local storage and external backup destinations.

#### Backend Instructions:
- Create automated backup system for LokiJS database with timestamped files
- Implement configuration export/import with encrypted sensitive data handling
- Add backup scheduling with configurable intervals (daily, weekly, monthly)
- Create backup verification with integrity checks and corruption detection
- Implement backup retention policies with automatic cleanup of old backups
- Add backup compression using gzip to reduce storage requirements
- Create incremental backup support for large databases
- Implement backup restoration with rollback capabilities and conflict resolution
- Add backup storage management with multiple destination support
- Create backup monitoring with success/failure notifications and alerting

---

## Testing Strategy

### Integration Testing Priority:
1. **Authentication Flow** - Login, token validation, session management, role-based access
2. **Media Discovery** - TMDB search, Watchmode integration, content display
3. **Download Pipeline** - Jackett search → qBittorrent download → file management
4. **File Management** - Cloud Commander operations → Jellyfin library updates
5. **Container Control** - Portainer integration, health monitoring, log access
6. **End-to-End Workflow** - Complete user journey from search to organized media

### Testing Requirements per Task:
- **Unit Tests**: All API endpoints, services, and utility functions with >80% coverage
- **Integration Tests**: Third-party API integrations with mock services and error scenarios
- **E2E Tests**: Complete user workflows using Playwright or Cypress
- **Performance Tests**: API response times, file operations, database queries
- **Security Tests**: Authentication, authorization, input validation, XSS prevention
- **Accessibility Tests**: Screen reader compatibility, keyboard navigation, color contrast

---

## Development Notes

### Code Quality Requirements:
- TypeScript strict mode for backend with comprehensive type definitions
- ESLint and Prettier configuration with pre-commit hooks
- Comprehensive error handling with proper HTTP status codes and user messages
- API documentation using OpenAPI/Swagger with example requests/responses
- Detailed code comments for complex business logic and integration points
- Git commit message standards following conventional commits specification

### Performance Considerations:
- Image lazy loading with intersection observer for optimal loading
- API response caching with appropriate TTL values and cache invalidation
- Database query optimization with proper indexing and efficient queries
- Frontend bundle optimization with code splitting and tree shaking
- Service worker caching strategies with cache-first for assets, network-first for API

### Security Checklist:
- Comprehensive input validation and sanitization on all endpoints
- XSS protection with Content Security Policy and output encoding
- CSRF protection with tokens for state-changing operations
- Secure token storage using IndexedDB with encryption
- API rate limiting with IP-based and user-based limits
- Audit logging for all sensitive operations and authentication events
- Regular security dependency updates and vulnerability scanning

This enhanced task breakdown provides comprehensive context for each development task, enabling AI assistants to understand the full requirements and deliver more accurate implementations aligned with the Pandora Box vision and architecture.