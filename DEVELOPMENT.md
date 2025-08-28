# Development Setup

This document explains how to set up and run Pandora Box in development mode.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

## Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start both the server (port 3001) and client (port 3000) concurrently.

## Development Architecture

### Server (Backend)
- **Port:** 3001
- **Technology:** Express.js + TypeScript
- **API Endpoint:** http://localhost:3001/api/v1
- **WebSocket:** ws://localhost:3001/ws
- **Hot Reload:** Yes (via tsx watch)

### Client (Frontend)
- **Port:** 3000
- **Technology:** Framework7 + Vite
- **URL:** http://localhost:3000
- **Hot Reload:** Yes (via Vite HMR)

### Proxy Configuration

The client development server (Vite) automatically proxies API requests to the backend:

- `http://localhost:3000/api/*` → `http://localhost:3001/api/*`
- `ws://localhost:3000/ws` → `ws://localhost:3001/ws`

This means you can make API calls from the frontend using relative URLs like `/api/v1/auth/login` and they will be automatically routed to the backend server.

## Available Scripts

### Root Level Scripts

- `npm run dev` - Start both server and client in development mode
- `npm run dev:server-only` - Start only the server
- `npm run dev:client-only` - Start only the client
- `npm run build` - Build both server and client for production
- `npm run start:prod` - Build and start in production mode
- `npm run test` - Run tests for both server and client
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint both server and client code
- `npm run lint:fix` - Lint and fix both server and client code
- `npm run clean` - Clean build artifacts
- `npm run install:all` - Install dependencies for root, server, and client

### Server Scripts (cd server && npm run ...)

- `npm run dev` - Start server in development mode with hot reload
- `npm run build` - Build server for production
- `npm run start` - Start server in production mode
- `npm run test` - Run server tests
- `npm run lint` - Lint server code

### Client Scripts (cd client && npm run ...)

- `npm run dev` - Start client development server
- `npm run build` - Build client for production
- `npm run preview` - Preview production build
- `npm run test` - Run client tests
- `npm run lint` - Lint client code

## Development Workflow

1. **Start Development:**
   ```bash
   npm run dev
   ```

2. **The development server will:**
   - Start the backend API server on port 3001
   - Wait for the backend to be ready (health check)
   - Start the frontend development server on port 3000
   - Set up automatic proxying from frontend to backend

3. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/v1
   - API Documentation: http://localhost:3001/api/v1/docs (if available)

4. **Development Features:**
   - **Hot Module Replacement (HMR):** Frontend changes reload instantly
   - **Auto Restart:** Backend restarts automatically on file changes
   - **API Proxying:** No CORS issues during development
   - **WebSocket Proxying:** Real-time features work seamlessly
   - **Source Maps:** Full debugging support

## Troubleshooting

### Port Conflicts
If ports 3000 or 3001 are in use:
- Vite will automatically try the next available port for the client
- For the server, update the port in `server/src/config/index.ts`

### Proxy Issues
If API calls aren't being proxied correctly:
1. Check the Vite proxy configuration in `client/vite.config.js`
2. Ensure the server is running on the expected port
3. Check browser network tab for request URLs

### WebSocket Connection Issues
If WebSocket connections fail:
1. Ensure the server WebSocket endpoint is running
2. Check the proxy configuration for `/ws` in `client/vite.config.js`
3. Verify the WebSocket URL in the client code

### Dependencies Issues
If you encounter dependency issues:
```bash
npm run clean
npm run install:all
```

## Environment Variables

### Server Environment Variables
Create a `.env` file in the `server` directory:
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret-here
DB_PATH=./data/pandora.db
LOG_LEVEL=debug
```

### Client Environment Variables
Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=/api/v1
VITE_WS_URL=/ws
VITE_APP_NAME=Pandora Box
```

## Production Build

To build for production:
```bash
npm run build
npm run start:prod
```

This will:
1. Build the server TypeScript code
2. Build the client for production (static files)
3. Start the server which serves both API and static files

## Docker Development

For Docker-based development:
```bash
npm run docker:dev
```

This uses `docker-compose.dev.yml` for development-specific Docker configuration.