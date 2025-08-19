# Pandora Box

A comprehensive media management system with PWA frontend and Node.js backend.

## Project Structure

- `pandora-box-frontend/` - Progressive Web App (PWA) frontend
- `pandora-box-backend/` - Node.js Express API backend
- `build.js` - Unified build script for both frontend and backend

## Features

- Media library management
- Download manager
- File manager
- Docker container management
- Jellyfin integration
- Offline capability with service workers
- IndexedDB for local storage

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Getting Started

### Building the Project

To build both frontend and backend without starting the services:

```bash
node build.js --build-only
```

### Running the Project

To build and start both frontend and backend services:

```bash
node build.js
```

This will:
1. Install dependencies for both projects
2. Build the frontend and backend
3. Start the frontend server on port 8080
4. Start the backend server on port 3000

### Accessing the Application

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Development

### Frontend Development

```bash
cd pandora-box-frontend
npm run dev
```

### Backend Development

```bash
cd pandora-box-backend
npm run dev
```

## Testing

### Frontend Tests

```bash
cd pandora-box-frontend
npm test
```

### Backend Tests

```bash
cd pandora-box-backend
npm test
```

## Building for Production

The unified build script creates optimized production builds for both frontend and backend.

```bash
node build.js --build-only
```

The compiled output will be available at:
- Frontend: `pandora-box-frontend/dist/`
- Backend: `pandora-box-backend/dist/`

## License

MIT