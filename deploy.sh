#!/bin/bash

# Pandora Box PWA Deployment Script
# This script helps deploy Pandora Box PWA in production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p media/movies
    mkdir -p media/tv
    mkdir -p downloads
    mkdir -p data
    mkdir -p logs
    
    print_success "Directories created"
}

# Function to setup environment file
setup_environment() {
    if [ ! -f .env ]; then
        print_status "Setting up environment file..."
        cp .env.example .env
        print_warning "Please edit .env file and configure your settings before running the application"
        print_warning "Required: TMDB_API_KEY, JWT_SECRET, and service passwords"
    else
        print_success "Environment file already exists"
    fi
}

# Function to build and start services
deploy() {
    print_status "Building and starting Pandora Box PWA..."
    
    # Pull latest images
    docker-compose pull
    
    # Build the application
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    print_success "Pandora Box PWA deployed successfully!"
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
    
    echo ""
    print_status "Access URLs:"
    echo "  Pandora Box PWA: http://localhost:3001"
    echo "  Jackett:         http://localhost:9117"
    echo "  qBittorrent:     http://localhost:8080"
    echo "  Cloud Commander: http://localhost:8000"
    echo "  Portainer:       http://localhost:9000"
    echo "  Jellyfin:        http://localhost:8096"
    echo "  Traefik:         http://localhost:8081"
}

# Function to stop services
stop() {
    print_status "Stopping Pandora Box PWA services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to restart services
restart() {
    print_status "Restarting Pandora Box PWA services..."
    docker-compose restart
    print_success "Services restarted"
}

# Function to show logs
logs() {
    local service=${1:-pandora-box}
    print_status "Showing logs for $service..."
    docker-compose logs -f "$service"
}

# Function to update application
update() {
    print_status "Updating Pandora Box PWA..."
    
    # Pull latest changes
    if [ -d .git ]; then
        git pull
    fi
    
    # Rebuild and restart
    docker-compose build --no-cache pandora-box
    docker-compose up -d pandora-box
    
    print_success "Update completed"
}

# Function to backup data
backup() {
    local backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
    print_status "Creating backup in $backup_dir..."
    
    mkdir -p "$backup_dir"
    
    # Backup database and configuration
    docker-compose exec -T pandora-box tar -czf - /app/data | tar -xzf - -C "$backup_dir"
    
    # Backup environment file
    cp .env "$backup_dir/"
    
    print_success "Backup created in $backup_dir"
}

# Function to show help
show_help() {
    echo "Pandora Box PWA Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Build and deploy the application"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  status    - Show service status and URLs"
    echo "  logs      - Show logs (optionally specify service name)"
    echo "  update    - Update the application"
    echo "  backup    - Create a backup of application data"
    echo "  setup     - Run initial setup"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 logs pandora-box"
    echo "  $0 logs jackett"
}

# Function to run initial setup
initial_setup() {
    print_status "Running initial setup for Pandora Box PWA..."
    
    check_prerequisites
    create_directories
    setup_environment
    
    print_success "Initial setup completed"
    print_warning "Please configure your .env file before deploying"
}

# Main script logic
case "${1:-}" in
    deploy)
        check_prerequisites
        create_directories
        setup_environment
        deploy
        show_status
        ;;
    start)
        docker-compose up -d
        show_status
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        logs "${2:-pandora-box}"
        ;;
    update)
        update
        ;;
    backup)
        backup
        ;;
    setup)
        initial_setup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac