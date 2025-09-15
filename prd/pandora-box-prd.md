<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# okay providing the prd content, update with the above request and provide a exportable file in .md format \# Product Requirements Document (PRD) for Pandora  Progressive Web Application

## Overview

**Pandora ** is a mobile-first, self-hosted Progressive Web Application (PWA) designed to unify media discovery, download management, file operations, container control, and media server updates on a Raspberry Pi or similar home server setup. It consolidates the management of multiple Dockerized services into a single responsive, installable, Netflix-inspired dark-themed interface.

The application serves as the single point of contact for interacting with media APIs, torrent download pipelines, Samba file shares, Docker container status, and Jellyfin media library updates — all while preserving privacy, extensibility, and ease of use.

---

## Vision and Goals

- **Unified Interface**: Replace multiple vendor dashboards with one cohesive PWA.
- **Seamless Media Discovery \& Download**: Integrate TMDB and Watchmode metadata with torrent automation.
- **Full Docker Ecosystem Management**: Utilize Portainer for container orchestration and monitoring.
- **Robust File Management**: Enable Samba share browsing and file operations through Cloud Commander.
- **Real-Time Download Control**: Manage torrents via qBittorrent API with live status updates.
- **Automated Library Refresh**: Trigger Jellyfin updates after downloads or file moves.
- **Secure, CORS-Free Architecture**: Route all API calls through a backend proxy to avoid CORS issues and secure API keys.
- **Mobile-First Experience**: Installable PWA designed for touch and small screens.
- **Customizable Themability**: Netflix-inspired dark mode with CSS variables for easy theming.

---

## Architecture

### Core Tech Stack

| Layer | Technology |
| :-- | :-- |
| Frontend | Vanilla JavaScript (ES Modules), HTML, CSS (CSS Variables) |
| Backend | Node.js with TypeScript, Express.js |
| Database | **LokiJS** (JavaScript-based embedded NoSQL DB) |
| Hosting | Docker Container |
| APIs Used | TMDB, Watchmode, Jackett, qBittorrent, Cloud Commander, Portainer, Jellyfin |

**Note:** LokiJS is used as the server-side database for storing user data, configuration, authentication credentials, API tokens, session information, activity logs, and persistent application state.

---

### Key Containers and Roles

| Service | Docker Image | Primary Role | Notes |
| :-- | :-- | :-- | :-- |
| Pandora  App | `pandorabox/pwa:latest` | Main backend + frontend PWA | Backend handles all API proxying and persists data in LokiJS DB |
| Cloud Commander | `coderaiser/cloudcmd:latest` | Samba file management REST and UI | Mount Samba shares for file browsing/manipulation |
| Portainer | `portainer/portainer-ce:latest` | Docker container and stack monitoring/control | Proxy Docker controls, logs, restarts |
| Jackett | `linuxserver/jackett:latest` | Torrent index aggregator | Provides torrent magnet search results |
| qBittorrent | `linuxserver/qbittorrent:latest` | Torrent download manager and WebSocket updates | Controls downloads, status pushed to PWA |


---

## Functional Requirements

### Authentication \& Session Management

- Default user: `admin`
- Login with username and password
- "Remember Me" feature using JWT tokens (expiry 90 days)
- Tokens stored securely in IndexedDB on frontend
- Backend validates tokens and manages user/session data via LokiJS
- Supports RBAC (roles: admin, team)


### Dashboard (Media Discovery)

- Display trending, popular, and other categories from TMDB \& Watchmode (via backend proxy)
- Cards show title, poster, year, cast, streaming availability, ratings
- Category click leads to dedicated movies or TV shows list pages
- Download button opens torrent search modal powered by Jackett proxy
- Adding torrent triggers qBittorrent download via backend


### Downloads View

- Real-time list of current, completed, failed torrents via WebSocket from qBittorrent
- Show progress, speed, ETA, trackers, actions (pause/resume/remove)
- Auto-move completed files to "Downloaded" Samba folder
- Trigger Jellyfin library refresh via backend API
- Download history and actions persisted via LokiJS


