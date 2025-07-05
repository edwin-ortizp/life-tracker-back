import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from './button';
import { clearOfflineCache } from '@/firebase';

interface FirestoreErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  showClearCache?: boolean;
}

export const FirestoreErrorHandler: React.FC<FirestoreErrorHandlerProps> = ({
  error,
  onRetry,
  showClearCache = false
}) => {
  const isInternalError = error?.includes('sincronización') || 
                         error?.includes('INTERNAL ASSERTION') ||
                         error?.includes('Unexpected state');

  const handleClearCache = async () => {
    try {
      await clearOfflineCache();
    } catch (err) {
      console.error('Error clearing cache:', err);
      alert('Error al limpiar el cache. Intenta recargar la página manualmente.');
    }
  };

  if (!error) return null;

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 text-red-600 mb-2">
        <AlertTriangle className="w-5 h-5" />
        <span className="text-sm font-medium">Error de sincronización</span>
      </div>
      
      <p className="text-sm text-red-600 mb-3">{error}</p>
      
      <div className="flex gap-2">
        {onRetry && (
          <Button
            type="button"
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reintentar
          </Button>
        )}
        
        {(isInternalError || showClearCache) && (
          <Button
            type="button"
            onClick={handleClearCache}
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpiar Cache
          </Button>
        )}
      </div>
      
      {isInternalError && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Sugerencia:</strong> Este error suele ocurrir cuando hay conflictos entre 
            datos guardados offline y en el servidor. Limpiar el cache ayudará a resolver 
            el problema, aunque tendrás que volver a sincronizar tus datos.
          </p>
        </div>
      )}
    </div>
  );
};

export default FirestoreErrorHandler;