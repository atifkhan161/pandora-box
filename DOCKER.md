# Pandora Box PWA - Docker Deployment Guide

This guide covers deploying Pandora Box PWA using Docker containers for a complete media management stack.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- At least 4GB RAM and 10GB storage

### 1. Clone and Setup
```bash
git clone <repository-url>
cd pandora-box-pwa
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with your settings:
```bash
# Required API Keys
TMDB_API_KEY=your-tmdb-api-key
WATCHMODE_API_KEY=your-watchmode-api-key

# Security
JWT_SECRET=your-secure-random-string

# Paths (adjust to your setup)
MEDIA_ROOT=/path/to/your/media
DOWNLOADS_ROOT=/path/to/your/downloads
```

### 3. Deploy
```bash
# Production deployment
docker-compose up -d

# Development deployment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 4. Initial Setup
1. **Jackett** (http://localhost:9117): Configure torrent indexers
2. **qBittorrent** (http://localhost:8080): Change default password (admin/adminadmin)
3. **Jellyfin** (http://localhost:8096): Setup media libraries
4. **Portainer** (http://localhost:9000): Create admin user
5. **Pandora Box** (http://localhost:3001): Configure API keys in settings

## 📋 Services Overview

| Service | Port | Purpose | Default Credentials |
|---------|------|---------|-------------------|
| Pandora Box PWA | 3001 | Main application | - |
| Jackett | 9117 | Torrent indexer proxy | - |
| qBittorrent | 8080 | Download client | admin/adminadmin |
| Cloud Commander | 8000 | File manager | - |
| Portainer | 9000 | Docker management | Setup on first visit |
| Jellyfin | 8096 | Media server | Setup on first visit |
| Traefik | 8081 | Reverse proxy dashboard | - |

## 🔧 Configuration

### Environment Variables

#### Security
```env
JWT_SECRET=your-super-secret-jwt-key
LOG_LEVEL=info
```

#### API Keys
```env
TMDB_API_KEY=your-tmdb-api-key
WATCHMODE_API_KEY=your-watchmode-api-key
JACKETT_API_KEY=configured-in-jackett
PORTAINER_API_KEY=configured-in-portainer
JELLYFIN_API_KEY=configured-in-jellyfin
```

#### Paths
```env
MEDIA_ROOT=/path/to/media
DOWNLOADS_ROOT=/path/to/downloads
MOVIES_PATH=/media/movies
TV_PATH=/media/tv
```

#### Service URLs (default Docker network)
```env
JACKETT_URL=http://jackett:9117
QBITTORRENT_URL=http://qbittorrent:8080
CLOUD_COMMANDER_URL=http://cloudcmd:8000
PORTAINER_URL=http://portainer:9000
JELLYFIN_URL=http://jellyfin:8096
```

### Volume Mounts

The compose file creates several volumes:
- `pandora-data`: Application database and settings
- `pandora-logs`: Application logs
- `[service]-config`: Individual service configurations
- Your media and downloads directories

## 🛠 Management Commands

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f pandora-box
docker-compose logs -f jackett

# Restart specific service
docker-compose restart pandora-box

# Update application
docker-compose pull
docker-compose up -d --force-recreate pandora-box

# View service status
docker-compose ps
```

### Using Deploy Script (Linux/Mac)
```bash
# Make executable
chmod +x deploy.sh

# Initial setup
./deploy.sh setup

# Deploy application
./deploy.sh deploy

# Show status
./deploy.sh status

# View logs
./deploy.sh logs
./deploy.sh logs jackett

# Update application
./deploy.sh update

# Backup data
./deploy.sh backup
```

## 🔒 Security Considerations

### Production Deployment
1. **Change default passwords** for all services
2. **Use strong JWT secret** (generate with `openssl rand -base64 32`)
3. **Configure reverse proxy** with SSL certificates
4. **Restrict network access** using Docker networks
5. **Enable VPN** routing for torrent traffic

### Reverse Proxy Setup
The stack includes Traefik for automatic SSL and subdomain routing:
```yaml
# In .env file
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com
```

Access services via:
- `https://pandora.yourdomain.com`
- `https://jackett.yourdomain.com`
- `https://jellyfin.yourdomain.com`

## 🌐 Network Configuration

### Internal Networks
- `pandora-network`: Main application network
- `media-network`: Media services network

### VPN Integration
Optional Gluetun container for VPN routing:
```env
VPN_PROVIDER=surfshark
VPN_TYPE=wireguard
WIREGUARD_PRIVATE_KEY=your-key
VPN_COUNTRIES=Netherlands
```

## 📁 Directory Structure

```
pandora-box-pwa/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development overrides
├── Dockerfile                  # Production image
├── Dockerfile.dev             # Development image
├── .env.example               # Environment template
├── .dockerignore              # Build exclusions
├── deploy.sh                  # Deployment script
├── client/                    # Frontend application
├── server/                    # Backend application
├── media/                     # Media files (created)
│   ├── movies/
│   └── tv/
└── downloads/                 # Download directory (created)
```

## 🐛 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Check if port is in use
netstat -tulpn | grep :3001

# Restart service
docker-compose restart [service-name]
```

#### Permission Issues
```bash
# Fix ownership (Linux/Mac)
sudo chown -R 1000:1000 media downloads

# Check volume mounts
docker-compose config
```

#### Network Issues
```bash
# Recreate networks
docker-compose down
docker network prune
docker-compose up -d
```

### Debug Mode
Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Health Checks
All services include health checks. View status:
```bash
docker-compose ps
```

## 🔄 Updates and Maintenance

### Updating Services
```bash
# Update all images
docker-compose pull

# Restart services
docker-compose up -d

# Clean up old images
docker image prune
```

### Backup Strategy
```bash
# Backup application data
docker-compose exec pandora-box tar -czf - /app/data | tar -xzf - -C backup/

# Backup service configurations
docker-compose exec jackett tar -czf - /config | tar -xzf - -C backup/jackett/
```

### Monitoring
Access logs via:
- Portainer: http://localhost:9000
- Direct logs: `docker-compose logs -f`
- Application logs: `./data/logs/`

## 🆘 Support

### Getting Help
1. Check service logs for errors
2. Verify environment configuration
3. Ensure all required API keys are configured
4. Check network connectivity between services

### Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [TMDB API Documentation](https://developers.themoviedb.org/)
- [Jackett Wiki](https://github.com/Jackett/Jackett/wiki)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.