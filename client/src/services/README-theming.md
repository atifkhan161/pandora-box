# Theming System

## Overview
The Pandora Box application includes a dynamic theming system that allows users to switch between different visual themes inspired by popular streaming platforms.

## Available Themes
- **Default Dark**: The original dark theme with orange accents
- **Netflix**: Red and black color scheme inspired by Netflix
- **Amazon Prime Video**: Dark blue and yellow color scheme inspired by Amazon Prime Video
- **Disney+**: Dark purple, white, and teal color scheme inspired by Disney+

## Implementation

### Theme Manager Service
The `theme.js` service handles:
- Theme switching and application
- Persistence in localStorage
- Theme initialization on page load

### CSS Variables
All themes use CSS custom properties (variables) defined in `theme.css`:
- Color schemes for each theme
- Smooth transitions between themes
- Consistent design tokens

### Settings Integration
Users can change themes through the Settings page:
- Dropdown selector for theme choice
- Immediate theme application
- Persistent storage across sessions

## Usage

### Applying Themes Programmatically
```javascript
import themeManager from './services/theme.js';

// Set a theme
themeManager.setTheme('netflix');

// Get current theme
const currentTheme = themeManager.getCurrentTheme();

// Get available themes
const themes = themeManager.getAvailableThemes();
```

### Adding New Themes
1. Add theme definition in `theme.css`:
```css
body.new-theme {
    --pb-primary: #color;
    --pb-background: #color;
    /* ... other variables */
}
```

2. Update theme manager themes object:
```javascript
this.themes = {
    'new-theme': 'new-theme'
};
```

3. Add option to settings dropdown in `settings.html`

## Storage
Theme preferences are stored in localStorage with the key `pandora-box-theme`.