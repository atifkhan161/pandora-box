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
  const logsModal = document.getElementById('logs-modal');
  const countryModal = document.getElementById('country-modal');
  const editModal = document.getElementById('edit-modal');
  const closeBtns = document.querySelectorAll('.modal-close');
  
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      logsModal.classList.remove('show');
      countryModal.classList.remove('show');
      editModal.classList.remove('show');
    });
  });
  
  [logsModal, countryModal, editModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  document.getElementById('apply-country').addEventListener('click', applyCountryChange);
  document.getElementById('save-stack').addEventListener('click', saveStack);
}

async function loadContainers() {
  const containersList = document.getElementById('containers-list');
  containersList.innerHTML = '<div class="loading">Loading containers...</div>';
  
  try {
    const containers = await api.get('/docker/containers');
    renderContainers(containers);
  } catch (error) {
    containersList.innerHTML = `<div class="error">Failed to load containers: ${error.message}</div>`;
  }
}

async function loadStacks() {
  const stacksList = document.getElementById('stacks-list');
  stacksList.innerHTML = '<div class="loading">Loading stacks...</div>';
  
  try {
    const stacks = await api.get('/docker/stacks');
    renderStacks(stacks);
  } catch (error) {
    stacksList.innerHTML = `<div class="error">Failed to load stacks: ${error.message}</div>`;
  }
}

