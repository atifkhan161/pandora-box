/**
 * Toast Notification Service
 * Provides toast-style notifications for user feedback
 */

class ToastService {
  constructor() {
    this.container = null;
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show toast notification
   * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
   * @param {string} message - Toast message
   * @param {number} duration - Duration in milliseconds (default: 4000)
   */
  show(type, message, duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = this.getIcon(type);
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Get icon for toast type
   * @param {string} type - Toast type
   * @returns {string} Icon HTML
   */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type] || icons.info;
  }

  /**
   * Show success toast
   * @param {string} message - Success message
   */
  success(message) {
    this.show('success', message);
  }

  /**
   * Show error toast
   * @param {string} message - Error message
   */
  error(message) {
    this.show('error', message);
  }

  /**
   * Show info toast
   * @param {string} message - Info message
   */
  info(message) {
    this.show('info', message);
  }

  /**
   * Show warning toast
   * @param {string} message - Warning message
   */
  warning(message) {
    this.show('warning', message);
  }
}

// Create and export singleton instance
const toast = new ToastService();
export default toast;