import { useEffect, useState } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    // Detectar actualizaciones de SW
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Escuchar actualizaciones del service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          handleSWUpdate();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  return (
    <>
      {/* Status indicator in header */}
      <div className="fixed top-4 right-4 z-50">
        {!isOnline && (
          <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* Offline message */}
      {showOfflineMessage && (
        <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-orange-50 border border-orange-200 rounded-lg p-3 z-50 animate-in slide-in-from-top-5">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-orange-600" />
            <span className="text-orange-800 text-sm font-medium">
              Sin conexión
            </span>
          </div>
          <p className="text-orange-700 text-xs mt-1">
            Trabajando en modo offline. Los datos se sincronizarán cuando vuelvas a conectarte.
          </p>
        </div>
      )}

      {/* Update available message */}
      {updateAvailable && (
        <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-50 border border-blue-200 rounded-lg p-3 z-50 animate-in slide-in-from-top-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 text-sm font-medium">
              Actualización disponible
            </span>
          </div>
          <p className="text-blue-700 text-xs mt-1">
            Hay una nueva versión disponible.
          </p>
          <Button
            size="sm"
            onClick={handleUpdate}
            className="mt-2 text-xs px-3 py-1 h-auto"
          >
            Actualizar
          </Button>
        </div>
      )}
    </>
  );
};

export default PWAStatus;
