import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ThemeProvider } from './themes/ThemeProvider';
import FirestoreWriteDiagnostic from './utils/firestore-diagnostic';
import { firestoreWriteMonitor } from './utils/firestore-write-monitor';
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
      // Opcional: mostrar toast de confirmación
      window.dispatchEvent(new CustomEvent('sw-offline-ready'));
    },
    onRegisterError(error) {
    },
    immediate: true
  });
}

// Inicializar diagnósticos de Firestore en desarrollo
if (import.meta.env.DEV) {
  // Iniciar diagnóstico automáticamente
  FirestoreWriteDiagnostic.startDiagnostic();
  
  // Hacer disponible globalmente para debugging
  (window as any).FirestoreWriteDiagnostic = FirestoreWriteDiagnostic;
  (window as any).firestoreWriteMonitor = firestoreWriteMonitor;
  
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