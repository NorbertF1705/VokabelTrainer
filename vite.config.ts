import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: "Norbert's VokabelTrainer",
        short_name: "Norbert's VokabelTrainer",
        description: 'Lerne Vokabeln mit dem Phase-6-Lernkartei-System',
        theme_color: '#2D1B69',
        background_color: '#F0EAFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Precache alle statischen App-Assets → Workbox bedient diese automatisch CacheFirst
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // SW übernimmt sofort die Kontrolle über alle offenen Tabs (wichtig auf iOS)
        clientsClaim: true,
        skipWaiting: true,

        // SPA-Navigation: immer index.html aus dem Precache liefern (Offline-fähig)
        navigateFallback: 'index.html',
        // Nur lokale Navigation-Requests abfangen, keine externen URLs
        navigateFallbackDenylist: [/^\/api\//, /^\/cdn-cgi\//],

        runtimeCaching: [
          {
            // JS / CSS / Fonts / Bilder → CacheFirst: zuerst Cache, Netz nur wenn fehlt
            urlPattern: /\.(?:js|css|woff2?|ttf|otf|eot|png|svg|ico|jpg|jpeg|webp|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-v1',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Jahr
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // HTML-Dokumente → NetworkFirst: aktuelle Version bevorzugen, Cache als Fallback
            urlPattern: /\.html$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache-v1',
              networkTimeoutSeconds: 5, // Nach 5s auf Cache zurückfallen (iOS offline/schlechtes Netz)
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Tage
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
