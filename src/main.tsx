import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ThemeProvider } from './themes/ThemeProvider';
import './index.css';
import './styles/pwa.css';

// Registrar el service worker con mejor manejo de errores
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      // Enviar mensaje al componente PWAStatus para mostrar notificación
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    },
    onOfflineReady() {
      console.log('La aplicación está lista para usar sin conexión');
      // Opcional: mostrar toast de confirmación
      window.dispatchEvent(new CustomEvent('sw-offline-ready'));
    },
    onRegisterError(error) {
      console.warn('Error al registrar el service worker:', error);
    },
    immediate: true
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/life-tracker">
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);