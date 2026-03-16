import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'child_process'

const commitHash = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; } })();
const buildNumber = (() => { try { return execSync('git rev-list --count HEAD').toString().trim(); } catch { return '0'; } })();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'thumbnails/**/*'],
      manifest: {
        name: 'BIM Protector - Seguranca Eletronica',
        short_name: 'BIM Protector',
        description: 'Ferramenta profissional para projetos de seguranca eletronica',
        theme_color: '#046BD2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        categories: ['productivity', 'utilities', 'business']
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico,woff,woff2}'],
        runtimeCaching: [
          {
            // Supabase Auth/API — NEVER cache, always go to network directly
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
