# Requirements Document

## Introduction

Pandora is a mobile-first, self-hosted Progressive Web Application (PWA) that unifies media discovery, download management, file operations, container control, and media server updates on a Raspberry Pi or similar home server setup. The application consolidates the management of multiple Dockerized services into a single responsive, installable, Netflix-inspired dark-themed interface while preserving privacy, extensibility, and ease of use.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to authenticate securely with the application, so that I can access and manage my media server infrastructure with proper access controls.

#### Acceptance Criteria

1. WHEN a user accesses the application THEN the system SHALL present a login screen with username and password fields
2. WHEN a user enters valid credentials THEN the system SHALL authenticate using JWT tokens with 90-day expiry
3. WHEN a user selects "Remember Me" THEN the system SHALL store the JWT token securely in IndexedDB
4. WHEN a user's session expires THEN the system SHALL redirect to the login screen and clear stored tokens
5. WHEN an admin manages users THEN the system SHALL support RBAC with admin and team roles stored in LokiJS

### Requirement 2

**User Story:** As a media enthusiast, I want to discover trending and popular movies/TV shows, so that I can find new content to download and watch.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard THEN the system SHALL display trending, popular, and categorized content from TMDB and Watchmode via backend proxy
2. WHEN content is displayed THEN the system SHALL show title, poster, year, cast, streaming availability, and ratings
3. WHEN a user clicks on a category THEN the system SHALL navigate to dedicated movies or TV shows list pages
4. WHEN a user searches for content THEN the system SHALL provide real-time search results via backend API proxy
5. WHEN content metadata is requested THEN the system SHALL never make direct client-side API calls to third-party services

### Requirement 3

**User Story:** As a user, I want to search for and download torrents for my selected media, so that I can obtain content through automated torrent management.

#### Acceptance Criteria

1. WHEN a user clicks download on media content THEN the system SHALL open a torrent search modal powered by Jackett proxy
2. WHEN torrent results are displayed THEN the system SHALL show seeders, leechers, file size, and tracker information
3. WHEN a user selects a torrent THEN the system SHALL add it to qBittorrent via backend API proxy
4. WHEN a download is initiated THEN the system SHALL provide real-time status updates via WebSocket connection
5. WHEN torrent operations occur THEN the system SHALL log all actions and status in LokiJS database

### Requirement 4

**User Story:** As a user, I want to monitor and control my active downloads, so that I can manage my torrent queue and track download progress.

#### Acceptance Criteria

1. WHEN a user accesses the downloads view THEN the system SHALL display current, completed, and failed torrents with real-time updates
2. WHEN download information is shown THEN the system SHALL display progress, speed, ETA, trackers, and available actions
3. WHEN a user performs download actions THEN the system SHALL support pause, resume, and remove operations via qBittorrent API
4. WHEN a download completes THEN the system SHALL auto-move files to the "Downloaded" Samba folder
5. WHEN files are moved THEN the system SHALL trigger Jellyfin library refresh automatically

### Requirement 5

**User Story:** As a user, I want to browse and manage files on my Samba shares, so that I can organize my media files into appropriate directories.

#### Acceptance Criteria

1. WHEN a user accesses the file manager THEN the system SHALL browse Samba shares via Cloud Commander REST API proxy
2. WHEN browsing files THEN the system SHALL display folder hierarchy with breadcrumb navigation
3. WHEN file operations are needed THEN the system SHALL support move, delete, rename, and copy actions
4. WHEN organizing media THEN the system SHALL provide dedicated actions to move files to Movies or TV Shows folders
5. WHEN file operations occur THEN the system SHALL maintain action logs and history in LokiJS

### Requirement 6

**User Story:** As a system administrator, I want to monitor and control Docker containers and stacks, so that I can maintain my media server infrastructure.

#### Acceptance Criteria

1. WHEN a user accesses container management THEN the system SHALL display container and stack status from Portainer API proxy
2. WHEN container information is shown THEN the system SHALL provide separate views for Containers and Stacks
3. WHEN container controls are needed THEN the system SHALL support restart, view logs, and configuration changes
4. WHEN displaying container status THEN the system SHALL use color-coded health indicators (green, amber, red)
5. WHEN container operations occur THEN the system SHALL cache container info in LokiJS for fast access

### Requirement 7

**User Story:** As a user, I want to control Jellyfin library updates, so that I can ensure my media server reflects the latest content changes.

#### Acceptance Criteria

1. WHEN a user accesses Jellyfin controls THEN the system SHALL provide buttons to trigger library scans for Movies, TV Shows, and Collections
2. WHEN library scans are initiated THEN the system SHALL show scan status and last update timestamp
3. WHEN scan operations occur THEN the system SHALL persist library status and update logs in LokiJS
4. WHEN files are moved or downloads complete THEN the system SHALL automatically trigger appropriate library refreshes
5. WHEN scan progress is available THEN the system SHALL display real-time scan progress indicators

### Requirement 8

**User Story:** As an administrator, I want to manage application settings and API integrations, so that I can configure and maintain the system properly.

#### Acceptance Criteria

1. WHEN a user accesses settings THEN the system SHALL provide user profile management including password updates
2. WHEN API integration is configured THEN the system SHALL manage tokens for TMDB, Watchmode, Jackett, qBittorrent, Cloud Commander, Portainer, and Jellyfin
3. WHEN sensitive data is stored THEN the system SHALL securely store all API keys and tokens in LokiJS with encryption
4. WHEN team management is needed THEN the system SHALL support adding and removing team members with role assignments
5. WHEN theme customization is desired THEN the system SHALL support real-time theme switching using CSS variables with Netflix dark theme as default

### Requirement 9

**User Story:** As a mobile user, I want to install and use the application as a PWA, so that I can have a native app-like experience on my mobile device.

#### Acceptance Criteria

1. WHEN a user accesses the application on mobile THEN the system SHALL provide an installable PWA with mobile-first responsive design
2. WHEN the PWA is installed THEN the system SHALL function offline for cached content and provide service worker capabilities
3. WHEN using touch interfaces THEN the system SHALL provide touch-friendly UI elements optimized for small screens
4. WHEN accessibility is required THEN the system SHALL meet WCAG guidelines for color contrast and typography
5. WHEN themes are applied THEN the system SHALL use CSS variables with `--pb-` namespace for consistent theming

### Requirement 10

**User Story:** As a security-conscious user, I want all API communications to be secure and centralized, so that my API keys and sensitive data remain protected.

#### Acceptance Criteria

1. WHEN any API call is made THEN the system SHALL route all client requests exclusively through the backend proxy
2. WHEN API keys are managed THEN the system SHALL store all sensitive information only in backend environment variables and encrypted LokiJS
3. WHEN authentication is required THEN the system SHALL validate JWT tokens on the backend and enforce RBAC on all endpoints
4. WHEN data is transmitted THEN the system SHALL enforce HTTPS via reverse proxy in production environments
5. WHEN API operations occur THEN the system SHALL implement rate limiting and comprehensive logging for all proxied calls