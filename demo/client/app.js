// Pandora Box PWA - Main Application JavaScript

class PandoraBoxApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isAuthenticated = false;
        this.currentUser = null;
        this.searchTimeout = null;
        this.downloadInterval = null;
        
        // Mock data from provided JSON
        this.mockData = {
            movies: [
                {
                    id: 1,
                    title: "Dune: Part Two",
                    year: 2024,
                    poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
                    rating: 8.2,
                    genre: ["Sci-Fi", "Adventure"],
                    overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
                    category: "trending"
                },
                {
                    id: 2,
                    title: "Oppenheimer",
                    year: 2023,
                    poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
                    rating: 8.4,
                    genre: ["Drama", "History"],
                    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
                    category: "popular"
                },
                {
                    id: 3,
                    title: "Avatar: The Way of Water",
                    year: 2022,
                    poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
                    rating: 7.8,
                    genre: ["Sci-Fi", "Adventure"],
                    overview: "Set more than a decade after the events of the first film, learn the story of the Sully family.",
                    category: "trending"
                },
                {
                    id: 4,
                    title: "Top Gun: Maverick",
                    year: 2022,
                    poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
                    rating: 8.6,
                    genre: ["Action", "Drama"],
                    overview: "After thirty years, Maverick is still pushing the envelope as a top naval aviator.",
                    category: "popular"
                }
            ],
            tvShows: [
                {
                    id: 101,
                    title: "The Bear",
                    year: 2022,
                    poster: "https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",
                    rating: 8.7,
                    genre: ["Comedy", "Drama"],
                    overview: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop.",
                    category: "trending"
                },
                {
                    id: 102,
                    title: "House of the Dragon",
                    year: 2022,
                    poster: "https://image.tmdb.org/t/p/w500/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg",
                    rating: 8.4,
                    genre: ["Fantasy", "Drama"],
                    overview: "The Targaryen civil war begins. Based on George R.R. Martin's 'Fire & Blood'.",
                    category: "popular"
                }
            ],
            downloads: [
                {
                    id: "d1",
                    name: "Dune.Part.Two.2024.1080p.BluRay.x264",
                    progress: 75,
                    status: "downloading",
                    speed: "5.2 MB/s",
                    eta: "15m 32s",
                    size: "8.5 GB",
                    seeders: 142,
                    leechers: 23
                },
                {
                    id: "d2",
                    name: "The.Bear.S03E01.1080p.WEB.h264",
                    progress: 100,
                    status: "completed",
                    speed: "0 B/s",
                    eta: "Completed",
                    size: "1.2 GB",
                    seeders: 89,
                    leechers: 5
                },
                {
                    id: "d3",
                    name: "Oppenheimer.2023.2160p.UHD.BluRay.x265",
                    progress: 45,
                    status: "downloading",
                    speed: "2.8 MB/s",
                    eta: "28m 15s",
                    size: "12.4 GB",
                    seeders: 67,
                    leechers: 12
                }
            ],
            files: [
                {
                    name: "Downloads",
                    type: "folder",
                    path: "/mnt/samba/Downloads",
                    size: "45.2 GB",
                    modified: "2024-08-19"
                },
                {
                    name: "Movies",
                    type: "folder", 
                    path: "/mnt/samba/Movies",
                    size: "2.1 TB",
                    modified: "2024-08-18"
                },
                {
                    name: "TV Shows",
                    type: "folder",
                    path: "/mnt/samba/TV Shows", 
                    size: "890 GB",
                    modified: "2024-08-19"
                },
                {
                    name: "Collections",
                    type: "folder",
                    path: "/mnt/samba/Collections",
                    size: "456 GB",
                    modified: "2024-08-17"
                }
            ],
            containers: [
                {
                    id: "c1",
                    name: "qbittorrent",
                    image: "linuxserver/qbittorrent:latest",
                    status: "running",
                    uptime: "5d 12h",
                    cpu: "2.5%",
                    memory: "156 MB"
                },
                {
                    id: "c2", 
                    name: "jackett",
                    image: "linuxserver/jackett:latest",
                    status: "running",
                    uptime: "5d 12h",
                    cpu: "0.8%",
                    memory: "89 MB"
                },
                {
                    id: "c3",
                    name: "sonarr",
                    image: "linuxserver/sonarr:latest",
                    status: "running",
                    uptime: "5d 11h",
                    cpu: "1.2%",
                    memory: "234 MB"
                },
                {
                    id: "c4",
                    name: "radarr",
                    image: "linuxserver/radarr:latest",
                    status: "running",
                    uptime: "5d 11h",
                    cpu: "0.9%",
                    memory: "198 MB"
                }
            ],
            stacks: [
                {
                    id: "s1",
                    name: "ARR Stack",
                    type: "stack",
                    services: 4,
                    status: "running",
                    containers: ["sonarr", "radarr", "jackett", "gluetun"]
                },
                {
                    id: "s2",
                    name: "Media Stack",
                    type: "stack", 
                    services: 3,
                    status: "running",
                    containers: ["jellyfin", "jellyseerr", "tautulli"]
                }
            ],
            jellyfin: {
                libraries: [
                    {
                        name: "Movies",
                        items: 1247,
                        lastScan: "2024-08-19 10:30",
                        status: "idle"
                    },
                    {
                        name: "TV Shows", 
                        items: 89,
                        lastScan: "2024-08-19 09:15",
                        status: "idle"
                    },
                    {
                        name: "Collections",
                        items: 23,
                        lastScan: "2024-08-18 15:20", 
                        status: "idle"
                    }
                ]
            },
            apiTokens: [
                {
                    service: "TMDB",
                    name: "tmdb_api_key",
                    status: "connected",
                    lastCheck: "2024-08-19 14:30"
                },
                {
                    service: "Watchmode",
                    name: "watchmode_api_key", 
                    status: "connected",
                    lastCheck: "2024-08-19 14:30"
                },
                {
                    service: "Jackett",
                    name: "jackett_api_key",
                    status: "connected",
                    lastCheck: "2024-08-19 14:25"
                }
            ]
        };

        this.currentCategory = 'trending';
        this.currentMediaType = 'all';
        this.selectedMedia = null;
        
        // Initialize immediately
        this.init();
    }

    init() {
        console.log('Initializing Pandora Box App...');
        this.registerServiceWorker();
        this.setupEventListeners();
        this.checkAuthentication();
        this.loadTheme();
        this.startDownloadSimulation();
        console.log('App initialized successfully');
    }

    // Service Worker Registration for PWA
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register(
                    'data:application/javascript;base64,' + btoa(`
                        const CACHE_NAME = 'pandora-box-v1';
                        const urlsToCache = ['/'];
                        
                        self.addEventListener('install', event => {
                            event.waitUntil(
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.addAll(urlsToCache))
                            );
                        });
                        
                        self.addEventListener('fetch', event => {
                            event.respondWith(
                                caches.match(event.request)
                                    .then(response => response || fetch(event.request))
                            );
                        });
                    `)
                );
                console.log('ServiceWorker registered successfully');
            } catch (error) {
                console.log('ServiceWorker registration failed: ', error);
            }
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Login form - use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.setupLoginListeners();
        }, 100);
        
        this.setupNavigationListeners();
        this.setupDashboardListeners();
        this.setupModalListeners();
        this.setupOperationsListeners();
        this.setupJellyfinListeners();
        this.setupSettingsListeners();
        
        console.log('Event listeners set up successfully');
    }

    setupLoginListeners() {
        const loginForm = document.getElementById('login-form');
        const loginButton = document.querySelector('#login-form button[type="submit"]');
        
        console.log('Setting up login listeners...', { loginForm, loginButton });
        
        if (loginForm && loginButton) {
            // Form submission
            loginForm.addEventListener('submit', (e) => {
                console.log('Login form submitted via form');
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin();
                return false;
            });
            
            // Button click
            loginButton.addEventListener('click', (e) => {
                console.log('Login button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin();
                return false;
            });
            
            // Enter key in password field
            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        console.log('Enter pressed in password field');
                        e.preventDefault();
                        this.handleLogin();
                    }
                });
            }
            
            console.log('Login listeners attached successfully');
        } else {
            console.error('Login form elements not found:', { loginForm, loginButton });
        }
    }

    setupNavigationListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Header actions
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    setupDashboardListeners() {
        // Dashboard
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCategoryChange(e.target.dataset.category);
            });
        });
    }

    setupModalListeners() {
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Modal background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Download button in media modal
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.showTorrentModal();
            });
        }

        // Torrent selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-torrent-btn')) {
                this.addTorrent(e.target.closest('.torrent-item'));
            }
        });
    }

    setupOperationsListeners() {
        // Operations tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    setupJellyfinListeners() {
        // Jellyfin update all
        const updateAllBtn = document.getElementById('update-all-btn');
        if (updateAllBtn) {
            updateAllBtn.addEventListener('click', () => {
                this.updateAllLibraries();
            });
        }
    }

    setupSettingsListeners() {
        // Theme selection
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
    }

    checkAuthentication() {
        console.log('Checking authentication...');
        const token = this.getAuthToken();
        if (token && token.expires > Date.now()) {
            console.log('Valid token found, logging in automatically');
            this.isAuthenticated = true;
            this.currentUser = token.user;
            this.showMainApp();
        } else {
            console.log('No valid token found, showing login page');
            this.showLoginPage();
        }
    }

    handleLogin() {
        console.log('Handling login...');
        
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const rememberMeEl = document.getElementById('remember-me');
        
        if (!usernameEl || !passwordEl) {
            console.error('Login form elements not found');
            this.showToast('Login form error', 'error');
            return;
        }
        
        const username = usernameEl.value;
        const password = passwordEl.value;
        const rememberMe = rememberMeEl ? rememberMeEl.checked : false;

        console.log('Login attempt:', { username, password: password ? '***' : 'empty', rememberMe });

        // Simple mock authentication
        if (username === 'admin' && password === 'admin') {
            console.log('Login successful');
            
            const token = {
                token: 'mock-jwt-token',
                user: { username: 'admin', email: 'admin@pandora.box' },
                expires: Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000
            };

            this.setAuthToken(token);
            this.isAuthenticated = true;
            this.currentUser = token.user;
            this.showMainApp();
            this.showToast('Welcome back, ' + username + '!', 'success');
        } else {
            console.log('Login failed - invalid credentials');
            this.showToast('Invalid credentials. Use admin/admin', 'error');
        }
    }

    handleLogout() {
        this.clearAuthToken();
        this.isAuthenticated = false;
        this.currentUser = null;
        this.showLoginPage();
        this.showToast('Logged out successfully', 'success');
    }

    showLoginPage() {
        console.log('Showing login page');
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage && mainApp) {
            loginPage.classList.add('active');
            mainApp.classList.remove('active');
        }
    }

    showMainApp() {
        console.log('Showing main app');
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage && mainApp) {
            loginPage.classList.remove('active');
            mainApp.classList.add('active');
            this.navigateToPage('dashboard');
        }
    }

    navigateToPage(pageId) {
        console.log('Navigating to page:', pageId);
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const navBtn = document.querySelector(`[data-page="${pageId}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            downloads: 'Downloads',
            files: 'Files',
            operations: 'Operations',
            jellyfin: 'Jellyfin',
            settings: 'Settings'
        };
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[pageId] || 'Dashboard';
        }

        this.currentPage = pageId;
        this.loadPageContent(pageId);
    }

    loadPageContent(pageId) {
        switch (pageId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'downloads':
                this.loadDownloads();
                break;
            case 'files':
                this.loadFiles();
                break;
            case 'operations':
                this.loadOperations();
                break;
            case 'jellyfin':
                this.loadJellyfin();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadDashboard() {
        this.renderMediaGrid();
    }

    renderMediaGrid() {
        const container = document.getElementById('media-grid');
        if (!container) return;
        
        const allMedia = [...this.mockData.movies, ...this.mockData.tvShows];
        
        let filteredMedia = allMedia;
        if (this.currentCategory !== 'all') {
            filteredMedia = allMedia.filter(item => item.category === this.currentCategory);
        }

        container.innerHTML = filteredMedia.map(item => `
            <div class="media-card" data-id="${item.id}" data-type="${item.title ? 'movie' : 'tv'}">
                <img src="${item.poster}" alt="${item.title}" class="media-poster" loading="lazy">
                <div class="media-info">
                    <h4 class="media-title">${item.title}</h4>
                    <div class="media-meta">
                        <span class="year">${item.year}</span>
                        <span class="rating">★ ${item.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click listeners to media cards
        container.querySelectorAll('.media-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const type = card.dataset.type;
                this.showMediaModal(id, type);
            });
        });
    }

    handleCategoryChange(category) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const categoryBtn = document.querySelector(`[data-category="${category}"]`);
        if (categoryBtn) {
            categoryBtn.classList.add('active');
        }
        
        this.currentCategory = category;
        this.renderMediaGrid();
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (query.length > 0) {
                this.performSearch(query);
            } else {
                this.renderMediaGrid();
            }
        }, 300);
    }

    performSearch(query) {
        const container = document.getElementById('media-grid');
        if (!container) return;
        
        const allMedia = [...this.mockData.movies, ...this.mockData.tvShows];
        
        const filteredMedia = allMedia.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
        );

        container.innerHTML = filteredMedia.map(item => `
            <div class="media-card" data-id="${item.id}" data-type="${item.title ? 'movie' : 'tv'}">
                <img src="${item.poster}" alt="${item.title}" class="media-poster" loading="lazy">
                <div class="media-info">
                    <h4 class="media-title">${item.title}</h4>
                    <div class="media-meta">
                        <span class="year">${item.year}</span>
                        <span class="rating">★ ${item.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click listeners
        container.querySelectorAll('.media-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const type = card.dataset.type;
                this.showMediaModal(id, type);
            });
        });
    }

    showMediaModal(id, type) {
        const allMedia = [...this.mockData.movies, ...this.mockData.tvShows];
        const media = allMedia.find(item => item.id === id);
        
        if (!media) return;

        this.selectedMedia = media;
        
        document.getElementById('modal-title').textContent = media.title;
        document.getElementById('modal-poster').src = media.poster;
        document.getElementById('modal-year').textContent = media.year;
        document.getElementById('modal-rating').textContent = `★ ${media.rating}`;
        document.getElementById('modal-overview').textContent = media.overview;
        
        const genresContainer = document.getElementById('modal-genres');
        genresContainer.innerHTML = media.genre.map(genre => 
            `<span class="genre-tag">${genre}</span>`
        ).join('');

        document.getElementById('media-modal').classList.remove('hidden');
    }

    showTorrentModal() {
        document.getElementById('media-modal').classList.add('hidden');
        document.getElementById('torrent-modal').classList.remove('hidden');
    }

    addTorrent(torrentElement) {
        const torrentName = torrentElement.querySelector('.torrent-name').textContent;
        
        // Create new download
        const newDownload = {
            id: 'd' + Date.now(),
            name: torrentName,
            progress: 0,
            status: 'downloading',
            speed: '0 B/s',
            eta: 'Calculating...',
            size: torrentElement.querySelector('.size').textContent,
            seeders: parseInt(torrentElement.querySelector('.seeders').textContent),
            leechers: Math.floor(Math.random() * 20)
        };

        this.mockData.downloads.unshift(newDownload);
        this.closeModals();
        this.showToast(`Added "${torrentName}" to downloads`, 'success');
        
        if (this.currentPage === 'downloads') {
            this.loadDownloads();
        }
    }

    loadDownloads() {
        this.updateDownloadStats();
        this.renderDownloadsList();
    }

    updateDownloadStats() {
        const activeDownloads = this.mockData.downloads.filter(d => d.status === 'downloading');
        const totalSpeed = activeDownloads.reduce((sum, d) => {
            const speed = parseFloat(d.speed);
            return sum + (isNaN(speed) ? 0 : speed);
        }, 0);

        const activeEl = document.getElementById('active-downloads');
        const speedEl = document.getElementById('total-speed');
        
        if (activeEl) activeEl.textContent = activeDownloads.length;
        if (speedEl) speedEl.textContent = totalSpeed.toFixed(1) + ' MB/s';
    }

    renderDownloadsList() {
        const container = document.getElementById('downloads-list');
        if (!container) return;
        
        container.innerHTML = this.mockData.downloads.map(download => `
            <div class="download-item">
                <div class="download-header">
                    <div class="download-name">${download.name}</div>
                    <span class="download-status ${download.status}">
                        <span class="status-dot"></span>
                        ${download.status}
                    </span>
                </div>
                <div class="download-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${download.progress}%"></div>
                    </div>
                </div>
                <div class="download-meta">
                    <span>${download.progress}% • ${download.size}</span>
                    <span>${download.speed} • ${download.eta}</span>
                    <span>${download.seeders} seeders • ${download.leechers} leechers</span>
                </div>
                <div class="download-actions">
                    ${download.status === 'downloading' ? 
                        '<button class="btn btn--secondary btn--sm pause-btn" data-id="' + download.id + '">Pause</button>' :
                        download.status === 'paused' ?
                        '<button class="btn btn--primary btn--sm resume-btn" data-id="' + download.id + '">Resume</button>' :
                        ''
                    }
                    <button class="btn btn--outline btn--sm remove-btn" data-id="${download.id}">Remove</button>
                    ${download.status === 'completed' ? 
                        '<button class="btn btn--primary btn--sm move-btn" data-id="' + download.id + '">Move</button>' : 
                        ''
                    }
                </div>
            </div>
        `).join('');

        // Add event listeners for download actions
        container.addEventListener('click', (e) => {
            const downloadId = e.target.dataset.id;
            if (e.target.classList.contains('pause-btn')) {
                this.pauseDownload(downloadId);
            } else if (e.target.classList.contains('resume-btn')) {
                this.resumeDownload(downloadId);
            } else if (e.target.classList.contains('remove-btn')) {
                this.removeDownload(downloadId);
            } else if (e.target.classList.contains('move-btn')) {
                this.moveDownload(downloadId);
            }
        });
    }

    pauseDownload(id) {
        const download = this.mockData.downloads.find(d => d.id === id);
        if (download) {
            download.status = 'paused';
            download.speed = '0 B/s';
            download.eta = 'Paused';
            this.renderDownloadsList();
            this.updateDownloadStats();
            this.showToast('Download paused', 'success');
        }
    }

    resumeDownload(id) {
        const download = this.mockData.downloads.find(d => d.id === id);
        if (download) {
            download.status = 'downloading';
            download.speed = (Math.random() * 10 + 1).toFixed(1) + ' MB/s';
            download.eta = Math.floor(Math.random() * 60) + 'm ' + Math.floor(Math.random() * 60) + 's';
            this.renderDownloadsList();
            this.updateDownloadStats();
            this.showToast('Download resumed', 'success');
        }
    }

    removeDownload(id) {
        this.mockData.downloads = this.mockData.downloads.filter(d => d.id !== id);
        this.renderDownloadsList();
        this.updateDownloadStats();
        this.showToast('Download removed', 'success');
    }

    moveDownload(id) {
        const download = this.mockData.downloads.find(d => d.id === id);
        if (download) {
            // Simulate moving file
            const isMovie = download.name.includes('2024') || download.name.includes('2023');
            const destination = isMovie ? 'Movies' : 'TV Shows';
            this.showToast(`Moved "${download.name}" to ${destination}`, 'success');
        }
    }

    startDownloadSimulation() {
        this.downloadInterval = setInterval(() => {
            this.mockData.downloads.forEach(download => {
                if (download.status === 'downloading' && download.progress < 100) {
                    download.progress = Math.min(100, download.progress + Math.random() * 2);
                    if (download.progress >= 100) {
                        download.status = 'completed';
                        download.speed = '0 B/s';
                        download.eta = 'Completed';
                    }
                }
            });

            if (this.currentPage === 'downloads') {
                this.updateDownloadStats();
                this.renderDownloadsList();
            }
        }, 3000);
    }

    loadFiles() {
        this.renderFilesList();
    }

    renderFilesList() {
        const container = document.getElementById('files-list');
        if (!container) return;
        
        container.innerHTML = this.mockData.files.map(file => `
            <div class="file-item" data-path="${file.path}">
                <div class="file-info">
                    <div class="file-icon">
                        ${file.type === 'folder' ? 
                            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' :
                            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>'
                        }
                    </div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            <span class="file-size">${file.size}</span>
                            <span class="file-modified">Modified: ${file.modified}</span>
                        </div>
                    </div>
                </div>
                <div class="file-actions">
                    ${file.name === 'Downloads' ? 
                        '<button class="btn btn--primary btn--sm organize-btn">Organize</button>' : 
                        ''
                    }
                    <button class="btn btn--outline btn--sm browse-btn">Browse</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('organize-btn')) {
                this.organizeDownloads();
            } else if (e.target.classList.contains('browse-btn')) {
                const path = e.target.closest('.file-item').dataset.path;
                this.browseFolder(path);
            }
        });
    }

    organizeDownloads() {
        this.showToast('Organizing downloads...', 'success');
        // Simulate organizing files
        setTimeout(() => {
            this.showToast('Downloads organized successfully', 'success');
        }, 2000);
    }

    browseFolder(path) {
        this.showToast(`Browsing ${path}`, 'success');
    }

    loadOperations() {
        this.switchTab('containers');
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        if (tabId === 'containers') {
            this.renderContainers();
        } else if (tabId === 'stacks') {
            this.renderStacks();
        }
    }

    renderContainers() {
        const container = document.getElementById('containers-list');
        if (!container) return;
        
        container.innerHTML = this.mockData.containers.map(cont => `
            <div class="container-item">
                <div class="container-header">
                    <div class="container-info">
                        <div class="container-name">${cont.name}</div>
                        <div class="container-image">${cont.image}</div>
                    </div>
                    <span class="container-status ${cont.status}">
                        <span class="status-dot"></span>
                        ${cont.status}
                    </span>
                </div>
                <div class="container-stats">
                    <div class="stat-item">
                        <span class="label">Uptime</span>
                        <span class="value">${cont.uptime}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">CPU</span>
                        <span class="value">${cont.cpu}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Memory</span>
                        <span class="value">${cont.memory}</span>
                    </div>
                </div>
                <div class="container-actions">
                    <button class="btn btn--secondary btn--sm restart-btn" data-id="${cont.id}">Restart</button>
                    <button class="btn btn--outline btn--sm logs-btn" data-id="${cont.id}">Logs</button>
                    <button class="btn btn--outline btn--sm stop-btn" data-id="${cont.id}">Stop</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.addEventListener('click', (e) => {
            const containerId = e.target.dataset.id;
            if (e.target.classList.contains('restart-btn')) {
                this.restartContainer(containerId);
            } else if (e.target.classList.contains('logs-btn')) {
                this.showContainerLogs(containerId);
            } else if (e.target.classList.contains('stop-btn')) {
                this.stopContainer(containerId);
            }
        });
    }

    renderStacks() {
        const container = document.getElementById('stacks-list');
        if (!container) return;
        
        container.innerHTML = this.mockData.stacks.map(stack => `
            <div class="stack-item">
                <div class="stack-header">
                    <div class="stack-info">
                        <div class="stack-name">${stack.name}</div>
                        <div class="stack-services">${stack.services} services</div>
                    </div>
                    <span class="stack-status ${stack.status}">
                        <span class="status-dot"></span>
                        ${stack.status}
                    </span>
                </div>
                <div class="stack-actions">
                    <button class="btn btn--secondary btn--sm restart-stack-btn" data-id="${stack.id}">Restart</button>
                    <button class="btn btn--outline btn--sm stop-stack-btn" data-id="${stack.id}">Stop</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.addEventListener('click', (e) => {
            const stackId = e.target.dataset.id;
            if (e.target.classList.contains('restart-stack-btn')) {
                this.restartStack(stackId);
            } else if (e.target.classList.contains('stop-stack-btn')) {
                this.stopStack(stackId);
            }
        });
    }

    restartContainer(id) {
        const container = this.mockData.containers.find(c => c.id === id);
        if (container) {
            this.showToast(`Restarting ${container.name}...`, 'success');
        }
    }

    showContainerLogs(id) {
        const container = this.mockData.containers.find(c => c.id === id);
        if (container) {
            this.showToast(`Showing logs for ${container.name}`, 'success');
        }
    }

    stopContainer(id) {
        const container = this.mockData.containers.find(c => c.id === id);
        if (container) {
            container.status = 'stopped';
            this.renderContainers();
            this.showToast(`Stopped ${container.name}`, 'success');
        }
    }

    restartStack(id) {
        const stack = this.mockData.stacks.find(s => s.id === id);
        if (stack) {
            this.showToast(`Restarting ${stack.name}...`, 'success');
        }
    }

    stopStack(id) {
        const stack = this.mockData.stacks.find(s => s.id === id);
        if (stack) {
            stack.status = 'stopped';
            this.renderStacks();
            this.showToast(`Stopped ${stack.name}`, 'success');
        }
    }

    loadJellyfin() {
        this.renderLibraries();
    }

    renderLibraries() {
        const container = document.getElementById('libraries-list');
        if (!container) return;
        
        container.innerHTML = this.mockData.jellyfin.libraries.map(library => `
            <div class="library-item">
                <div class="library-header">
                    <h4 class="library-name">${library.name}</h4>
                    <button class="btn btn--primary btn--sm update-library-btn" data-name="${library.name}">Update</button>
                </div>
                <div class="library-stats">
                    <span>${library.items} items</span>
                    <span>Last scan: ${library.lastScan}</span>
                    <span>Status: ${library.status}</span>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('update-library-btn')) {
                const libraryName = e.target.dataset.name;
                this.updateLibrary(libraryName);
            }
        });
    }

    updateLibrary(name) {
        const library = this.mockData.jellyfin.libraries.find(l => l.name === name);
        if (library) {
            library.status = 'updating';
            this.renderLibraries();
            this.showToast(`Updating ${name} library...`, 'success');
            
            setTimeout(() => {
                library.status = 'idle';
                library.lastScan = new Date().toLocaleString();
                this.renderLibraries();
                this.showToast(`${name} library updated`, 'success');
            }, 3000);
        }
    }

    updateAllLibraries() {
        this.mockData.jellyfin.libraries.forEach(library => {
            library.status = 'updating';
        });
        this.renderLibraries();
        this.showToast('Updating all libraries...', 'success');
        
        setTimeout(() => {
            this.mockData.jellyfin.libraries.forEach(library => {
                library.status = 'idle';
                library.lastScan = new Date().toLocaleString();
            });
            this.renderLibraries();
            this.showToast('All libraries updated', 'success');
        }, 5000);
    }

    loadSettings() {
        this.renderApiTokens();
    }

    renderApiTokens() {
        const container = document.getElementById('api-tokens-list');
        if (!container) return;
        
        container.innerHTML = this.mockData.apiTokens.map(token => `
            <div class="api-token-item">
                <div class="token-info">
                    <div class="token-service">${token.service}</div>
                    <div class="token-status">Last check: ${token.lastCheck}</div>
                </div>
                <span class="token-badge ${token.status}">${token.status}</span>
            </div>
        `).join('');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 3000);
        }
    }

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('pandora-theme') || 'dark';
        this.setTheme(savedTheme);
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }

    setTheme(theme) {
        if (theme === 'auto') {
            document.body.removeAttribute('data-color-scheme');
        } else {
            document.body.setAttribute('data-color-scheme', theme);
        }
        localStorage.setItem('pandora-theme', theme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-color-scheme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = newTheme;
        }
    }

    // Auth Token Management
    getAuthToken() {
        try {
            return JSON.parse(localStorage.getItem('pandora-auth'));
        } catch {
            return null;
        }
    }

    setAuthToken(token) {
        localStorage.setItem('pandora-auth', JSON.stringify(token));
    }

    clearAuthToken() {
        localStorage.removeItem('pandora-auth');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting Pandora Box App');
    try {
        const app = new PandoraBoxApp();
        
        // Make app globally accessible for debugging
        window.pandoraApp = app;
        
        console.log('App instance created and available at window.pandoraApp');
    } catch (error) {
        console.error('Failed to start app:', error);
    }
});