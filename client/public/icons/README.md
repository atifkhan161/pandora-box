# PWA Icon Conversion Instructions

The SVG icons in this directory need to be converted to PNG format for proper PWA compliance.

## Required PNG Files

Convert the following SVG files to PNG:

### Primary Icons
- `icon-192x192.svg` → `icon-192x192.png`
- `icon-144x144.svg` → `icon-144x144.png`  
- `icon-512x512.svg` → `icon-512x512.png`
- `favicon.svg` → `favicon.png` (32x32)

## Conversion Methods

### Method 1: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# On Windows: choco install imagemagick
# On macOS: brew install imagemagick
# On Ubuntu: sudo apt-get install imagemagick

# Convert SVG to PNG
magick icon-192x192.svg icon-192x192.png
magick icon-144x144.svg icon-144x144.png
magick icon-512x512.svg icon-512x512.png
magick favicon.svg -resize 32x32 favicon.png
```

### Method 2: Using Online Converters
1. Visit https://convertio.co/svg-png/
2. Upload each SVG file
3. Convert and download the PNG versions
4. Ensure exact pixel dimensions match the filenames

### Method 3: Using Node.js (sharp library)
```bash
npm install sharp
```

```javascript
const sharp = require('sharp');

const icons = [
  { input: 'icon-192x192.svg', output: 'icon-192x192.png', size: 192 },
  { input: 'icon-144x144.svg', output: 'icon-144x144.png', size: 144 },
  { input: 'icon-512x512.svg', output: 'icon-512x512.png', size: 512 },
  { input: 'favicon.svg', output: 'favicon.png', size: 32 }
];

icons.forEach(icon => {
  sharp(icon.input)
    .resize(icon.size, icon.size)
    .png()
    .toFile(icon.output);
});
```

## Additional Recommended Sizes

For better PWA compliance, also create these sizes:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-152x152.png`
- `icon-384x384.png`

## Apple Touch Icon
Create `apple-touch-icon.png` (180x180) from the 192x192 version:
```bash
magick icon-192x192.png -resize 180x180 apple-touch-icon.png
```

## Favicon.ico
For legacy browser support, create a favicon.ico:
```bash
magick favicon.png favicon.ico
```

## After Conversion

1. Update `manifest.json` to reference the PNG files
2. Update `index.html` to include proper icon links
3. Delete the SVG files (optional, but recommended for production)
4. Test PWA installation and icon display

## Design Notes

The current icons feature:
- Netflix-inspired red gradient background (#e50914 to #b00610)
- White Pandora box with media play symbol
- "PB" or "PANDORA BOX" text
- PWA-optimized rounded corners and contrast

Feel free to customize the design while maintaining the same dimensions.