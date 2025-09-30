# Pandora Progressive Web Application: Detailed Task List

This document outlines the implementation tasks for the Pandora PWA project, based on the provided PRD, Requirements, and Design documents. Each task is self-contained with sufficient context for a developer to begin work immediately.

***

## 1. Backend Setup and Core Infrastructure

**Goal**: Establish the foundational backend repository and core services, including the initial API routes and database integration.

### Task 1.1: Backend Monorepo Setup (Initial)
* **Description**: Set up the initial NestJS backend within a `server` directory. This task focuses on creating the project structure, configuring the core application, and integrating the LokiJS database. It should also include a basic authentication route to get the system operational.
* **Refer to:** 2.2.1 and 2.2.2 in design document.
* **Requirements**:
    * Create a new NestJS project in a `server` folder.
    * Install and configure LokiJS as the embedded NoSQL database.
    * Initialize the database with the `Users` and `Configuration` collections as defined in the design document.
    * Create a default `admin` user with the password `admin` in the `Users` collection for initial development and testing.
    * Implement a basic `AuthController` with a `POST /api/v1/auth/login` endpoint that validates the default user's credentials. This endpoint should not handle JWT token generation yet.
    * Ensure the backend is configured to run and listen on the specified port (e.g., 3000).
* **Acceptance Criteria**: The backend server starts without errors, connects to the LokiJS database, and a `POST` request to `/api/v1/auth/login` with `username: "admin"` and `password: "admin"` returns a success response.

***

## 2. Frontend Setup and Login Page

**Goal**: Set up the frontend PWA structure and implement the core login functionality that communicates with the backend.

### Task 2.1: Frontend PWA Setup (Initial)
* **Description**: Set up the frontend within a `client` directory. This task involves creating the basic PWA application shell, configuring the service worker, and implementing a functional login page that interacts with the backend authentication endpoint.
* **Refer to:** 3.1.1 in design document.
* **Requirements**:
    * Create a new directory named `client` for the frontend.
    * Implement the PWA application shell using Vanilla JavaScript, HTML, and CSS.
    * Create a basic login page UI with form fields for username and password.
    * Implement JavaScript logic to handle the form submission.
    * The JavaScript should send a `fetch` request to the backend's `POST /api/v1/auth/login` endpoint (created in Task 1.1).
    * Upon successful authentication, redirect the user to a placeholder dashboard page. On failure, display an error message on the login page.
    * Implement and register a basic service worker for PWA functionality and offline caching of static assets as specified in the design document.
* **Acceptance Criteria**: The PWA login page is visually presentable. A user can enter "admin" and "admin," click submit, and successfully log in, being redirected to a new page. The service worker is registered and the application can be installed on a mobile device.

***

## 3. Settings Management

**Goal**: Implement the backend and frontend functionality for a settings page where users can manage their profile and configure external service API keys and file paths.

### Task 3.1: Settings Backend Module
* **Description**: Create a new backend module to manage user settings and external service configurations.
* **Refer to:** 4.1.5 in design document.
* **Requirements**:
    * Create a `SettingsModule` and `SettingsController`.
    * Implement an endpoint `PUT /api/v1/settings/profile` to allow the current user to update their username and password.
    * Implement an endpoint `PUT /api/v1/settings/api-keys` to securely store and update API keys for services like TMDB, Watchmode, Jackett, Jellyfin, and Cloud Commander. The sensitive values must be encrypted before being stored in the LokiJS `Configuration` collection.
    * Add configurable paths for `downloads`, `movies`, and `tv-shows` folders to the configuration model.
    * For each external service (TMDB, Jackett, Jellyfin, Cloud Commander etc.), create a `GET /api/v1/settings/test-connection/:serviceName` endpoint. This endpoint should attempt a basic, non-destructive API call to the respective service to verify connectivity and API key validity.
* **Acceptance Criteria**: The backend can securely update user credentials, encrypted API keys, and configurable file paths. The "Test Connection" endpoints for each service return a successful response when valid credentials are provided and the service is reachable.

