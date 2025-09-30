/**
 * Downloads Page Handler
 * Manages download list and controls
 */

import auth from '../services/auth.js';
import api from '../services/api.js';
import themeManager from '../services/theme.js';
import { Navigation } from '../components/navigation.js';

let currentFilter = 'all';
let downloads = [];
let updateInterval;
let socket;

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize theme manager
  themeManager.init();
  
  Navigation.init('app');
  initializeEventListeners();
  loadDownloads();
  connectWebSocket();
});

function initializeEventListeners() {
  // Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderDownloads();
    });
  });
}

async function loadDownloads() {
  const loadingEl = document.getElementById('downloads-loading');
  const listEl = document.getElementById('downloads-list');
  
  try {
    loadingEl.style.display = 'block';
    const response = await api.get('/downloads');
    
    if (response && Array.isArray(response)) {
      downloads = response;
      renderDownloads();
      updateStats();
    } else {
      showError('Failed to load downloads');
    }
  } catch (error) {
    console.error('Error loading downloads:', error);
    showError('Failed to load downloads');
  } finally {
    loadingEl.style.display = 'none';
  }
}

function renderDownloads() {
  const listEl = document.getElementById('downloads-list');
  const filteredDownloads = filterDownloads(downloads);
  
  if (!filteredDownloads.length) {
    listEl.innerHTML = `<div class="no-downloads">No ${currentFilter === 'all' ? '' : currentFilter} downloads found</div>`;
    return;
  }

  const downloadsHTML = filteredDownloads.map(download => `
    <div class="download-item" data-hash="${download.hash}">
      <div class="download-info">
        <h3 class="download-name">${download.name}</h3>
        <div class="download-progress">
          <div class="progress-bar">
            <div class="progress-fill ${download.state.toLowerCase() === 'downloading' ? 'progress-animated' : ''}" style="width: ${(download.progress * 100).toFixed(1)}%"></div>
          </div>
          <span class="progress-text">${(download.progress * 100).toFixed(1)}%</span>
        </div>
        <div class="download-meta">
          <span class="download-size">${formatBytes(download.size)}</span>
          <span class="download-status status-${download.state.toLowerCase()}">${formatStatus(download.state)}</span>
          <span class="download-speed">↓ ${formatBytes(download.dlspeed)}/s</span>
          <span class="upload-speed">↑ ${formatBytes(download.upspeed)}/s</span>
          <span class="download-eta">${formatETA(download.eta)}</span>
        </div>
      </div>
      <div class="download-actions">
        ${renderDownloadActions(download)}
      </div>
    </div>
  `).join('');

  listEl.innerHTML = downloadsHTML;
  attachDownloadListeners();
}

function renderDownloadActions(download) {
  const state = download.state.toLowerCase();
  let actions = '';

  if (state === 'pauseddl' || state === 'pausedup') {
    actions += `<button class="btn btn-primary resume-btn" data-hash="${download.hash}">Resume</button>`;
  } else if (state === 'downloading' || state === 'uploading' || state === 'queueddl' || state === 'queuedup') {
    actions += `<button class="btn btn-primary pause-btn" data-hash="${download.hash}">Pause</button>`;
  } else if (state === 'stoppeddl' || state === 'stoppedup' || state === 'error') {
    actions += `<button class="btn btn-primary start-btn" data-hash="${download.hash}">Start</button>`;
  }

  actions += `<button class="btn btn-danger remove-btn" data-hash="${download.hash}">Remove</button>`;
  
  return actions;
}

function attachDownloadListeners() {
  // Pause buttons
  document.querySelectorAll('.pause-btn').forEach(btn => {
    btn.addEventListener('click', () => pauseDownload(btn.dataset.hash));
  });

  // Resume buttons
  document.querySelectorAll('.resume-btn').forEach(btn => {
    btn.addEventListener('click', () => resumeDownload(btn.dataset.hash));
  });

  // Start buttons
  document.querySelectorAll('.start-btn').forEach(btn => {
    btn.addEventListener('click', () => resumeDownload(btn.dataset.hash));
  });

  // Remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeDownload(btn.dataset.hash));
  });
}

