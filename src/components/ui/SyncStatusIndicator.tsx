import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { clearOfflineCache } from '@/firebase';
import { toast } from 'sonner';

interface SyncStatusIndicatorProps {
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar si hay datos offline pendientes
    const checkOfflineData = () => {
      try {
        // Verificar si IndexedDB tiene datos pendientes de sincronización
        const hasData = localStorage.getItem('firestore_pending_writes');
        setHasOfflineData(!!hasData);
      } catch (error) {
        console.error('Error checking offline data:', error);
      }
    };

    checkOfflineData();
    const interval = setInterval(checkOfflineData, 300000); // Verificar cada 5 minutos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleClearCache = async () => {
    try {
      await clearOfflineCache();
      toast.success('Cache offline limpiado correctamente');
      setHasOfflineData(false);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Error al limpiar el cache');
    }
  };

  const getStatusColor = () => {
    if (!isOnline && hasOfflineData) return 'text-yellow-600';
    if (!isOnline) return 'text-orange-600';
    if (hasOfflineData) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!isOnline && hasOfflineData) return <AlertTriangle className="w-4 h-4" />;
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (hasOfflineData) return <Wifi className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline && hasOfflineData) return 'Offline - Datos pendientes';
    if (!isOnline) return 'Offline';
    if (hasOfflineData) return 'Sincronizando...';
    return 'Conectado';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
      
      {(hasOfflineData || !isOnline) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearCache}
          className="text-xs px-2 py-1 h-auto"
          title="Limpiar cache offline"
        >
          Limpiar Cache
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;