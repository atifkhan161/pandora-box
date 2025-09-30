/**
 * File Management Component
 * Handles file browsing and move operations
 */

import auth from '../services/auth.js';
import api from '../services/api.js';
import { Navigation } from './navigation.js';

let files = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  Navigation.init('app');
  initializeEventListeners();
  loadFiles();
});

function initializeEventListeners() {
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.addEventListener('click', loadFiles);
}

async function loadFiles() {
  const loadingEl = document.getElementById('files-loading');
  const listEl = document.getElementById('files-list');
  
  try {
    loadingEl.style.display = 'block';
    const response = await api.get('/files/browse');
    
    if (response && response.success && response.data) {
      files = response.data.items || [];
      renderFiles();
    } else {
      showError('Failed to load files');
    }
  } catch (error) {
    console.error('Error loading files:', error);
    showError('Failed to load files');
  } finally {
    loadingEl.style.display = 'none';
  }
}

function renderFiles() {
  const listEl = document.getElementById('files-list');
  
  if (!files.length) {
    listEl.innerHTML = '<div class="no-files">No files found in downloads folder</div>';
    return;
  }

  const mediaFiles = files.filter(file => !file.isDir && isMediaFile(file.name));
  
  if (!mediaFiles.length) {
    listEl.innerHTML = '<div class="no-files">No media files found in downloads folder</div>';
    return;
  }

  const filesHTML = mediaFiles.map(file => `
    <div class="file-item" data-filename="${file.name}">
      <div class="file-info">
        <div class="file-icon">📁</div>
        <div class="file-details">
          <h3 class="file-name">${file.name}</h3>
          <span class="file-size">${formatBytes(file.size || 0)}</span>
        </div>
      </div>
      <div class="file-actions">
        <button class="btn btn-primary move-movies-btn" data-filename="${file.name}">
          Move to Movies
        </button>
        <button class="btn btn-secondary move-tvshows-btn" data-filename="${file.name}">
          Move to TV Shows
        </button>
      </div>
    </div>
  `).join('');

  listEl.innerHTML = filesHTML;
  attachFileListeners();
}

function attachFileListeners() {
  document.querySelectorAll('.move-movies-btn').forEach(btn => {
    btn.addEventListener('click', () => moveToMovies(btn.dataset.filename));
  });

  document.querySelectorAll('.move-tvshows-btn').forEach(btn => {
    btn.addEventListener('click', () => moveToTvShows(btn.dataset.filename));
  });
}

async function moveToMovies(filename) {
  const btn = document.querySelector(`[data-filename="${filename}"].move-movies-btn`);
  const originalText = btn.textContent;
  
  try {
    btn.textContent = 'Moving...';
    btn.disabled = true;
    
    const response = await api.post('/files/move-to-movies', { filename });
    
    if (response && response.success) {
      showNotification('success', `${filename} moved to movies folder`);
      loadFiles(); // Refresh the file list
    } else {
      showNotification('error', 'Failed to move file to movies folder');
    }
  } catch (error) {
    console.error('Error moving file:', error);
    showNotification('error', 'Failed to move file to movies folder');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function moveToTvShows(filename) {
  const btn = document.querySelector(`[data-filename="${filename}"].move-tvshows-btn`);
  const originalText = btn.textContent;
  
  try {
    btn.textContent = 'Moving...';
    btn.disabled = true;
    
    const response = await api.post('/files/move-to-tvshows', { filename });
    
    if (response && response.success) {
      showNotification('success', `${filename} moved to TV shows folder`);
      loadFiles(); // Refresh the file list
    } else {
      showNotification('error', 'Failed to move file to TV shows folder');
    }
  } catch (error) {
    console.error('Error moving file:', error);
    showNotification('error', 'Failed to move file to TV shows folder');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function isMediaFile(filename) {
  const mediaExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
  return mediaExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function showError(message) {
  const listEl = document.getElementById('files-list');
  listEl.innerHTML = `<div class="files-error">${message}</div>`;
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