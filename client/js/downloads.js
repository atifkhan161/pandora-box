class DownloadsController {
    constructor() {
        this.downloadItems = document.getElementById('download-items');
        this.torrentSearchInput = document.getElementById('torrent-search-input');
        this.torrentSearchButton = document.getElementById('torrent-search-button');
        this.searchResults = document.getElementById('search-results');
        this.progressDisplay = document.getElementById('progress-display');
        this.historyList = document.getElementById('history-list');
        this.socket = null;
        this.init();
    }

    init() {
        console.log('DownloadsController initialized.');
        this.torrentSearchButton.addEventListener('click', this.handleTorrentSearch.bind(this));
        this.connectWebSocket();
        this.fetchDownloadHistory();
    }

    async fetchDownloadHistory() {
        try {
            const response = await fetch('/api/v1/downloads/history'); // Assuming this endpoint exists
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const history = await response.json();
            this.renderDownloadHistory(history);
        } catch (error) {
            console.error('Error fetching download history:', error);
            this.historyList.innerHTML = '<p>Error loading download history.</p>';
        }
    }

    renderDownloadHistory(history) {
        this.historyList.innerHTML = ''; // Clear previous history
        if (history.length === 0) {
            this.historyList.innerHTML = '<p>No download history found.</p>';
            return;
        }
        history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <h3>${item.name}</h3>
                    <p>Status: ${item.status}</p>
                    <p>Completed: ${new Date(item.completedAt).toLocaleString()}</p>
                </div>
            `;
            this.historyList.appendChild(li);
        });
    }

    connectWebSocket() {
        // Assuming WebSocket server runs on the same host and port 3000
        this.socket = new WebSocket('ws://localhost:3000/ws');

        this.socket.onopen = () => {
            console.log('WebSocket connected.');
            this.progressDisplay.innerHTML = '<p>Connected to real-time download updates.</p>';
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            this.updateDownloadProgress(data);
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting in 5 seconds...');
            this.progressDisplay.innerHTML = '<p>Disconnected from real-time updates. Reconnecting...</p>';
            setTimeout(() => this.connectWebSocket(), 5000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.progressDisplay.innerHTML = '<p>WebSocket error. Check console for details.</p>';
        };
    }

    updateDownloadProgress(data) {
        // This is a placeholder. You'll need to parse the data and update the UI accordingly.
        // For example, if data contains { torrentName: '...', progress: '...', speed: '...' }
        this.progressDisplay.innerHTML = `
            <div>
                <h3>${data.torrentName || 'Unknown Torrent'}</h3>
                <p>Progress: ${data.progress || 'N/A'}</p>
                <p>Speed: ${data.speed || 'N/A'}</p>
                <p>ETA: ${data.eta || 'N/A'}</p>
            </div>
        `;
    }

    handleTorrentSearch() {
        const query = this.torrentSearchInput.value;
        console.log('Searching for torrents:', query);
        // TODO: Implement actual torrent search logic using API
        this.searchResults.innerHTML = `<p>Searching for ${query}...</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DownloadsController();
});