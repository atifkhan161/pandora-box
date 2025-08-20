# Pandora Box Backend

A comprehensive backend API for managing media downloads, streaming, and system management.

## Features

- Authentication system with JWT
- Media search and management via TMDB API
- Torrent management via Jackett and qBittorrent
- File management via Cloud Commander
- Media streaming via Jellyfin
- Docker container management via Portainer
- Comprehensive logging and error handling
- Complete Docker setup for all services

## Prerequisites

- Node.js 16+ and npm
- Docker and Docker Compose (for containerized deployment)

## Installation

### Local Development

1. Clone the repository

```bash
git clone https://github.com/yourusername/pandora-box-backend.git
cd pandora-box-backend
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file based on `.env.example`

```bash
cp .env.example .env
```

4. Edit the `.env` file with your configuration

5. Build the application

```bash
npm run build
```

6. Start the application

```bash
npm start
```

### Docker Deployment

1. Clone the repository

```bash
git clone https://github.com/yourusername/pandora-box-backend.git
cd pandora-box-backend
```

2. Create a `.env` file based on `.env.example`

```bash
cp .env.example .env
```

3. Edit the `.env` file with your configuration

4. Start the Docker containers

```bash
docker-compose up -d
```

## API Documentation

The API is organized around RESTful principles. All endpoints return JSON responses.

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

- `POST /auth/login` - Login with username and password
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout (client-side token removal)
- `POST /auth/register` - Register new user (admin only)
- `POST /auth/change-password` - Change password

### Media

- `GET /media/search` - Search for movies and TV shows
- `GET /media/movies/:id` - Get movie details
- `GET /media/tv/:id` - Get TV show details
- `GET /media/tv/:id/season/:seasonNumber` - Get TV season details
- `GET /media/popular/movies` - Get popular movies
- `GET /media/popular/tv` - Get popular TV shows

### Downloads

- `GET /downloads/search` - Search for torrents
- `GET /downloads/indexers` - Get all indexers
- `GET /downloads/indexers/:id/test` - Test indexer
- `POST /downloads/add` - Add torrent from URL
- `GET /downloads/torrents` - Get all torrents
- `GET /downloads/torrents/:hash` - Get torrent details
- `POST /downloads/torrents/:hash/pause` - Pause torrent
- `POST /downloads/torrents/:hash/resume` - Resume torrent
- `DELETE /downloads/torrents/:hash` - Delete torrent
- `GET /downloads/transfer-info` - Get transfer info
- `GET /downloads/history` - Get download history

### Files

- `GET /files` - Get directory contents
- `POST /files/directory` - Create directory
- `DELETE /files/:path` - Remove file or directory
- `PUT /files/:oldPath` - Rename file or directory
- `POST /files/copy` - Copy file or directory
- `GET /files/content/:path` - Get file content
- `PUT /files/content/:path` - Update file content

### System

- `GET /system/settings` - Get system settings
- `PUT /system/settings` - Update system settings (admin only)
- `GET /system/containers` - Get Docker containers (admin only)
- `GET /system/containers/:id` - Get container details (admin only)
- `POST /system/containers/:id/start` - Start container (admin only)
- `POST /system/containers/:id/stop` - Stop container (admin only)
- `POST /system/containers/:id/restart` - Restart container (admin only)
- `GET /system/containers/:id/logs` - Get container logs (admin only)
- `GET /system/logs` - Get system activity logs (admin only)

### Library

- `GET /library/users` - Get Jellyfin users
- `GET /library/libraries` - Get media libraries
- `GET /library/libraries/:libraryId/items` - Get library items
- `GET /library/items/:itemId` - Get item details
- `GET /library/search` - Search items
- `GET /library/stream/:itemId` - Get stream URL
- `POST /library/libraries/:libraryId/refresh` - Refresh library
- `GET /library/recent` - Get recently added items

## License

MIT