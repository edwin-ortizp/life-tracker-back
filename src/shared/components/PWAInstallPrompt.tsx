import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/shared/hooks/useResponsive';

const PWAInstallPrompt = () => {
  const { canInstall, promptInstall, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Mostrar el prompt después de un delay si puede instalar y no está instalada
    if (canInstall && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // Mostrar después de 10 segundos

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, dismissed]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Recordar que el usuario rechazó la instalación por esta sesión
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // No mostrar si está instalada, no puede instalar, fue rechazada o ya fue rechazada en esta sesión
  if (isInstalled || !canInstall || !showPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            Instalar Life Tracker
          </h3>
          <p className="text-gray-600 text-xs mt-1">
            Instala la app para un acceso más rápido y funciones offline.
          </p>
          
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstall}
              className="text-xs px-3 py-1 h-auto"
            >
              Instalar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs px-3 py-1 h-auto"
            >
              Ahora no
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 h-auto w-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