### Ness (Samba File Manager)

- Browse Samba share via Cloud Commander REST API proxy
- Display folder hierarchy, breadcrumb navigation
- Download folder highlighted
- File actions:
  - Move files to Movies or TV Shows folders (Samba)
  - Trigger Jellyfin update on move
- File actions and history maintained in LokiJS


### Docker \& Stack Management

- Display container and stack status from Portainer API proxy
- Separate Containers and Stacks views
- Controls for restart, view logs, change gluetun country code (ARR stack)
- Colour-coded health indicators (green, amber, red)
- Container and stack info cached/stored in LokiJS for fast access


### Jellyfin Server Control

- Buttons to trigger library scans for Movies, TV Shows, Collections
- Show scan status, last update timestamp
- Library status and update logs persisted in LokiJS


### Settings

- User profile management (password update)
- API tokens management (TMDB, Watchmode, Jackett, qBittorrent, Cloud Commander, Portainer, Jellyfin) — all values securely stored in LokiJS
- Team management (add/remove team members) using LokiJS for member data
- Theme customization using CSS variables (default Netflix dark, scalable)

---

## API Proxying

**All client API calls route exclusively through Pandora  backend.** The backend proxies calls to all third-party APIs to:

- Prevent any client-side CORS issues
- Centralize API key and token management
- Enable unified error/logging policies
- Enforce authentication and authorization throughout API usage
- **Persist all necessary application data in LokiJS on the backend**

---

## Backend API Highlights

- `/api/v1/search/tmdb` - TMDB metadata proxy, logs/cache in LokiJS
- `/api/v1/search/watchmode` - Watchmode metadata proxy, logs/cache in LokiJS
- `/api/v1/torrents/search` - Jackett torrent search proxy, results/history in LokiJS
- `/api/v1/torrents/download` - qBittorrent download trigger, actions/status persisted in LokiJS
- `/api/v1/files/list` - Cloud Commander file listing proxy, access logs in LokiJS
- `/api/v1/files/move` - Cloud Commander file move proxy, logs/actions in LokiJS
- `/api/v1/containers/list` - Portainer Docker info proxy, list/status cached in LokiJS
- `/api/v1/containers/restart` - Portainer container restart proxy, logs/status updates in LokiJS
- `/api/v1/library/update` - Jellyfin library trigger proxy, logs in LokiJS

---

## Security Considerations

- API keys and sensitive information stored only in backend environment variables and LokiJS (encrypted at rest)
- JWT tokens secure sessions and authorize all API calls
- Backend enforces all RBAC and token validation
- HTTPS enforced via reverse proxy (e.g., Caddy, Nginx) in production
- Backend implements rate limiting and logging on all proxied API calls and database operations
- LokiJS is file-based, so data is local, fast, and private

---

## User Experience \& Theming

- Installable PWA optimized for mobile devices with touch-friendly UI
- Responsive layout with Netflix dark theme palette by default
- CSS variables namespace `--pb-` for colors, backgrounds, accent hues
- Dynamic theming supports real-time switching without reload
- Accessible color contrast and typography adhering to WCAG guidelines

---

## Future Enhancements (Roadmap)

- Subtitle downloads integration (e.g., Bazarr)
- Real-time media transcoding monitoring
- Offline caching of poster assets
- Support for multi-Jackett federation search
- AI-driven local content recommendations
- Remote access via VPN (WireGuard integration)

---

## Summary

Pandora  offers a single, secure, mobile-first portal to manage self-hosted movie and TV media ecosystems. It unifies discovery, downloading, file management, Docker oversight, and media server updates behind a resilient backend proxy architecture written in TypeScript, **using LokiJS as the embedded, fast, local NoSQL database for all persistent and operational data**, enabling ease of use and extensibility while maintaining total control and privacy.

---

Here is the updated PRD with the requested changes: backend technology is now **NestJS (TypeScript)**, and all mentions/references to **Netflix** are replaced by **Modern Dark** (contemporary dark-themed UI). The content is presented in Markdown format, fully ready for export as a `.md` file.