### Task 3.2: Settings Frontend Page
* **Description**: Create a new page in the frontend for managing user settings and external API configurations.
* **Refer to:** 4.1.5 in design document.
* **Requirements**:
    * Design and implement a `SettingsComponent` with separate sections for "User Profile," "API Keys," and "File Paths."
    * The "User Profile" section should have forms for updating the username and password, which call the backend's `PUT /api/v1/settings/profile` endpoint.
    * The "API Keys" section should have a form for each external service (TMDB, Watchmode, Jackett, Jellyfin, etc.) to input and save the API key.
    * The "File Paths" section should have input fields for the configurable `downloads`, `movies`, and `tv-shows` folder paths.
    * For each service's form and each file path, add a "Test Connection" button that calls the backend's respective test connection endpoint (`/api/v1/settings/test-connection/:serviceName`).
    * The UI should provide clear feedback (success/error messages) based on the API responses.
* **Acceptance Criteria**: The settings page allows users to update their credentials, API keys, and file paths. The "Test Connection" button for each service provides accurate and immediate feedback on its connectivity status.

***

## 4. Media Discovery

**Goal**: Implement the media discovery functionality by fetching, displaying, and managing metadata from external APIs.

### Task 4.1: Media Discovery Backend Module & Proxy
* **Description**: Create a backend module to handle media discovery by proxying requests to the TMDB and Watchmode APIs. This task is dependent on the TMDB API key being configured in the settings.
* **Refer to:** 3.2.2 and 4.1.3 in design document.
* **Requirements**:
    * Create a `MediaModule` in the backend.
    * Implement a `TmdbService` and `WatchmodeService` to handle API calls. The `TmdbService` must retrieve the API key from the encrypted configuration in LokiJS.
    * Implement a `MediaService` to aggregate data from both services and manage caching.
    * Implement the caching logic using the LokiJS `MediaCache` collection as detailed in the design document.
    * Create a `MediaController` with the following endpoints:
        * `GET /api/v1/media/trending`: Fetch trending movies and TV shows.
        * `GET /api/v1/media/latest-movies`: Fetch the latest movies.
        * `GET /api/v1/media/latest-tvshows`: Fetch the latest TV shows.
        * `GET /api/v1/media/details/:mediaType/:id`: Fetch detailed metadata for a specific movie or TV show from TMDB and Watchmode.
        * `GET /api/v1/media/search`: A multi-purpose search endpoint that can search for movies, TV shows, and people (cast) based on a query.
* **Acceptance Criteria**: The API endpoints return media data from the external services only after a valid API key has been configured via the settings page. The caching logic successfully prevents redundant API calls. The dedicated `details` endpoint correctly aggregates data from both TMDB and Watchmode.

### Task 4.2: Media Discovery Frontend Components
* **Description**: Implement the frontend components to display media on the dashboard, individual detail pages, and a search page.
* **Refer to:** 3.1.3 and 3.1.4 in design document.
* **Requirements**:
    * **Dashboard**: Develop a `DashboardComponent` to display media cards for "Latest Movies" and "Latest TV Shows."
    * **Dashboard Interaction**: Make the media cards clickable. When a user clicks a card, they should be redirected to a new page with a dynamic URL (e.g., `/media/movie/12345`).
    * **Media Details Page**: Create a new `MediaDetailsComponent` that uses the URL parameters to fetch detailed metadata from the backend's `details` endpoint. The page should display information such as:
        * Title, year, and poster image.
        * Synopsis/Overview.
        * Cast and crew information.
        * Genre and runtime.
        * User ratings and reviews.
        * Streaming provider availability from Watchmode.
        * Add a container/section to display torrent links for the media item. This section should be hidden until a user clicks a "Find Torrents" button.
    * **Search Page**: Implement a dedicated `SearchComponent` with a search bar. When a user types a query, it should send a request to the backend's `search` endpoint and display results for movies, TV shows, and cast members in a categorized list.
* **Acceptance Criteria**: The dashboard displays the latest movies and TV shows. Clicking on a card navigates to a detailed page that shows comprehensive metadata. The search page successfully returns and displays categorized results for movies, TV shows, and people.

***

## 5. Downloads Management

**Goal**: Enable torrent management, including real-time updates via WebSockets.

### Task 5.1: Downloads Backend Module & Torrent Integration
* **Description**: Implement the backend module for downloads management, including the integration with Jackett and qBittorrent. These tasks are dependent on their respective API keys and URLs being configured in the settings page.
* **Refer to:** 3.2.3 and 5.2.1 in design document.
* **Requirements**:
    * Create a `DownloadsModule` in the backend.
    * Implement `JackettService` for searching torrents. It must retrieve the API key and URL from the encrypted configuration.
    * Implement `QbittorrentService` for adding and managing torrents, also retrieving credentials from the configuration.
    * Create a `DownloadsController` with the following endpoints:
        * `GET /api/v1/downloads/search-torrents/:query`: Search Jackett for torrents based on a given media title.
        * `POST /api/v1/downloads/add-torrent`: Add a selected torrent to the qBittorrent download queue.
        * Endpoints to manage the download lifecycle (pause, resume, remove).
    * Implement the `DownloadsGateway` WebSocket for pushing real-time download status updates to the client.
    * Persist download history and status in the LokiJS `Downloads` collection.