async function loadImages() {
  const imagesList = document.getElementById('images-list');
  imagesList.innerHTML = '<div class="loading">Loading images...</div>';
  
  try {
    const images = await api.get('/docker/images');
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
        <div class="docker-item-status status-${container.State.toLowerCase()}">${container.State} - ${container.Status}</div>
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

async function renderStacks(stacks) {
  const stacksList = document.getElementById('stacks-list');
  
  if (!stacks || stacks.length === 0) {
    stacksList.innerHTML = '<div class="loading">No stacks found</div>';
    return;
  }
  
  const containers = await api.get('/docker/containers');
  
  stacksList.innerHTML = stacks.map(stack => {
    const stackContainers = containers.filter(c => 
      c.Labels && (c.Labels['com.docker.compose.project'] === stack.Name || 
                   c.Labels['com.docker.stack.namespace'] === stack.Name)
    );
    
    const containerCards = stackContainers.map(container => `
      <div class="stack-container-card">
        <div class="container-name">${container.Names[0].replace('/', '')}</div>
        <div class="container-status status-${container.State.toLowerCase()}">${container.State}</div>
      </div>
    `).join('');
    
    return `
      <div class="docker-item stack-item">
        <div class="docker-item-header">
          <div class="docker-item-name">${stack.Name}</div>
          <div class="docker-item-status status-${stack.Status === 1 ? 'running' : 'stopped'}">${stack.Status === 1 ? 'Active' : 'Inactive'}</div>
        </div>
        <div class="docker-item-info">
          <div><strong>Type:</strong> ${stack.Type === 1 ? 'Swarm' : 'Compose'}</div>
          <div><strong>Created:</strong> ${new Date(stack.CreationDate * 1000).toLocaleString()}</div>
          <div><strong>Containers:</strong> ${stackContainers.length}</div>
          <div><strong>Current Country:</strong> ${stack.currentCountry || 'Unknown'}</div>
        </div>
        <div class="stack-containers">
          ${containerCards}
        </div>
        <div class="docker-item-actions">
          <button class="btn btn-primary btn-small" onclick="restartStack('${stack.Id}')">Restart Stack</button>
          <button class="btn btn-secondary btn-small" onclick="viewStackLogs('${stack.Id}')">View Logs</button>
          <button class="btn btn-secondary btn-small" onclick="editStack('${stack.Id}')">Edit</button>
          <button class="btn btn-warning btn-small" onclick="changeCountry('${stack.Id}', '${stack.Name}')">Change Country</button>
        </div>
      </div>
    `;
  }).join('');
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
    const result = await api.post(`/docker/restart-container/${containerId}`);
    showNotification('success', 'Container restarted successfully');
    setTimeout(loadContainers, 2000);
  } catch (error) {
    showNotification('error', `Failed to restart container: ${error.message}`);
  }
};

window.restartStack = async function(stackId) {
  try {
    const result = await api.post(`/docker/restart-stack/${stackId}`);
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
    const result = await api.get(`/docker/container-logs/${containerId}?lines=100`);
    logsContent.textContent = result.logs || 'No logs available';
  } catch (error) {
    logsContent.textContent = `Failed to load logs: ${error.message}`;
  }
};

window.viewStackLogs = async function(stackId) {
  const modal = document.getElementById('logs-modal');
  const logsContent = document.getElementById('logs-content');
  
  logsContent.textContent = 'Loading stack logs...';
  modal.classList.add('show');
  
  try {
    const result = await api.get(`/docker/stacks/${stackId}/logs`);
    const formattedLogs = result.logs.map(log => 
      `=== ${log.containerName} ===\n${log.logs}\n`
    ).join('\n');
    logsContent.textContent = formattedLogs || 'No logs available';
  } catch (error) {
    logsContent.textContent = `Failed to load logs: ${error.message}`;
  }
};

let yamlEditor = null;

window.editStack = async function(stackId) {
  const modal = document.getElementById('edit-modal');
  
  modal.classList.add('show');
  modal.dataset.stackId = stackId;
  
  // Initialize Ace editor
  if (!yamlEditor) {
    yamlEditor = ace.edit('ace-editor');
    yamlEditor.setTheme('ace/theme/monokai');
    yamlEditor.session.setMode('ace/mode/yaml');
    yamlEditor.setOptions({
      fontSize: 14,
      showPrintMargin: false,
      highlightActiveLine: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      tabSize: 2,
      useSoftTabs: true,
      wrap: true,
      foldStyle: 'markbegin'
    });
    
    yamlEditor.on('change', validateYaml);
  }
  
  yamlEditor.setValue('Loading stack file...', -1);
  
  try {
    const result = await api.get(`/docker/stacks/${stackId}/file`);
    const content = result.content || '';
    
    // Auto-format the YAML content
    try {
      const parsed = jsyaml.load(content);
      const formatted = jsyaml.dump(parsed, {
        indent: 2,
        lineWidth: 80,
        noRefs: true,
        sortKeys: false
      });
      yamlEditor.setValue(formatted, -1);
    } catch {
      // If parsing fails, use original content
      yamlEditor.setValue(content, -1);
    }
    
    validateYaml();
  } catch (error) {
    yamlEditor.setValue(`# Failed to load stack file: ${error.message}`, -1);
  }
};

function validateYaml() {
  const errorDiv = document.getElementById('yaml-error');
  const statusDiv = document.getElementById('yaml-status');
  const saveBtn = document.getElementById('save-stack');
  
  try {
    jsyaml.load(yamlEditor.getValue());
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    statusDiv.textContent = '✓ Valid YAML';
    statusDiv.className = 'yaml-status valid';
    saveBtn.disabled = false;
  } catch (error) {
    errorDiv.textContent = `YAML Error: ${error.message}`;
    errorDiv.style.display = 'block';
    statusDiv.textContent = '✗ Invalid YAML';
    statusDiv.className = 'yaml-status invalid';
    saveBtn.disabled = true;
  }
}

function formatYaml() {
  try {
    const content = yamlEditor.getValue();
    const parsed = jsyaml.load(content);
    const formatted = jsyaml.dump(parsed, {
      indent: 2,
      lineWidth: 80,
      noRefs: true,
      sortKeys: false
    });
    yamlEditor.setValue(formatted, -1);
  } catch (error) {
    console.warn('Cannot format invalid YAML:', error.message);
  }
}

window.formatYaml = formatYaml;

window.saveStack = async function() {
  const modal = document.getElementById('edit-modal');
  const stackId = modal.dataset.stackId;
  const content = yamlEditor.getValue();
  
  try {
    await api.put(`/docker/stacks/${stackId}/file`, { content });
    showNotification('success', 'Stack file updated successfully');
    modal.classList.remove('show');
  } catch (error) {
    showNotification('error', `Failed to update stack: ${error.message}`);
  }
};

window.changeCountry = function(stackId, stackName) {
  const modal = document.getElementById('country-modal');
  modal.dataset.stackId = stackId;
  modal.dataset.stackName = stackName;
  modal.classList.add('show');
};

window.applyCountryChange = async function() {
  const modal = document.getElementById('country-modal');
  const country = document.getElementById('country-select').value;
  const stackId = modal.dataset.stackId;
  const stackName = modal.dataset.stackName;
  
  if (!country) {
    showNotification('error', 'Please select a country');
    return;
  }
  
  try {
    await api.post(`/docker/change-country/${stackId}`, { country });
    showNotification('success', `Country changed to ${country} for ${stackName}`);
    modal.classList.remove('show');
    setTimeout(loadStacks, 2000);
  } catch (error) {
    showNotification('error', `Failed to change country: ${error.message}`);
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