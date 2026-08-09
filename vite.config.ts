import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://snmln.github.io/finger-training/ via GitHub Pages,
// so all root-relative asset/manifest paths need this subpath prefix.
// If a custom domain is ever wired up at the repo root, this (and the
// manifest's start_url/scope below) should become '/'.
const base = '/finger-training/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Grip Tracker',
        short_name: 'Grip Tracker',
        description: 'Track climbing finger and grip strength training — hangboard sets, weight, and progress, all stored on-device.',
        theme_color: '#16181A',
        background_color: '#16181A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