* **Acceptance Criteria**: The backend can successfully search Jackett for torrents and add a selected torrent to qBittorrent, only after API keys and URLs are configured in the settings. Real-time updates via WebSockets function correctly.

### Task 5.2: Torrent Search & Download Frontend
* **Description**: Implement the frontend functionality for searching for and initiating torrent downloads directly from the media details page.
* **Refer to:** 3.1.4 and 5.2.1 in design document.
* **Requirements**:
    * **Torrent Container**: On the `MediaDetailsComponent`, implement a container for displaying torrent search results. This container should be initially hidden.
    * **Search Trigger**: Add a button (e.g., "Find Torrents") on the details page. When clicked, it should call the backend's `GET /api/v1/downloads/search-torrents/:query` endpoint, using the media title as the query.
    * **Display Results**: Upon receiving a successful response from the backend, display a list of the available torrents in the container. Each item in the list should show the torrent name, size, and seed/leech count.
    * **Download Action**: For each torrent in the list, add a "Download" button. When this button is clicked, it should send a `POST` request to the backend's `POST /api/v1/downloads/add-torrent` endpoint with the torrent magnet link or `.torrent` file URL.
* **Acceptance Criteria**: On a movie/TV show details page, a user can click a button to search for torrents, see a list of results, and click a "Download" button to add a torrent to the download queue. The download appears in the `DownloadsManagerComponent` (from a previous task).

***

## 6. File Management & Jellyfin Integration

**Goal**: Implement robust file browsing, operations, and media server library management.

