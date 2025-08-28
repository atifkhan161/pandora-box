# Pandora Box Frontend

A mobile-first Progressive Web Application built with Framework7 for unified media management.

## Features

- 📱 Mobile-first responsive design
- 🎨 Netflix-inspired dark theme
- 📦 PWA capabilities with offline support
- 🔐 JWT-based authentication
- 🎬 Media discovery and management
- 📥 Torrent download management
- 📁 File system operations
- 🐳 Docker container control
- 🎭 Jellyfin media server integration

## Tech Stack

- **Framework7** - Mobile-first UI framework
- **Vite** - Build tool and development server
- **Vanilla JavaScript** - ES Modules following Framework7 patterns
- **CSS Variables** - Theming system with `--pb-` namespace
- **PWA** - Service worker and offline capabilities

## Project Structure

```
src/
├── js/
│   ├── app.js              # Main Framework7 app initialization
│   ├── routes.js           # Framework7 routing configuration
│   ├── pages/              # Page controllers (JS only)
│   ├── components/         # Reusable component controllers
│   ├── services/           # API communication layer
│   ├── store/              # Application state management
│   └── utils/              # Utility functions
├── pages/                  # Framework7 page templates (HTML only)
├── components/             # Reusable component templates
└── css/
    ├── app.css             # Main application styles
    ├── pages/              # Page-specific styles
    ├── components/         # Component-specific styles
    └── themes/             # Theme variations
```

## Development

### Prerequisites

- Node.js 18+
- npm 8+

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Development Server

The development server runs on `http://localhost:3000` with:
- Hot reload for all file changes
- API proxy to backend server (`http://localhost:3001`)
- WebSocket proxy for real-time updates

## Framework7 Implementation

This project follows Framework7 documentation patterns:

- **Separation of Concerns**: Each page/component has separate HTML, JS, and CSS files
- **No Inline Templates**: HTML templates are in separate files, loaded via `componentUrl`
- **Framework7 Routing**: Uses Framework7's built-in routing system
- **Component Lifecycle**: Implements proper Framework7 page lifecycle methods

### Page Structure Example

```
pages/dashboard/
├── dashboard.html    # Template only (no JavaScript)
├── dashboard.js      # Logic only (no HTML strings)
└── dashboard.css     # Styles only
```

## PWA Features

- **Installable**: Can be installed as a native app
- **Offline Support**: Service worker caches critical resources
- **Push Notifications**: Real-time updates via WebSocket
- **Responsive**: Mobile-first design that works on all devices

## Theming

The app uses a Netflix-inspired dark theme with CSS variables:

```css
:root {
  --pb-primary: #e50914;        /* Pandora red */
  --pb-background: #000000;     /* Black background */
  --pb-surface: #141414;        /* Dark surface */
  --pb-text-primary: #ffffff;   /* White text */
  /* ... more variables */
}
```

## API Integration

All API calls are routed through the backend proxy:

- **Base URL**: `/api/v1`
- **Authentication**: JWT tokens with automatic refresh
- **WebSocket**: Real-time updates at `/ws`
- **Error Handling**: Centralized error management

## Contributing

1. Follow Framework7 documentation patterns
2. Maintain separation of HTML, JS, and CSS files
3. Use the established CSS variable naming (`--pb-` prefix)
4. Test on mobile devices and various screen sizes
5. Ensure accessibility compliance (WCAG guidelines)

## License

MIT License - see LICENSE file for details