# Detailed Requirement Document for Pandora Box Progressive Web Application

## 1. Introduction

Pandora Box is a self-hosted, mobile-centric PWA for comprehensive media, file, and Docker management, centering around a Raspberry Pi or other home server. It integrates third-party movie/tv metadata, torrent aggregation and automation, Samba file manipulation, Docker orchestration, and media server update flows into a unified, secure, session-driven interface. All API calls are routed through a robust backend (Node.js with TypeScript & LokiJS), ensuring no client-side CORS issues and strict control of tokens and keys.

---

## 2. Functional Requirements

### 2.1 Authentication & User Management

- Default "admin" user with configurable password.
- Login screen with Remember Me (JWT token, 90 days expiry).
- Password management UI (reset, change).
- Support for team user management: add/remove users (role-based access, all user/account data stored in LokiJS).
- Session tokens are validated on backend; tokens stored in secure browser storage on frontend (IndexedDB).
- Logout and session expiry mechanisms.

---

### 2.2 Dashboard: Movies/TV Discovery

- Show trending, popular, top-rated, upcoming categories.
- Data fetched from TMDB and Watchmode (backend proxy; frontend never calls public APIs directly).
- Category navigation (horizontal carousel, vertical lists).
- Posters, titles, year, cast, streaming availability, ratings, and detailed metadata.
- Search bar for direct queries (e.g., by title, actor, genre, year).
- Option to select a show/movie and view detailed metadata.

---

### 2.3 Torrent Download Workflow

- Search for torrents using Jackett (via backend).
- Download links (magnet URIs); display seeders, leechers, file size, tracker info.
- "Add to Download" option for each magnet/torrent.
- All downloads initiated via backend proxy to qBittorrent.
- Real-time status of downloads via WebSocket (backend-powered).
- Toast/notification system for download events.

---

### 2.4 Download Management

- List ongoing, completed, failed downloads; sortable by date, progress, state.
- Progress bars, ETA, download speed, file path, tracker details.
- Actions: Pause/resume/remove torrent.
- Auto-move completed downloads to Samba share "Download" folder.
- Auto-trigger Jellyfin server refresh after successful move.

---

### 2.5 Ness File Manager (Samba Integration)

- Browse Samba share using Cloud Commander API (via backend proxy).
- Hierarchical and breadcrumb navigation.
- File/folder operations (move, delete, rename, copy).
- Dedicated actions to move files to "Movies" or "TV Shows" folders.
- Path sanitation and conflict prevention in backend logic.
- File operation logs and history stored in LokiJS.

---

### 2.6 Docker/Stack Management

- List all Docker containers and stacks (data from Portainer, proxied backend).
- Distinguish stacks (e.g., ARR) and individual containers.
- Show detailed metadata: image, ID, status, uptime, restart policy, resource usage.
- Restart, shutdown, and log access controls for containers/stacks.
- ARR stack: change gluetun country and auto-restart stack.
- Health state color coding (green, amber, red).

---

### 2.7 Jellyfin Media Server Control

- Trigger library scans for movies, TV shows, and collections (via backend).
- View scan status, last refresh time, scan history.
- UI biomarker for library update status, scan progress.

---

### 2.8 Settings & Integrations

- User Profile panel: change password, email (if implemented).
- API Tokens panel: manage TMDB, Watchmode, Jackett, qBittorrent, Cloud Commander, Portainer, Jellyfin keys and credentials.
- All sensitive keys/tokens/encrypted data stored only in LokiJS (server-side).
- Team management panel: add/remove team members, assign roles.
- Connectivity indicators for each integration.
- Theme customization UI: live switch via CSS variables, Netflix dark theme by default.

---

## 3. Non-Functional Requirements

### 3.1 Performance & Scalability

- Backend proxy minimizes latency; caches non-personal metadata when possible.
- LokiJS database file is optimized for fast reads/writes and concurrency.
- Service worker enables fast reloads and offline caching of static assets.

### 3.2 Security

- All API keys, tokens, and private data reside in backend environment or encrypted LokiJS collections.
- End-to-end HTTPS (enforced by reverse proxy).
- JWT tokens validated and rotated securely.
- RBAC enforced at all backend endpoints.
- CSRF and input sanitation on all file and admin actions.

### 3.3 Reliability & Monitoring

- Status indicators for all dependent services (Portainer, Jackett, qBittorrent, Cloud Commander, Jellyfin).
- Backend logs all API calls, errors, and critical user actions in LokiJS.
- Service connectivity checks (scheduled).

### 3.4 Accessibility & UX

- Mobile-first/responsive design; installable as a PWA.
- Netflix dark mode as default; theme switcher with accessible contrast checks.
- All UI/UX flows tested for touch and keyboard accessibility.
- Dynamic theming powered by CSS variables (`--pb-` namespace).

### 3.5 Data Management

- LokiJS collections for users/account, tokens, settings, download history, media logs, file operations, and UI preferences.
- Daily/weekly backup integration (instruction provided for users to set up crontab or plugin).
- Documentation for data migration/export.

---

## 4. API and Integration Requirements

- **Backend REST API** using Express.js (TypeScript); exposes endpoints for all functional modules.
- All API calls from frontend PWA routed ONLY through backend.
- Backend handles:
  - TMDB, Watchmode (media discovery/metadata)
  - Jackett (torrent index)
  - qBittorrent (download initiation/control/status)
  - Cloud Commander (file ops/browse)
  - Portainer (container/stack controls)
  - Jellyfin (library refresh/status)
- Unified backend error/logging schema.
- Configuration driven through .env and settings panel.

---

## 5. Deployment & Ops

- Docker Compose-based deployment with named volumes for Pandora Box, Cloud Commander, Portainer, Jackett, qBittorrent.
- LokiJS database volume persisted for user, config, and history.
- Environmental variable and secrets encapsulated, not exposed to containers except backend.
- Sample deployment, backup, and recovery instructions documented.

---

## 6. Roadmap & Extensibility

- Future plans: Bazarr subtitles, multi-Jackett federation, AI recommendations, WireGuard remote access, user notification improvements.
- Backend and frontend code extensible via plugins (for new metadata/torrent sources, file operations, container APIs).

---

## 7. Documentation & Support

- In-app help screens for each module.
- Setup and troubleshooting documentation included.
- Community forum and issue tracker recommended.

---

## 8. Acceptance Criteria

- All functional modules described above tested for single and concurrent user flows.
- All API proxies work without CORS/client API keys.
- Sensitive data stored only in backend LokiJS.
- PWA installable, accessible, and responsive.
- Integration tests run for major Docker containers and API flows.
- Backups and recovery instructions validated.

---

## 9. Glossary

- **PWA**: Progressive Web Application
- **LokiJS**: In-memory/embedded JavaScript NoSQL DB (file-based on disk)
- **TMDB/Watchmode/Jackett/qBittorrent/Cloud Commander/Portainer/Jellyfin**: External/local services managed by Pandora Box
- **ARR Stack**: A set of containers for media automation often including Jackett, qBittorrent, etc.

---

*End of Document*
