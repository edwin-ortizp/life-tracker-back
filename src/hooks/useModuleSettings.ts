import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from './useAuth';
import { firestoreLogger } from '@/utils/firestore-logger';

// Cache global para settings ya cargados
const settingsCache = new Map<string, any>();
const loadingCache = new Map<string, Promise<any>>();

export function useModuleSettings<T>(module: string, defaults: T) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<T>(defaults);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Load settings with caching to prevent unnecessary reads
  const loadSettings = useCallback(async () => {
    if (!user || hasLoadedRef.current) return;
    
    const cacheKey = `${user.uid}_${module}`;
    
    // Check if already cached
    if (settingsCache.has(cacheKey)) {
      const cachedSettings = settingsCache.get(cacheKey);
      setSettings({ ...defaults, ...cachedSettings } as T);
      hasLoadedRef.current = true;
      return;
    }
    
    // Check if already loading
    if (loadingCache.has(cacheKey)) {
      try {
        const result = await loadingCache.get(cacheKey);
        setSettings({ ...defaults, ...result } as T);
        hasLoadedRef.current = true;
        return;
      } catch (e) {
        // Continue to load if promise failed
      }
    }
    
    setStatus('loading');
    setError(null);
    
    // Create loading promise
    const loadingPromise = (async () => {
      try {
        const docRef = doc(db, 'settings', cacheKey);
        firestoreLogger.logRead('settings', 'useModuleSettings.loadSettings', cacheKey);
        const snap = await getDoc(docRef);
        
        const result = snap.exists() ? snap.data() : {};
        
        // Cache the result
        settingsCache.set(cacheKey, result);
        loadingCache.delete(cacheKey);
        
        return result;
      } catch (e) {
        loadingCache.delete(cacheKey);
        throw e;
      }
    })();
    
    loadingCache.set(cacheKey, loadingPromise);
    
    try {
      const result = await loadingPromise;
      setSettings({ ...defaults, ...result } as T);
      setStatus('idle');
      hasLoadedRef.current = true;
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [user, module]); // Removed defaults from dependencies

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (updates: Partial<T>) => {
    if (!user) return;
    
    setStatus('saving');
    setError(null);
    
    // Save previous state for rollback
    const previousSettings = settings;
    const cacheKey = `${user.uid}_${module}`;
    
    try {
      // Optimistic update: update UI immediately
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      setStatus('saved');
      
      const docRef = doc(db, 'settings', cacheKey);
      const sanitized = Object.fromEntries(
        Object.entries(updates).filter(
          ([, v]) => v !== undefined && !(typeof v === 'number' && isNaN(v))
        )
      );
      
      firestoreLogger.logWrite('settings', 'useModuleSettings.saveSettings', cacheKey);
      await setDoc(docRef, { userId: user.uid, ...sanitized }, { merge: true });
      
      // Update cache with new settings
      const currentCache = settingsCache.get(cacheKey) || {};
      settingsCache.set(cacheKey, { ...currentCache, ...sanitized });
      
    } catch (e: any) {
      // Rollback on error
      setSettings(previousSettings);
      setError(e.message);
      setStatus('error');
      throw e;
    }
  };

  return { settings, status, error, saveSettings, refetch: loadSettings };
}