***

# Product Requirements Document (PRD) for Pandora Progressive Web Application

## Overview

**Pandora** is a mobile-first, self-hosted Progressive Web Application (PWA) designed to unify media discovery, download management, file operations, container control, and media server updates on a Raspberry Pi or similar home server setup. It consolidates the management of multiple Dockerized services into a single responsive, installable, modern dark-themed interface.

The application serves as the single point of contact for interacting with media APIs, torrent download pipelines, Samba file shares, Docker container status, and Jellyfin media library updates — all while preserving privacy, extensibility, and ease of use.

***

## Vision and Goals

- **Unified Interface**: Replace multiple vendor dashboards with one cohesive PWA.
- **Seamless Media Discovery \& Download**: Integrate TMDB and Watchmode metadata with torrent automation.
- **Full Docker Ecosystem Management**: Utilize Portainer for container orchestration and monitoring.
- **Robust File Management**: Enable Samba share browsing and file operations through Cloud Commander.
- **Real-Time Download Control**: Manage torrents via qBittorrent API with live status updates.
- **Automated Library Refresh**: Trigger Jellyfin updates after downloads or file moves.
- **Secure, CORS-Free Architecture**: Route all API calls through a backend proxy to avoid CORS issues and secure API keys.
- **Mobile-First Experience**: Installable PWA designed for touch and small screens.
- **Customizable Themability**: Modern dark mode with CSS variables for easy theming.

***

## Architecture

### Core Tech Stack

| Layer | Technology |
| :-- | :-- |
| Frontend | Vanilla JavaScript (ES Modules), HTML, CSS (CSS Variables) |
| Backend | **NestJS (TypeScript)** |
| Database | **LokiJS** (JavaScript-based embedded NoSQL DB) |
| Hosting | Docker Container |
| APIs Used | TMDB, Watchmode, Jackett, qBittorrent, Cloud Commander, Portainer, Jellyfin |

**Note:** LokiJS is used as the server-side database for storing user data, configuration, authentication credentials, API tokens, session information, activity logs, and persistent application state.

***

### Key Containers and Roles

| Service | Docker Image | Primary Role | Notes |
| :-- | :-- | :-- | :-- |
| Pandora  App | `pandorabox/pwa:latest` | Main backend + frontend PWA | Backend handles all API proxying and persists data in LokiJS DB |
| Cloud Commander | `coderaiser/cloudcmd:latest` | Samba file management REST and UI | Mount Samba shares for file browsing/manipulation |
| Portainer | `portainer/portainer-ce:latest` | Docker container and stack monitoring/control | Proxy Docker controls, logs, restarts |
| Jackett | `linuxserver/jackett:latest` | Torrent index aggregator | Provides torrent magnet search results |
| qBittorrent | `linuxserver/qbittorrent:latest` | Torrent download manager and WebSocket updates | Controls downloads, status pushed to PWA |


***

## Functional Requirements

### Authentication \& Session Management

- Default user: `admin`
- Login with username and password
- "Remember Me" feature using JWT tokens (expiry 90 days)
- Tokens stored securely in IndexedDB on frontend
- Backend validates tokens and manages user/session data via LokiJS
- Supports RBAC (roles: admin, team)


### Dashboard (Media Discovery)

- Display trending, popular, and other categories from TMDB \& Watchmode (via backend proxy)
- Cards show title, poster, year, cast, streaming availability, ratings
- Category click leads to dedicated movies or TV shows list pages
- Download button opens torrent search modal powered by Jackett proxy
- Adding torrent triggers qBittorrent download via backend


### Downloads View

- Real-time list of current, completed, failed torrents via WebSocket from qBittorrent
- Show progress, speed, ETA, trackers, actions (pause/resume/remove)
- Auto-move completed files to "Downloaded" Samba folder
- Trigger Jellyfin library refresh via backend API
- Download history and actions persisted via LokiJS


