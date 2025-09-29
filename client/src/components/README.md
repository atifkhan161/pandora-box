# Media Discovery Frontend Components

This directory contains the frontend components for the Pandora Box media discovery functionality.

## Components

### DashboardComponent (`dashboard.js`)
- Displays latest movies and TV shows in a grid layout
- Fetches data from `/api/v1/media/latest-movies` and `/api/v1/media/latest-tvshows` endpoints
- Renders clickable media cards with poster images, titles, years, and ratings
- Redirects to media details page when cards are clicked

**Features:**
- Responsive grid layout
- Loading states
- Error handling
- Hover effects with overlay buttons

### MediaDetailsComponent (`media-details.js`)
- Shows comprehensive details for a specific movie or TV show
- Fetches data from `/api/v1/media/details/{mediaType}/{id}` endpoint
- Displays poster, backdrop, title, year, runtime, rating, genres, overview, cast, and streaming providers

**Features:**
- Dynamic URL parameter handling
- Backdrop image with gradient overlay
- Cast member grid with photos
- Streaming provider availability
- Responsive design for mobile devices

### SearchComponent (`search.js`)
- Provides search functionality for movies, TV shows, and people
- Uses `/api/v1/media/search` endpoint with query parameters
- Supports filtering by media type (All, Movies, TV Shows, People)
- Real-time search with debouncing

**Features:**
- Debounced search input (500ms delay)
- Radio button filters for media types
- Categorized results display
- Clickable results that navigate to details pages
- Loading and error states

## Pages

### Dashboard (`dashboard.html`, `dashboard.js`)
- Main dashboard page that uses DashboardComponent
- Includes navigation and authentication checks

### Media Details (`media-details.html`, `media-details.js`)
- Dedicated page for displaying media details
- URL format: `media-details.html?type={movie|tv}&id={tmdb_id}`
- Validates URL parameters and media type

### Search (`search.html`, `search.js`)
- Dedicated search page using SearchComponent
- Accessible from navigation menu

## Styling

### Media Styles (`../styles/media.css`)
- Comprehensive CSS for all media components
- Dark theme with Crunchyroll orange accent color
- Responsive design with mobile-first approach
- Hover effects and transitions
- Grid layouts for media cards and search results

**Key Features:**
- CSS Grid for responsive layouts
- Smooth transitions and hover effects
- Loading spinners and error states
- Mobile-responsive breakpoints
- Consistent spacing using CSS variables

## Assets

### Placeholder Images (`../assets/`)
- `placeholder-poster.svg` - Used when movie/TV show posters are unavailable
- `placeholder-person.svg` - Used when cast member photos are unavailable

## Navigation Integration

The components are integrated with the existing navigation system:
- Dashboard link navigates to dashboard with media grid
- Search link provides dedicated search functionality
- Media cards and search results navigate to media details pages

## API Integration

All components use the centralized API service (`../services/api.js`) for:
- Authentication token management
- Error handling
- Consistent request/response formatting

## Future Enhancements

- Person details pages for cast members
- Watchlist functionality
- Media recommendations
- Advanced filtering options
- Infinite scroll for large result sets