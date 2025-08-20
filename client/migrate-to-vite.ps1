# Script to migrate from webpack to Vite structure

# Create necessary directories in src
Write-Host "Creating directory structure in src..." -ForegroundColor Green

$directories = @(
    "src\css",
    "src\js",
    "src\js\components",
    "src\js\utils",
    "src\assets",
    "src\assets\icons",
    "src\assets\images"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Copy CSS files
Write-Host "Copying CSS files..." -ForegroundColor Green
Copy-Item -Path "public\css\*.css" -Destination "src\css\" -Force

# Copy JS files
Write-Host "Copying JS files..." -ForegroundColor Green
Copy-Item -Path "public\js\app.js" -Destination "src\js\" -Force
Copy-Item -Path "public\js\auth.js" -Destination "src\js\" -Force

# Copy component files
Write-Host "Copying component files..." -ForegroundColor Green
Copy-Item -Path "public\js\components\*.js" -Destination "src\js\components\" -Force

# Copy utility files
Write-Host "Copying utility files..." -ForegroundColor Green
Copy-Item -Path "public\js\utils\*.js" -Destination "src\js\utils\" -Force

# Copy assets
Write-Host "Copying assets..." -ForegroundColor Green
Copy-Item -Path "public\assets\icons\*" -Destination "src\assets\icons\" -Force
Copy-Item -Path "public\assets\images\*" -Destination "src\assets\images\" -Force

# Copy manifest and service worker
Write-Host "Copying manifest and service worker..." -ForegroundColor Green
Copy-Item -Path "public\manifest.json" -Destination "src\" -Force
Copy-Item -Path "public\sw-register.js" -Destination "src\" -Force
Copy-Item -Path "public\sw.js" -Destination "src\" -Force

# Copy index.html to src root
Write-Host "Copying and updating index.html..." -ForegroundColor Green
Copy-Item -Path "public\index.html" -Destination "src\" -Force

Write-Host "Migration complete!" -ForegroundColor Green