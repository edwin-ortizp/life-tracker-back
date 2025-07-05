import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import Pages from 'vite-plugin-pages'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500, // Aumentar a 1.5MB para chart-vendor
    rollupOptions: {
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        manualChunks: {
          // Separar las dependencias de React
          'react-vendor': ['react', 'react-dom'],
          
          // Separar Firebase
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          
          // Separar librerías de UI pesadas
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-accordion'],
          
          // Separar librerías de gráficos
          'chart-vendor': ['recharts', 'lucide-react'],
          
          // Separar otras dependencias pesadas
          'utils-vendor': ['date-fns', 'clsx', 'class-variance-authority']
        }
      }
    }
  },
  base: '/life-tracker/',  // Cambiado para GitHub Pages
  server: {
    host: true
  },
  plugins: [
    react(),
    Pages({
      dirs: [{ dir: 'src/artifacts', baseRoute: '' }],
      extensions: ['jsx', 'tsx'],   
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: false // Deshabilitar PWA en desarrollo para evitar conflictos
      },
      strategies: 'injectManifest',
      srcDir: '.',
      filename: 'service-worker.ts',
      manifest: {
        name: 'Life Tracker',
        short_name: 'LifeTrack',
        description: 'Una aplicación integral para el seguimiento y mejora de la productividad personal',
        theme_color: '#3b82f6',
        start_url: '/life-tracker/',
        display: 'standalone',
        background_color: '#ffffff',
        orientation: 'portrait-primary',
        scope: '/life-tracker/',
        lang: 'es',
        id: '/life-tracker/',
        icons: [
          {
            src: '/life-tracker/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/life-tracker/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/life-tracker/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/life-tracker/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/life-tracker/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/life-tracker/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/life-tracker/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/life-tracker/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/life-tracker/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
    },
  }
})