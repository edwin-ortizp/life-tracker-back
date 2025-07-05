import { useEffect } from 'react';
import { isFirestoreInternalError, clearOfflineCache } from '@/firebase';
import { toast } from 'sonner';

// Hook para manejar errores globales de Firestore
export const useFirestoreErrorHandler = () => {
  useEffect(() => {
    // Escuchar errores no manejados de Firestore
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isFirestoreInternalError(event.reason)) {
        console.error('Unhandled Firestore internal error:', event.reason);
        
        toast.error('Error de sincronización detectado', {
          description: 'Hay un problema con la sincronización offline. Puedes intentar limpiar el cache.',
          action: {
            label: 'Limpiar Cache',
            onClick: async () => {
              try {
                await clearOfflineCache();
                toast.success('Cache limpiado correctamente');
              } catch (error) {
                console.error('Error clearing cache:', error);
                toast.error('Error al limpiar el cache. Recarga la página manualmente.');
              }
            }
          },
          duration: 10000 // 10 segundos para dar tiempo a actuar
        });
        
        // Prevenir que el error se propague
        event.preventDefault();
      }
    };

    // Agregar listener para errores no manejados
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Función utilitaria para manejar errores de forma consistente
  const handleFirestoreError = (error: any, fallbackMessage: string = 'Error de sincronización') => {
    if (isFirestoreInternalError(error)) {
      return {
        isInternalError: true,
        message: 'Error de sincronización detectado. La operación puede haberse completado pero hay problemas con el cache local.',
        shouldShowClearCache: true
      };
    }

    return {
      isInternalError: false,
      message: error instanceof Error ? error.message : fallbackMessage,
      shouldShowClearCache: false
    };
  };

  return {
    handleFirestoreError,
    clearOfflineCache
  };
};

export default useFirestoreErrorHandler;