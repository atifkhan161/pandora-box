# File Management Component

This component provides a user interface for browsing and managing files in the downloads folder.

## Features

- **File Browsing**: Displays files from the configured downloads folder
- **Media File Filtering**: Only shows media files (mp4, mkv, avi, mov, wmv, flv, webm, m4v)
- **Move Operations**: Two action buttons for each file:
  - "Move to Movies" - Moves file to the movies folder
  - "Move to TV Shows" - Moves file to the TV shows folder
- **Visual Feedback**: Success/error notifications for move operations
- **Responsive Design**: Works on desktop and mobile devices

## Usage

1. Navigate to `/files.html` in the application
2. The component automatically loads files from the downloads folder
3. Click "Move to Movies" or "Move to TV Shows" to move files
4. Use the "Refresh" button to reload the file list

## API Integration

The component integrates with the backend file management endpoints:
- `GET /api/v1/files/browse` - Lists files in downloads folder
- `POST /api/v1/files/move-to-movies` - Moves file to movies folder
- `POST /api/v1/files/move-to-tvshows` - Moves file to TV shows folder

## File Structure

- `files.html` - Main HTML page
- `components/file-management.js` - Component logic
- `styles/files.css` - Component styles

## Dependencies

- Navigation component
- API service
- Auth service
- Theme CSS variables