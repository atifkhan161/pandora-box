/**
 * UI Components for Pandora Box PWA
 * Reusable UI components for the application
 */

class UIComponents {
  /**
   * Create a media card element
   */
  static createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.dataset.id = item.id;
    
    // Default poster image if not available
    const posterUrl = item.poster || '/assets/images/placeholder-poster.jpg';
    
    card.innerHTML = `
      <img src="${posterUrl}" alt="${item.title}" class="media-card-image" loading="lazy">
      <div class="media-card-overlay">
        <h4 class="media-card-title">${item.title}</h4>
        <div class="media-card-info">${item.year || ''} ${item.type === 'show' ? '• TV Show' : '• Movie'}</div>
      </div>
      <div class="media-card-actions">
        <button class="media-card-action" data-action="play" aria-label="Play ${item.title}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button class="media-card-action" data-action="info" aria-label="More information about ${item.title}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </button>
        <button class="media-card-action" data-action="download" aria-label="Download ${item.title}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </button>
      </div>
    `;
    
    return card;
  }
  
  /**
   * Create a download item element
   */
  static createDownloadItem(download) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.dataset.id = download.id;
    
    // Determine status class
    let statusClass = '';
    let statusIcon = '';
    
    switch (download.status) {
      case 'downloading':
        statusClass = 'badge-info';
        statusIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
        break;
      case 'seeding':
        statusClass = 'badge-primary';
        statusIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 15V3H3v14h11v-2H5zm16 0h-8v2h8v2h-8v2h10V13h-2v2z"/></svg>';
        break;
      case 'completed':
        statusClass = 'badge-success';
        statusIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        break;
      case 'paused':
        statusClass = 'badge-warning';
        statusIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        break;
      case 'error':
        statusClass = 'badge-error';
        statusIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
        break;
    }
    
    // Calculate progress percentage
    const progress = download.progress || 0;
    const progressPercent = Math.round(progress * 100);
    
    item.innerHTML = `
      <div class="list-item-content">
        <div class="flex justify-between mb-xs">
          <div class="list-item-title">${download.name}</div>
          <span class="badge ${statusClass}">
            ${statusIcon}
            ${download.status}
          </span>
        </div>
        <div class="list-item-subtitle">${download.size || 'Unknown size'}</div>
        <div class="progress mt-sm">
          <div class="progress-bar" style="width: ${progressPercent}%"></div>
        </div>
        <div class="flex justify-between mt-xs">
          <span>${progressPercent}%</span>
          <span>${download.speed || '0 KB/s'}</span>
        </div>
      </div>
      <div class="list-item-actions">
        ${download.status === 'downloading' ? `
          <button class="btn btn-icon btn-text" data-action="pause" aria-label="Pause download">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
        ` : ''}
        ${download.status === 'paused' ? `
          <button class="btn btn-icon btn-text" data-action="resume" aria-label="Resume download">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        ` : ''}
        <button class="btn btn-icon btn-text" data-action="info" aria-label="Download information">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </button>
        <button class="btn btn-icon btn-text" data-action="delete" aria-label="Delete download">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    `;
    
    return item;
  }
  
  /**
   * Create a file item element
   */
  static createFileItem(file) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.dataset.path = file.path;
    
    // Determine file icon based on type
    let fileIcon = '';
    
    if (file.isDirectory) {
      fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>';
    } else {
      // Determine icon based on file extension
      const extension = file.name.split('.').pop().toLowerCase();
      
      if (['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(extension)) {
        fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';
      } else if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
        fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
        fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
      } else if (['pdf'].includes(extension)) {
        fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>';
      } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
        fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
      } else {
        fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>';
      }
    }
    
    item.innerHTML = `
      <div class="list-item-content">
        <div class="flex items-center">
          <div class="mr-sm">${fileIcon}</div>
          <div>
            <div class="list-item-title">${file.name}</div>
            <div class="list-item-subtitle">
              ${file.isDirectory ? 'Directory' : UIComponents.formatFileSize(file.size)}
              ${file.modifiedTime ? ` • ${new Date(file.modifiedTime).toLocaleDateString()}` : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="list-item-actions">
        ${!file.isDirectory ? `
          <button class="btn btn-icon btn-text" data-action="download" aria-label="Download file">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
        ` : ''}
        <button class="btn btn-icon btn-text" data-action="rename" aria-label="Rename file">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button class="btn btn-icon btn-text" data-action="delete" aria-label="Delete file">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    `;
    
    return item;
  }
  
  /**
   * Create a container item element
   */
  static createContainerItem(container) {
    const item = document.createElement('div');
    item.className = 'card mb-md';
    item.dataset.id = container.id;
    
    // Determine status class and icon
    let statusClass = '';
    let statusText = '';
    
    switch (container.status) {
      case 'running':
        statusClass = 'badge-success';
        statusText = 'Running';
        break;
      case 'paused':
        statusClass = 'badge-warning';
        statusText = 'Paused';
        break;
      case 'exited':
        statusClass = 'badge-error';
        statusText = 'Stopped';
        break;
      default:
        statusClass = 'badge-info';
        statusText = container.status;
    }
    
    item.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${container.name}</h3>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="card-body">
        <div class="mb-sm">
          <strong>Image:</strong> ${container.image}
        </div>
        <div class="mb-sm">
          <strong>Created:</strong> ${new Date(container.created).toLocaleString()}
        </div>
        <div class="mb-md">
          <strong>Ports:</strong> ${container.ports || 'None'}
        </div>
        <div class="flex gap-sm">
          ${container.status === 'running' ? `
            <button class="btn btn-sm btn-outline" data-action="stop">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
                <path d="M6 6h12v12H6z"/>
              </svg>
              Stop
            </button>
            <button class="btn btn-sm btn-outline" data-action="restart">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Restart
            </button>
          ` : `
            <button class="btn btn-sm btn-primary" data-action="start">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Start
            </button>
          `}
          <button class="btn btn-sm btn-outline" data-action="logs">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="mr-sm">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Logs
          </button>
        </div>
      </div>
    `;
    
    return item;
  }
  
  /**
   * Create a modal element
   */
  static createModal(options) {
    const modalId = options.id || `modal-${Date.now()}`;
    
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = `${modalId}-backdrop`;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = modalId;
    
    // Create modal content
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${options.title || 'Modal'}</h3>
        <button class="modal-close" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        ${options.content || ''}
      </div>
      ${options.footer ? `
        <div class="modal-footer">
          ${options.footer}
        </div>
      ` : ''}
    `;
    
    // Add modal to backdrop
    backdrop.appendChild(modal);
    
    // Add to document
    document.body.appendChild(backdrop);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      UIComponents.closeModal(modalId);
    });
    
    // Close on backdrop click if closeOnBackdrop is true
    if (options.closeOnBackdrop !== false) {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) {
          UIComponents.closeModal(modalId);
        }
      });
    }
    
    // Show modal after a small delay to allow for animation
    setTimeout(() => {
      backdrop.classList.add('active');
    }, 10);
    
    return {
      id: modalId,
      element: modal,
      backdrop: backdrop,
      close: () => UIComponents.closeModal(modalId)
    };
  }
  
  /**
   * Close a modal
   */
  static closeModal(modalId) {
    const backdrop = document.getElementById(`${modalId}-backdrop`);
    
    if (backdrop) {
      backdrop.classList.remove('active');
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      }, 300);
    }
  }
  
  /**
   * Create a toast notification
   */
  static createToast(options) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${options.type ? `toast-${options.type}` : ''}`;
    
    // Set icon based on type
    let icon = '';
    switch (options.type) {
      case 'success':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        break;
      case 'error':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        break;
      case 'warning':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        break;
      default: // info
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    // Build toast content
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${options.title ? `<div class="toast-title">${options.title}</div>` : ''}
        <p class="toast-message">${options.message}</p>
        ${options.action ? `<button class="btn btn-sm btn-primary mt-sm">${options.action.text}</button>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Add event listeners
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      UIComponents.closeToast(toast);
    });
    
    // Add action button event listener if provided
    if (options.action) {
      const actionBtn = toast.querySelector('.btn');
      actionBtn.addEventListener('click', () => {
        options.action.callback();
        UIComponents.closeToast(toast);
      });
    }
    
    // Auto-hide after duration (if not 0)
    if (options.duration !== 0) {
      setTimeout(() => {
        UIComponents.closeToast(toast);
      }, options.duration || 3000);
    }
    
    return toast;
  }
  
  /**
   * Close a toast notification
   */
  static closeToast(toast) {
    toast.classList.add('hide');
    
    // Remove after animation completes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
  
  /**
   * Format file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0 || bytes === undefined) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Format duration in seconds to HH:MM:SS
   */
  static formatDuration(seconds) {
    if (!seconds) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    
    if (hours > 0) {
      parts.push(hours.toString().padStart(2, '0'));
    }
    
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));
    
    return parts.join(':');
  }
  
  /**
   * Create a loading spinner
   */
  static createLoader(size = 'md') {
    const loader = document.createElement('div');
    loader.className = `loader loader-${size}`;
    return loader;
  }
  
  /**
   * Create a loading state for a container
   */
  static createLoadingState(container, message = 'Loading...') {
    // Clear container
    container.innerHTML = '';
    
    // Create loading element
    const loadingEl = document.createElement('div');
    loadingEl.className = 'text-center p-lg';
    loadingEl.innerHTML = `
      <div class="loader loader-lg mb-md"></div>
      <p>${message}</p>
    `;
    
    container.appendChild(loadingEl);
    return loadingEl;
  }
  
  /**
   * Create an empty state for a container
   */
  static createEmptyState(container, options) {
    // Clear container
    container.innerHTML = '';
    
    // Create empty state element
    const emptyEl = document.createElement('div');
    emptyEl.className = 'text-center p-lg';
    
    // Icon
    let icon = '';
    if (options.icon) {
      icon = options.icon;
    } else {
      icon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-bottom: 1rem;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }
    
    emptyEl.innerHTML = `
      ${icon}
      <h3 class="mb-sm">${options.title || 'No items found'}</h3>
      <p class="mb-md">${options.message || 'There are no items to display.'}</p>
      ${options.action ? `
        <button class="btn btn-primary">${options.action.text}</button>
      ` : ''}
    `;
    
    // Add action button event listener if provided
    if (options.action) {
      const actionBtn = emptyEl.querySelector('.btn');
      actionBtn.addEventListener('click', options.action.callback);
    }
    
    container.appendChild(emptyEl);
    return emptyEl;
  }
  
  /**
   * Create an error state for a container
   */
  static createErrorState(container, options) {
    // Clear container
    container.innerHTML = '';
    
    // Create error state element
    const errorEl = document.createElement('div');
    errorEl.className = 'text-center p-lg';
    
    errorEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-error); margin-bottom: 1rem;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <h3 class="mb-sm">${options.title || 'Error'}</h3>
      <p class="mb-md">${options.message || 'An error occurred while loading data.'}</p>
      ${options.action ? `
        <button class="btn btn-primary">${options.action.text || 'Try Again'}</button>
      ` : ''}
    `;
    
    // Add action button event listener if provided
    if (options.action) {
      const actionBtn = errorEl.querySelector('.btn');
      actionBtn.addEventListener('click', options.action.callback);
    }
    
    container.appendChild(errorEl);
    return errorEl;
  }
}

// Export the UI components
window.UIComponents = UIComponents;