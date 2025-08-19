import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    root: 'public',
    publicDir: 'assets',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: isProduction,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'public/index.html'),
        },
      },
    },
    plugins: [
      legacy({
        targets: ['defaults', 'not IE 11'],
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Pandora Box',
          short_name: 'PandoraBox',
          description: 'Pandora Box - Your Media Management Hub',
          theme_color: '#141414',
          icons: [
            {
              src: 'assets/icons/favicon.svg',
              sizes: '72x72',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'assets/icons/favicon.svg',
              sizes: '96x96',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'assets/icons/favicon.svg',
              sizes: '128x128',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'assets/icons/icon-144x144.svg',
              sizes: '144x144',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                }
              }
            },
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources'
              }
            },
            {
              urlPattern: /\/api\/.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-responses',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 5 * 60 // 5 minutes
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };
});