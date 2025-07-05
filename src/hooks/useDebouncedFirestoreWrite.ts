import { useCallback, useRef } from 'react';

/**
 * Hook para implementar debouncing en operaciones de escritura a Firestore
 * Evita escrituras excesivas agrupando múltiples cambios en una sola operación
 */
export const useDebouncedFirestoreWrite = <T>(
  writeFunction: (data: T) => Promise<void>,
  delay: number = 2000
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingDataRef = useRef<T | null>(null);

  const debouncedWrite = useCallback(
    (data: T) => {
      // Guardar los datos más recientes
      pendingDataRef.current = data;

      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Configurar nuevo timeout
      timeoutRef.current = setTimeout(async () => {
        if (pendingDataRef.current) {
          try {
            await writeFunction(pendingDataRef.current);
            pendingDataRef.current = null;
          } catch (error) {
            console.error('Error in debounced write:', error);
          }
        }
      }, delay);
    },
    [writeFunction, delay]
  );

  // Función para forzar escritura inmediata
  const flushPendingWrite = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (pendingDataRef.current) {
      try {
        await writeFunction(pendingDataRef.current);
        pendingDataRef.current = null;
      } catch (error) {
        console.error('Error in flush write:', error);
      }
    }
  }, [writeFunction]);

  // Limpiar timeout al desmontar
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    debouncedWrite,
    flushPendingWrite,
    cleanup,
    hasPendingWrite: () => pendingDataRef.current !== null
  };
};

/**
 * Versión específica para actualizaciones de documentos con merge
 */
export const useDebouncedDocumentUpdate = (
  updateFunction: (updates: Record<string, any>) => Promise<void>,
  delay: number = 2000
) => {
  const pendingUpdatesRef = useRef<Record<string, any>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback(
    (updates: Record<string, any>) => {
      // Fusionar con actualizaciones pendientes
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates
      };

      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Configurar nuevo timeout
      timeoutRef.current = setTimeout(async () => {
        if (Object.keys(pendingUpdatesRef.current).length > 0) {
          try {
            await updateFunction(pendingUpdatesRef.current);
            pendingUpdatesRef.current = {};
          } catch (error) {
            console.error('Error in debounced document update:', error);
          }
        }
      }, delay);
    },
    [updateFunction, delay]
  );

  const flushPendingUpdates = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      try {
        await updateFunction(pendingUpdatesRef.current);
        pendingUpdatesRef.current = {};
      } catch (error) {
        console.error('Error in flush updates:', error);
      }
    }
  }, [updateFunction]);

  return {
    debouncedUpdate,
    flushPendingUpdates,
    hasPendingUpdates: () => Object.keys(pendingUpdatesRef.current).length > 0
  };
};

/**
 * Hook para agrupar múltiples operaciones de escritura en batches
 */
export const useBatchedWrites = <T>(
  writeFunction: (items: T[]) => Promise<void>,
  batchSize: number = 10,
  delay: number = 1000
) => {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addToBatch = useCallback(
    (item: T) => {
      batchRef.current.push(item);

      // Si alcanzamos el tamaño del batch, escribir inmediatamente
      if (batchRef.current.length >= batchSize) {
        flushBatch();
        return;
      }

      // Si no, configurar timeout para escribir después del delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        flushBatch();
      }, delay);
    },
    [batchSize, delay]
  );

  const flushBatch = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (batchRef.current.length > 0) {
      try {
        await writeFunction([...batchRef.current]);
        batchRef.current = [];
      } catch (error) {
        console.error('Error in batch write:', error);
      }
    }
  }, [writeFunction]);

  return {
    addToBatch,
    flushBatch,
    batchSize: () => batchRef.current.length
  };
};

export default useDebouncedFirestoreWrite;