### Ness (Samba File Manager)

- Browse Samba share via Cloud Commander REST API proxy
- Display folder hierarchy, breadcrumb navigation
- Download folder highlighted
- File actions:
    - Move files to Movies or TV Shows folders (Samba)
    - Trigger Jellyfin update on move
- File actions and history maintained in LokiJS


### Docker \& Stack Management

- Display container and stack status from Portainer API proxy
- Separate Containers and Stacks views
- Controls for restart, view logs, change gluetun country code (ARR stack)
- Colour-coded health indicators (green, amber, red)
- Container and stack info cached/stored in LokiJS for fast access


### Jellyfin Server Control

- Buttons to trigger library scans for Movies, TV Shows, Collections
- Show scan status, last update timestamp
- Library status and update logs persisted in LokiJS


### Settings

- User profile management (password update)
- API tokens management (TMDB, Watchmode, Jackett, qBittorrent, Cloud Commander, Portainer, Jellyfin) — all values securely stored in LokiJS
- Team management (add/remove team members) using LokiJS for member data
- Theme customization using CSS variables (default modern dark, scalable)

***

## API Proxying

**All client API calls route exclusively through Pandora backend.** The backend proxies calls to all third-party APIs to:

- Prevent any client-side CORS issues
- Centralize API key and token management
- Enable unified error/logging policies
- Enforce authentication and authorization throughout API usage
- **Persist all necessary application data in LokiJS on the backend**

***

## Backend API Highlights

- `/api/v1/search/tmdb` - TMDB metadata proxy, logs/cache in LokiJS
- `/api/v1/search/watchmode` - Watchmode metadata proxy, logs/cache in LokiJS
- `/api/v1/torrents/search` - Jackett torrent search proxy, results/history in LokiJS
- `/api/v1/torrents/download` - qBittorrent download trigger, actions/status persisted in LokiJS
- `/api/v1/files/list` - Cloud Commander file listing proxy, access logs in LokiJS
- `/api/v1/files/move` - Cloud Commander file move proxy, logs/actions in LokiJS
- `/api/v1/containers/list` - Portainer Docker info proxy, list/status cached in LokiJS
- `/api/v1/containers/restart` - Portainer container restart proxy, logs/status updates in LokiJS
- `/api/v1/library/update` - Jellyfin library trigger proxy, logs in LokiJS

***

## Security Considerations

- API keys and sensitive information stored only in backend environment variables and LokiJS (encrypted at rest)
- JWT tokens secure sessions and authorize all API calls
- Backend enforces all RBAC and token validation
- HTTPS enforced via reverse proxy (e.g., Caddy, Nginx) in production
- Backend implements rate limiting and logging on all proxied API calls and database operations
- LokiJS is file-based, so data is local, fast, and private

***

## User Experience \& Theming

- Installable PWA optimized for mobile devices with touch-friendly UI
- Responsive layout with modern dark theme palette by default
- CSS variables namespace `--pb-` for colors, backgrounds, accent hues
- Dynamic theming supports real-time switching without reload
- Accessible color contrast and typography adhering to WCAG guidelines

***

## Future Enhancements (Roadmap)

- Subtitle downloads integration (e.g., Bazarr)
- Real-time media transcoding monitoring
- Offline caching of poster assets
- Support for multi-Jackett federation search
- AI-driven local content recommendations
- Remote access via VPN (WireGuard integration)

***

## Summary

Pandora offers a single, secure, mobile-first portal to manage self-hosted movie and TV media ecosystems. It unifies discovery, downloading, file management, Docker oversight, and media server updates behind a resilient backend proxy architecture written in TypeScript with **NestJS**, using **LokiJS** as the embedded, fast, local NoSQL database for all persistent and operational data, enabling ease of use and extensibility while maintaining total control and privacy.

***

**Download/export:**
Copy the above content into a `.md` file, such as `pandora-box-prd-updated.md` for direct use in documentation or project repositories.

If a downloadable file is needed, let me know the filename and storage preferences.

