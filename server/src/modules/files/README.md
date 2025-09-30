# Files Module

This module implements file management and filebrowser integration for the Pandora PWA backend.

## Overview

The Files module provides robust file browsing and operations using the filebrowser service. It integrates with the encrypted configuration system to retrieve folder paths and filebrowser credentials.

## Components

### FilesController
- `GET /api/v1/files/browse` - List files and folders in a specified directory
- `POST /api/v1/files/move-to-movies` - Move a file from downloads to movies folder
- `POST /api/v1/files/move-to-tvshows` - Move a file from downloads to TV shows folder

### FilesService
- Business logic for file operations
- Retrieves configured folder paths from settings
- Handles file movement between designated folders

### FilebrowserService
- Handles filebrowser API integration
- Manages authentication with filebrowser
- Provides file listing and movement operations

## Configuration Requirements

### File Paths
Configure the following paths in the settings:
- `downloads` - Downloads folder path
- `movies` - Movies folder path  
- `tvShows` - TV shows folder path

### Filebrowser Credentials
Configure the following API keys in the settings:
- `filebrowser_url` - Filebrowser service URL
- `filebrowser_username` - Filebrowser username
- `filebrowser_password` - Filebrowser password

## Usage Example

```typescript
// Browse files in downloads folder
GET /api/v1/files/browse

// Browse files in specific path
GET /api/v1/files/browse?path=/media/downloads

// Move file to movies folder
POST /api/v1/files/move-to-movies
{
  "filename": "movie.mkv"
}

// Move file to TV shows folder
POST /api/v1/files/move-to-tvshows
{
  "filename": "episode.mkv"
}
```

## Error Handling

The module provides comprehensive error handling for:
- Missing configuration
- Authentication failures
- File operation errors
- Network connectivity issues

All errors are returned with appropriate HTTP status codes and descriptive messages.