async function pauseDownload(hash) {
  try {
    const response = await api.put(`/downloads/${hash}/pause`);
    if (response && response.success) {
      showNotification('success', 'Download paused');
      loadDownloads();
    } else {
      showNotification('error', 'Failed to pause download');
    }
  } catch (error) {
    showNotification('error', 'Failed to pause download');
  }
}

async function resumeDownload(hash) {
  try {
    const response = await api.put(`/downloads/${hash}/resume`);
    if (response && response.success) {
      showNotification('success', 'Download resumed');
      loadDownloads();
    } else {
      showNotification('error', 'Failed to resume download');
    }
  } catch (error) {
    showNotification('error', 'Failed to resume download');
  }
}

async function removeDownload(hash) {
  if (!confirm('Are you sure you want to remove this download?')) {
    return;
  }

  try {
    const response = await api.delete(`/downloads/${hash}`);
    if (response && response.success) {
      showNotification('success', 'Download removed');
      loadDownloads();
    } else {
      showNotification('error', 'Failed to remove download');
    }
  } catch (error) {
    showNotification('error', 'Failed to remove download');
  }
}

function filterDownloads(downloads) {
  if (currentFilter === 'all') return downloads;
  
  return downloads.filter(download => {
    const state = download.state.toLowerCase();
    switch (currentFilter) {
      case 'downloading':
        return state === 'downloading' || state === 'queuedDL';
      case 'completed':
        return state === 'uploading' || state === 'queuedUP' || download.progress === 1;
      case 'paused':
        return state === 'pausedDL' || state === 'pausedUP';
      case 'error':
        return state === 'error';
      default:
        return true;
    }
  });
}

function updateStats() {
  const totalEl = document.getElementById('total-downloads');
  const downloadSpeedEl = document.getElementById('download-speed');
  const uploadSpeedEl = document.getElementById('upload-speed');

  const totalDownloadSpeed = downloads.reduce((sum, d) => sum + (d.dlspeed || 0), 0);
  const totalUploadSpeed = downloads.reduce((sum, d) => sum + (d.upspeed || 0), 0);

  totalEl.textContent = `${downloads.length} torrents`;
  downloadSpeedEl.textContent = `↓ ${formatBytes(totalDownloadSpeed)}/s`;
  uploadSpeedEl.textContent = `↑ ${formatBytes(totalUploadSpeed)}/s`;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatStatus(state) {
  const statusMap = {
    'downloading': 'Downloading',
    'uploading': 'Seeding',
    'pauseddl': 'Paused',
    'pausedup': 'Paused',
    'queueddl': 'Queued',
    'queuedup': 'Queued',
    'stoppeddl': 'Stopped',
    'stoppedup': 'Stopped',
    'error': 'Error',
    'missingfiles': 'Missing Files'
  };
  return statusMap[state.toLowerCase()] || state;
}

function formatETA(eta) {
  if (!eta || eta === 8640000) return '∞';
  
  const hours = Math.floor(eta / 3600);
  const minutes = Math.floor((eta % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '< 1m';
  }
}

function connectWebSocket() {
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
    script.onload = () => connectWebSocket();
    document.head.appendChild(script);
    return;
  }
  
  socket = io('http://localhost:3000/downloads', {
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('Socket.IO connected to downloads namespace');
  });
  
  socket.on('download_progress', (data) => {
    downloads = data.data;
    renderDownloads();
    updateStats();
  });
  
  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });
}

function showError(message) {
  const listEl = document.getElementById('downloads-list');
  listEl.innerHTML = `<div class="downloads-error">${message}</div>`;
}

function showNotification(type, message) {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      container.removeChild(notification);
    }, 500);
  }, 3000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (socket) {
    socket.disconnect();
  }
});