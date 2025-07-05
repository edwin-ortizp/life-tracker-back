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

// Inicializar diagnósticos de Firestore en desarrollo
if (import.meta.env.DEV) {
  // Iniciar diagnóstico automáticamente
  FirestoreWriteDiagnostic.startDiagnostic();
  
  // Hacer disponible globalmente para debugging
  (window as any).FirestoreWriteDiagnostic = FirestoreWriteDiagnostic;
  (window as any).firestoreWriteMonitor = firestoreWriteMonitor;
  
  console.log('🔍 Diagnóstico de Firestore activado');
  console.log('💡 Usa FirestoreWriteDiagnostic.getReport() para ver estadísticas');
  console.log('💡 Usa firestoreWriteMonitor.getStats() para stats del monitor');
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