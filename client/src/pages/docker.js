import auth from '../services/auth.js';
import api from '../services/api.js';
import { Navigation } from '../components/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  Navigation.init('app');
  initializeDockerManager();
});

function initializeDockerManager() {
  initializeTabs();
  initializeRefreshButtons();
  initializeModal();
  loadContainers();
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      if (targetTab === 'containers') loadContainers();
      else if (targetTab === 'stacks') loadStacks();
      else if (targetTab === 'images') loadImages();
    });
  });
}

function initializeRefreshButtons() {
  document.getElementById('refresh-containers').addEventListener('click', loadContainers);
  document.getElementById('refresh-stacks').addEventListener('click', loadStacks);
  document.getElementById('refresh-images').addEventListener('click', loadImages);
}

function initializeModal() {
  const modal = document.getElementById('logs-modal');
  const closeBtn = document.querySelector('.modal-close');
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

async function loadContainers() {
  const containersList = document.getElementById('containers-list');
  containersList.innerHTML = '<div class="loading">Loading containers...</div>';
  
  try {
    const containers = await api.get('/api/v1/docker/containers');
    renderContainers(containers);
  } catch (error) {
    containersList.innerHTML = `<div class="error">Failed to load containers: ${error.message}</div>`;
  }
}

async function loadStacks() {
  const stacksList = document.getElementById('stacks-list');
  stacksList.innerHTML = '<div class="loading">Loading stacks...</div>';
  
  try {
    const stacks = await api.get('/api/v1/docker/stacks');
    renderStacks(stacks);
  } catch (error) {
    stacksList.innerHTML = `<div class="error">Failed to load stacks: ${error.message}</div>`;
  }
}

async function loadImages() {
  const imagesList = document.getElementById('images-list');
  imagesList.innerHTML = '<div class="loading">Loading images...</div>';
  
  try {
    const images = await api.get('/api/v1/docker/images');
    renderImages(images);
  } catch (error) {
    imagesList.innerHTML = `<div class="error">Failed to load images: ${error.message}</div>`;
  }
}

function renderContainers(containers) {
  const containersList = document.getElementById('containers-list');
  
  if (!containers || containers.length === 0) {
    containersList.innerHTML = '<div class="loading">No containers found</div>';
    return;
  }
  
  containersList.innerHTML = containers.map(container => `
    <div class="docker-item">
      <div class="docker-item-header">
        <div class="docker-item-name">${container.Names[0].replace('/', '')}</div>
        <div class="docker-item-status status-${container.State.toLowerCase()}">${container.State}</div>
      </div>
      <div class="docker-item-info">
        <div><strong>Image:</strong> ${container.Image}</div>
        <div><strong>Created:</strong> ${new Date(container.Created * 1000).toLocaleString()}</div>
        <div><strong>Ports:</strong> ${container.Ports.map(p => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : p.PrivatePort).join(', ') || 'None'}</div>
      </div>
      <div class="docker-item-actions">
        <button class="btn btn-primary btn-small" onclick="restartContainer('${container.Id}')">Restart</button>
        <button class="btn btn-secondary btn-small" onclick="viewLogs('${container.Id}')">View Logs</button>
      </div>
    </div>
  `).join('');
}

function renderStacks(stacks) {
  const stacksList = document.getElementById('stacks-list');
  
  if (!stacks || stacks.length === 0) {
    stacksList.innerHTML = '<div class="loading">No stacks found</div>';
    return;
  }
  
  stacksList.innerHTML = stacks.map(stack => `
    <div class="docker-item">
      <div class="docker-item-header">
        <div class="docker-item-name">${stack.Name}</div>
        <div class="docker-item-status status-${stack.Status === 1 ? 'running' : 'stopped'}">${stack.Status === 1 ? 'Active' : 'Inactive'}</div>
      </div>
      <div class="docker-item-info">
        <div><strong>Type:</strong> ${stack.Type === 1 ? 'Swarm' : 'Compose'}</div>
        <div><strong>Created:</strong> ${new Date(stack.CreationDate * 1000).toLocaleString()}</div>
        <div><strong>Environment:</strong> ${stack.EndpointId}</div>
      </div>
      <div class="docker-item-actions">
        <button class="btn btn-primary btn-small" onclick="restartStack('${stack.Id}')">Restart</button>
      </div>
    </div>
  `).join('');
}

function renderImages(images) {
  const imagesList = document.getElementById('images-list');
  
  if (!images || images.length === 0) {
    imagesList.innerHTML = '<div class="loading">No images found</div>';
    return;
  }
  
  imagesList.innerHTML = images.map(image => `
    <div class="docker-item">
      <div class="docker-item-header">
        <div class="docker-item-name">${image.RepoTags ? image.RepoTags[0] : image.Id.substring(0, 12)}</div>
      </div>
      <div class="docker-item-info">
        <div><strong>Size:</strong> ${(image.Size / 1024 / 1024).toFixed(2)} MB</div>
        <div><strong>Created:</strong> ${new Date(image.Created * 1000).toLocaleString()}</div>
        <div><strong>ID:</strong> ${image.Id.substring(0, 12)}</div>
      </div>
    </div>
  `).join('');
}

window.restartContainer = async function(containerId) {
  try {
    const result = await api.post(`/api/v1/docker/restart-container/${containerId}`);
    showNotification('success', 'Container restarted successfully');
    setTimeout(loadContainers, 2000);
  } catch (error) {
    showNotification('error', `Failed to restart container: ${error.message}`);
  }
};

window.restartStack = async function(stackId) {
  try {
    const result = await api.post(`/api/v1/docker/restart-stack/${stackId}`);
    showNotification('success', 'Stack restarted successfully');
    setTimeout(loadStacks, 2000);
  } catch (error) {
    showNotification('error', `Failed to restart stack: ${error.message}`);
  }
};

window.viewLogs = async function(containerId) {
  const modal = document.getElementById('logs-modal');
  const logsContent = document.getElementById('logs-content');
  
  logsContent.textContent = 'Loading logs...';
  modal.classList.add('show');
  
  try {
    const result = await api.get(`/api/v1/docker/container-logs/${containerId}?lines=100`);
    logsContent.textContent = result.logs || 'No logs available';
  } catch (error) {
    logsContent.textContent = `Failed to load logs: ${error.message}`;
  }
};

function showNotification(type, message) {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notificationContainer.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 500);
  }, 5000);
}