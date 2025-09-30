/**
 * File Management Component
 * Handles file browsing and move operations
 */

import auth from '../services/auth.js';
import api from '../services/api.js';
import { Navigation } from './navigation.js';

let files = [];
let currentPath = '/';

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
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

async function loadFiles(path = currentPath) {
  const loadingEl = document.getElementById('files-loading');
  
  try {
    loadingEl.style.display = 'block';
    const response = await api.get(`/files/browse?path=${encodeURIComponent(path)}`);
    
    if (response && response.success && response.data) {
      currentPath = path;
      files = response.data.items || [];
      renderBreadcrumb();
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

  const filesHTML = files.map(file => `
    <div class="file-item" data-filename="${file.name}" data-is-dir="${file.isDir}">
      <div class="file-info">
        <div class="file-icon">${file.isDir ? '📁' : '📄'}</div>
        <div class="file-details">
          <h3 class="file-name">${file.name}</h3>
          <span class="file-size">${file.isDir ? 'Directory' : formatBytes(file.size || 0)}</span>
        </div>
      </div>
      <div class="file-menu" data-filename="${file.name}" data-is-dir="${file.isDir}">⋮</div>
    </div>
  `).join('');

  listEl.innerHTML = filesHTML;
  attachFileListeners();
}

function attachFileListeners() {
  document.querySelectorAll('.file-item').forEach(item => {
    const isDir = item.dataset.isDir === 'true';
    const filename = item.dataset.filename;
    
    // Touch and double click to navigate directories
    if (isDir) {
      let touchTime = 0;
      
      item.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - touchTime;
        if (tapLength < 500 && tapLength > 0) {
          const newPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
          loadFiles(newPath);
        }
        touchTime = currentTime;
      });
      
      item.addEventListener('dblclick', () => {
        const newPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
        loadFiles(newPath);
      });
    }
  });
  
  // Dot menu click handlers
  document.querySelectorAll('.file-menu').forEach(menu => {
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const filename = menu.dataset.filename;
      const isDir = menu.dataset.isDir === 'true';
      showContextMenu(e, filename, isDir);
    });
  });
}

async function moveToMovies(filename) {
  try {
    const response = await api.post('/files/move-to-movies', { 
      filename,
      sourcePath: currentPath
    });
    
    if (response && response.success) {
      showNotification('success', `${filename} moved to movies folder`);
      loadFiles();
    } else {
      showNotification('error', 'Failed to move file to movies folder');
    }
  } catch (error) {
    console.error('Error moving file:', error);
    showNotification('error', 'Failed to move file to movies folder');
  }
}

async function moveToTvShows(filename) {
  try {
    const response = await api.post('/files/move-to-tvshows', { 
      filename,
      sourcePath: currentPath
    });
    
    if (response && response.success) {
      showNotification('success', `${filename} moved to TV shows folder`);
      loadFiles();
    } else {
      showNotification('error', 'Failed to move file to TV shows folder');
    }
  } catch (error) {
    console.error('Error moving file:', error);
    showNotification('error', 'Failed to move file to TV shows folder');
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

function renderBreadcrumb() {
  const breadcrumbEl = document.getElementById('breadcrumb');
  const parts = currentPath.split('/').filter(part => part);
  
  let breadcrumbHTML = '<span class="breadcrumb-item" data-path="/">Root</span>';
  
  let path = '';
  parts.forEach(part => {
    path += `/${part}`;
    breadcrumbHTML += ` / <span class="breadcrumb-item" data-path="${path}">${part}</span>`;
  });
  
  breadcrumbEl.innerHTML = breadcrumbHTML;
  
  document.querySelectorAll('.breadcrumb-item').forEach(item => {
    item.addEventListener('click', () => loadFiles(item.dataset.path));
  });
}

function showContextMenu(e, filename, isDir) {
  const contextMenu = document.getElementById('context-menu');
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${e.pageX - 120}px`;
  contextMenu.style.top = `${e.pageY}px`;
  
  // Show all menu items for both files and folders
  document.querySelectorAll('.context-item').forEach(item => {
    item.style.display = 'block';
    
    item.onclick = () => {
      const action = item.dataset.action;
      if (action === 'open' && isDir) {
        const newPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
        loadFiles(newPath);
      } else if (action === 'move-movies') moveToMovies(filename);
      else if (action === 'move-tvshows') moveToTvShows(filename);
      hideContextMenu();
    };
  });
}

function hideContextMenu() {
  document.getElementById('context-menu').style.display = 'none';
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