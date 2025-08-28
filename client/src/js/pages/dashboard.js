/**
 * Dashboard Page Controller
 * Vanilla JavaScript implementation
 */
import BasePage from './base-page.js';

class DashboardPage extends BasePage {
  constructor() {
    super();
    this.templatePath = '/src/pages/dashboard.html';
  }

  /**
   * Setup page-specific logic
   */
  async setupPage() {
    this.setTitle('Dashboard');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Logout button handler
    const logoutBtn = this.querySelector('#logout-btn');
    if (logoutBtn) {
      this.addEventListener(logoutBtn, 'click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Demo features button
    const demoBtn = this.querySelector('#demo-features-btn');
    if (demoBtn) {
      this.addEventListener(demoBtn, 'click', () => {
        this.showDemoFeatures();
      });
    }

    // Refresh button
    const refreshBtn = this.querySelector('#refresh-btn');
    if (refreshBtn) {
      this.addEventListener(refreshBtn, 'click', () => {
        this.refresh();
      });
    }
  }

  /**
   * Load initial data
   */
  async loadData() {
    try {
      // Load dashboard data here
      // This will be expanded in later tasks
      console.log('Loading dashboard data...');
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI with loaded data
      this.updateDashboardStats();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showError('Failed to load dashboard data');
    }
  }

  /**
   * Update dashboard statistics
   */
  updateDashboardStats() {
    const statsContainer = this.querySelector('.dashboard-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <h3>Active Downloads</h3>
          <p class="stat-number">0</p>
        </div>
        <div class="stat-card">
          <h3>Total Files</h3>
          <p class="stat-number">0</p>
        </div>
        <div class="stat-card">
          <h3>Running Containers</h3>
          <p class="stat-number">0</p>
        </div>
        <div class="stat-card">
          <h3>Storage Used</h3>
          <p class="stat-number">0 GB</p>
        </div>
      `;
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      this.showLoading('Logging out...');

      // Disconnect WebSocket
      if (window.wsClient) {
        window.wsClient.disconnect();
      }

      // Perform logout
      if (window.authStore) {
        await window.authStore.logout();
      }

      this.hideLoading();

      // Show success message
      this.showSuccessToast('Logged out successfully');

      // Redirect to login
      setTimeout(() => {
        if (window.router) {
          window.router.navigate('/login');
        }
      }, 1000);

    } catch (error) {
      console.error('Logout error:', error);
      this.hideLoading();
      this.showError('Error during logout');
    }
  }

  /**
   * Show demo features
   */
  showDemoFeatures() {
    const features = [
      'Media Discovery',
      'Download Management', 
      'File Operations',
      'Container Control',
      'Jellyfin Integration'
    ];

    const featuresHtml = features.map(feature => 
      `<li class="feature-item">${feature}</li>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'demo-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Pandora Box Features</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Available features in Pandora Box:</p>
          <ul class="features-list">
            ${featuresHtml}
          </ul>
        </div>
      </div>
    `;

    // Add close functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Show success toast
   */
  showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Post-render hook
   */
  onRender() {
    // Add any post-render logic here
    console.log('Dashboard page rendered');
  }
}

export default DashboardPage;