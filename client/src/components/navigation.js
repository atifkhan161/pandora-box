/**
 * Reusable Side Navigation Component
 * This component provides a consistent navigation experience across the application
 */

import auth from '../services/auth.js';

export class Navigation {
  constructor(activeLink = '') {
    this.activeLink = activeLink;
  }

  /**
   * Render the navigation component
   * @returns {HTMLElement} The navigation element
   */
  render() {
    // Create navigation container
    const nav = document.createElement('nav');
    nav.className = 'side-nav';
    nav.id = 'side-nav';

    // Create header
    const header = document.createElement('div');
    header.className = 'nav-header';
    header.innerHTML = '<h1>Pandora Box</h1>';
    nav.appendChild(header);

    // Create navigation links
    const links = document.createElement('ul');
    links.className = 'nav-links';

    // Define navigation items
    const navItems = [
      { href: 'dashboard.html', text: 'Dashboard' },
      { href: 'movies.html', text: 'Movies' },
      { href: 'tvshows.html', text: 'TV Shows' },
      { href: 'search.html', text: 'Search' },
      { href: 'downloads.html', text: 'Downloads' },
      { href: 'files.html', text: 'File Management' },
      { href: 'jellyfin.html', text: 'Jellyfin' },
      { href: 'docker.html', text: 'Docker Manager' },
      { href: 'settings.html', text: 'Settings' }
    ];

    // Create navigation items
    navItems.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      
      // Set active class if current page
      if (window.location.pathname.includes(item.href)) {
        a.className = 'active';
      }
      
      a.textContent = item.text;
      li.appendChild(a);
      links.appendChild(li);
    });

    // Add logout button
    const logoutLi = document.createElement('li');
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
    logoutLi.appendChild(logoutBtn);
    links.appendChild(logoutLi);

    nav.appendChild(links);
    return nav;
  }

  /**
   * Initialize the navigation component
   * @param {string} containerId - The ID of the container element
   */
  static init(containerId = 'app') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get current page
    const currentPath = window.location.pathname;
    let activeLink = '';
    
    if (currentPath.includes('dashboard.html')) {
      activeLink = 'dashboard';
    } else if (currentPath.includes('movies.html')) {
      activeLink = 'movies';
    } else if (currentPath.includes('tvshows.html')) {
      activeLink = 'tvshows';
    } else if (currentPath.includes('search.html')) {
      activeLink = 'search';
    } else if (currentPath.includes('downloads.html')) {
      activeLink = 'downloads';
    } else if (currentPath.includes('files.html')) {
      activeLink = 'files';
    } else if (currentPath.includes('jellyfin.html')) {
      activeLink = 'jellyfin';
    } else if (currentPath.includes('docker.html')) {
      activeLink = 'docker';
    } else if (currentPath.includes('settings.html')) {
      activeLink = 'settings';
    }

    // Create navigation
    const navigation = new Navigation(activeLink);
    
    // Insert navigation as first child of container
    if (container.firstChild) {
      container.insertBefore(navigation.render(), container.firstChild);
    } else {
      container.appendChild(navigation.render());
    }

    // Add app-with-nav class to container
    container.classList.add('app-with-nav');
    
    // Create hamburger menu button
    this.createHamburgerMenu(container);
  }
  
  /**
   * Create hamburger menu button
   * @param {HTMLElement} container - The container element
   */
  static createHamburgerMenu(container) {
    // Create header with hamburger button
    const header = document.createElement('div');
    header.className = 'app-header';
    
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.innerHTML = '☰';
    hamburger.addEventListener('click', this.toggleNavigation);
    
    header.appendChild(hamburger);
    container.insertBefore(header, container.firstChild);
  }
  
  /**
   * Toggle navigation visibility
   */
  static toggleNavigation() {
    const nav = document.getElementById('side-nav');
    if (nav) {
      nav.classList.toggle('nav-open');
    }
  }
}

// Export default instance
export default Navigation;