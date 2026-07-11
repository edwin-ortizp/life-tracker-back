/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Manejo de errores global para el service worker
self.addEventListener('error', (event) => {
  console.warn('Service Worker error:', event.error);
});

// Manejo de errores para promises no capturadas
self.addEventListener('unhandledrejection', (event) => {
  console.warn('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});

// Precache todos los assets generados por Vite
precacheAndRoute(self.__WB_MANIFEST);

// Cache para las fuentes de Google
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

// Cache para archivos estáticos de fuentes
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

// Cache para las rutas de la API
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// Por defecto, usa Network First para el resto de rutas
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
      }),
    ],
  })
);

// Enfocar la aplicación cuando el usuario hace clic en una notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/life-tracker/');
      }
    })
  );
});

// Manejo de mensajes para evitar errores de message port
self.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
      return;
    }
    
    // Responder a otros mensajes si es necesario
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  } catch (error) {
    console.warn('Error handling message:', error);
    // Intentar responder con error si hay un puerto disponible
    if (event.ports && event.ports[0]) {
      try {
        event.ports[0].postMessage({ success: false, error: error.message });
      } catch (portError) {
        console.warn('Error sending response through message port:', portError);
      }
    }
  }
});
