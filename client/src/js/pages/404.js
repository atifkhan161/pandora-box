export default {
  path: '(.*)',
  template: `
    <div class="page" data-name="not-found">
      <div class="navbar">
        <div class="navbar-bg"></div>
        <div class="navbar-inner sliding">
          <div class="left">
            <a href="#" class="link back">
              <i class="f7-icons">chevron_left</i>
              <span class="back-text">Back</span>
            </a>
          </div>
          <div class="title">Page Not Found</div>
        </div>
      </div>

      <div class="page-content">
        <div class="block block-strong text-align-center">
          <div class="not-found-content">
            <i class="f7-icons" style="font-size: 120px; color: var(--f7-color-red); margin-bottom: 24px;">exclamationmark_triangle</i>
            
            <h1 style="margin-bottom: 16px; color: var(--f7-text-color);">404</h1>
            <h2 style="margin-bottom: 24px; color: var(--f7-text-color);">Page Not Found</h2>
            
            <p style="margin-bottom: 32px; color: var(--f7-color-gray);">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            
            <div class="not-found-actions">
              <a href="/" class="button button-fill color-red" style="margin-bottom: 16px;">
                <i class="f7-icons">house</i> Go to Dashboard
              </a>
              
              <a href="#" class="button button-outline" onclick="history.back()">
                <i class="f7-icons">chevron_left</i> Go Back
              </a>
            </div>
          </div>
        </div>
        
        <!-- Quick Navigation -->
        <div class="block-title">Quick Navigation</div>
        <div class="list">
          <ul>
            <li>
              <a href="/" class="item-link">
                <div class="item-content">
                  <div class="item-media">
                    <i class="icon f7-icons">house</i>
                  </div>
                  <div class="item-inner">
                    <div class="item-title">Dashboard</div>
                    <div class="item-after">
                      <i class="f7-icons">chevron_right</i>
                    </div>
                  </div>
                </div>
              </a>
            </li>
            <li>
              <a href="/search/" class="item-link">
                <div class="item-content">
                  <div class="item-media">
                    <i class="icon f7-icons">search</i>
                  </div>
                  <div class="item-inner">
                    <div class="item-title">Search Media</div>
                    <div class="item-after">
                      <i class="f7-icons">chevron_right</i>
                    </div>
                  </div>
                </div>
              </a>
            </li>
            <li>
              <a href="/downloads/" class="item-link">
                <div class="item-content">
                  <div class="item-media">
                    <i class="icon f7-icons">arrow_down_circle</i>
                  </div>
                  <div class="item-inner">
                    <div class="item-title">Downloads</div>
                    <div class="item-after">
                      <i class="f7-icons">chevron_right</i>
                    </div>
                  </div>
                </div>
              </a>
            </li>
            <li>
              <a href="/files/" class="item-link">
                <div class="item-content">
                  <div class="item-media">
                    <i class="icon f7-icons">folder</i>
                  </div>
                  <div class="item-inner">
                    <div class="item-title">File Manager</div>
                    <div class="item-after">
                      <i class="f7-icons">chevron_right</i>
                    </div>
                  </div>
                </div>
              </a>
            </li>
            <li>
              <a href="/settings/" class="item-link">
                <div class="item-content">
                  <div class="item-media">
                    <i class="icon f7-icons">gear</i>
                  </div>
                  <div class="item-inner">
                    <div class="item-title">Settings</div>
                    <div class="item-after">
                      <i class="f7-icons">chevron_right</i>
                    </div>
                  </div>
                </div>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  on: {
    pageInit: function () {
      console.log('404 page initialized')
      
      // Log the attempted URL for debugging
      const currentUrl = window.location.href
      console.warn('404 - Page not found:', currentUrl)
      
      // Optional: Send analytics or error logging
      if (window.gtag) {
        window.gtag('event', 'page_not_found', {
          page_location: currentUrl,
          page_title: '404 - Page Not Found'
        })
      }
    }
  }
}