### Task 6.1: filebrowser File Management Backend
* **Description**: Implement a backend module to handle file operations using the filebrowser service (https://github.com/filebrowser/filebrowser). This task relies on configurable paths from the settings.
* **Refer to:** 3.2.4 and 5.1.4 in design document.
* **Requirements**:
    * Create a `FilesModule` in the backend.
    * Implement a `FilebrowserService` to handle file operations via its RESTful API.
    * Create a `FilesController` with endpoints to:
        * `GET /api/v1/files/browse`: List files and folders in a specified directory. The initial path should be the configurable `downloads` folder.
        * `POST /api/v1/files/move-to-movies`: Move a file from the `downloads` folder to the configurable `movies` folder.
        * `POST /api/v1/files/move-to-tvshows`: Move a file from the `downloads` folder to the configurable `tv-shows` folder.
    * All endpoints must retrieve the respective folder paths and Cloud Commander credentials from the encrypted configuration.
* **Acceptance Criteria**: The backend can list files and move them between the designated folders as configured in the settings.

### Task 6.2: filebrowser File Management Frontend
* **Description**: Develop a frontend component to browse files and perform move operations from the designated downloads folder.
* **Refer to:** 3.1.5 in design document.
* **Requirements**:
    * Create a new `FileManagementComponent` with a file browser UI.
    * The component should display the content of the `downloads` folder as fetched from the backend's `browse` endpoint.
    * For each downloadable media file, provide two action buttons: "Move to Movies" and "Move to TV Shows."
    * Clicking these buttons should call the corresponding backend endpoints (`move-to-movies`, `move-to-tvshows`).
    * The UI should provide visual feedback on the success or failure of the move operation.
* **Acceptance Criteria**: The user can browse the configurable downloads folder and move a file to either the movies or TV shows folder with a single click.

### Task 6.3: Jellyfin Integration Backend
* **Description**: Create a separate backend module for Jellyfin integration, focusing on library updates.
* **Refer to:** 3.2.4 and 5.1.4 in design document.
* **Requirements**:
    * Within the `FilesModule`, implement a `JellyfinService`.
    * The `JellyfinService` should have a method to trigger a library scan, retrieving the Jellyfin API key and URL from the encrypted configuration.
    * Create a new `JellyfinController` with a single endpoint:
        * `POST /api/v1/jellyfin/update-library`: Call the `JellyfinService` to trigger a full library refresh.
* **Acceptance Criteria**: A `POST` request to the `update-library` endpoint successfully triggers a library scan on the Jellyfin server.

### Task 6.4: Jellyfin Integration Frontend
* **Description**: Implement a dedicated frontend page for Jellyfin management.
* **Refer to:** 3.1.5 and 5.1.4 in design document.
* **Requirements**:
    * Create a new `JellyfinComponent` that is a standalone page in the UI.
    * The page should feature a button labeled "Update Library."
    * Clicking this button should send a request to the backend's `POST /api/v1/jellyfin/update-library` endpoint.
    * Provide clear UI feedback (e.g., "Library update initiated") upon a successful response.
* **Acceptance Criteria**: Users can navigate to a dedicated page and manually trigger a Jellyfin library update.

***

## 7. Docker Management

**Goal**: Implement the ability to monitor and control Docker containers and stacks using the Portainer API.

### Task 7.1: Docker Backend Module
* **Description**: Create a backend module to proxy requests to the Portainer API for managing Docker containers, stacks, and images. This task is dependent on the Portainer URL and credentials being configured in the settings page.
* **Refer to:** 3.2.5 and 5.1.5 in design document.
* **Requirements**:
    * Create a `DockerModule` and `DockerController`.
    * Implement a `PortainerService` for handling API calls. The service must retrieve the Portainer credentials from the encrypted configuration.
    * Create the following API endpoints to interact with Portainer:
        * `GET /api/v1/docker/containers`: List all available containers, including their status.
        * `GET /api/v1/docker/stacks`: List all available stacks.
        * `GET /api/v1/docker/images`: List all available images.
        * `POST /api/v1/docker/restart-container/:id`: Restart a specific container by its ID.
        * `POST /api/v1/docker/restart-stack/:id`: Restart a specific stack by its ID.
        * `GET /api/v1/docker/container-logs/:id`: View the logs of a specific container.
    * The endpoints should proxy the requests to the appropriate Portainer API endpoints.
* **Acceptance Criteria**: The backend can successfully retrieve container, stack, and image information and proxy control commands to the Portainer API, but only after the URL and credentials are configured in the settings.

### Task 7.2: Docker Manager Frontend Component
* **Description**: Implement the frontend component to display Docker container, stack, and image status, and provide management controls.
* **Refer to:** 3.1.5 and 5.1.5 in design document.
* **Requirements**:
    * Develop a `DockerManagerComponent` with separate sections or tabs for viewing containers, stacks, and images.
    * **Containers View**: Display a list of containers with their status (running, stopped, etc.) using color-coded health indicators. For each container, include a button to restart it and another to view its logs, calling the corresponding backend endpoints.
    * **Stacks View**: Display a list of stacks with their status. Include a button to restart each stack.
    * **Images View**: Display a list of images.
* **Acceptance Criteria**: The UI displays a live view of the Docker containers, stacks, and images. Users can perform actions like restarting a container/stack and viewing container logs via the UI.

***

## 8. UI/UX & Theming

**Goal**: Implement a dynamic theming system that allows users to change the look and feel of the application based on popular streaming platforms.

### Task 8.1: Theming Module & Theme Switcher
* **Description**: Implement a modular and scalable theming system using CSS variables. A new option in the settings page will allow users to select from a predefined list of themes inspired by popular OTT platforms. The user's choice will be saved locally to persist across sessions.
* **Refer to:** 2.1 and 3.1.1 in design document.
* **Requirements**:
    * **CSS Variables**: Define a set of CSS variables in a central stylesheet to control colors, fonts, and other stylistic elements.
    * **Theme Definitions**: Create a theme for each of the following platforms using CSS variables:
        * **Netflix:** Red/Black palette.
        * **Amazon Prime Video:** Dark blue/Yellow palette.
        * **Disney+:** Dark purple/White/Teal palette.
    * **Theme Switcher UI**: In the frontend `SettingsComponent`, add a new section for "Theming" with a dropdown or radio buttons for theme selection.
    * **Client-Side Storage**: Implement JavaScript to detect the user's selected theme and store the preference (e.g., `"netflix"`, `"amazon-prime"`) in `localStorage`.
    * **Dynamic Loading**: On application load, the JavaScript should check `localStorage` for a saved theme and apply the corresponding CSS class (e.g., `body.netflix-theme`) to the `<body>` or `<html>` element. If no theme is saved, a default dark theme should be used.
* **Acceptance Criteria**: A new "Theming" section is present in the settings page. The user can select from a list of themes. The selected theme is applied to the entire application's UI, and the choice persists even after a page refresh.