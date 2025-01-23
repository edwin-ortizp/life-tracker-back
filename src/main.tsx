import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Registrar el service worker con actualización automática
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible. ¿Actualizar?')) {
      updateSW();
    }
  },
  onOfflineReady() {
    console.log('La aplicación está lista para usar sin conexión');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/life-tracker">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);