import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/core/supabase';
import { useAuth } from './useAuth';

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

    const cacheKey = `${user.id}_${module}`;

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
        const { data, error: fetchError } = await supabase
          .from('module_settings')
          .select('settings')
          .eq('user_id', user.id)
          .eq('module', module)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw fetchError;
        }

        const result = data?.settings || {};

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
    const cacheKey = `${user.id}_${module}`;

    try {
      // Optimistic update: update UI immediately
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      setStatus('saved');

      const sanitized = Object.fromEntries(
        Object.entries(updates).filter(
          ([, v]) => v !== undefined && !(typeof v === 'number' && isNaN(v))
        )
      );

      // Get current settings from DB to merge
      const currentCache = settingsCache.get(cacheKey) || {};
      const mergedSettings = { ...currentCache, ...sanitized };

      const { error: upsertError } = await supabase
        .from('module_settings')
        .upsert({
          user_id: user.id,
          module: module,
          settings: mergedSettings
        }, { onConflict: 'user_id,module' });

      if (upsertError) throw upsertError;

      // Update cache with new settings
      settingsCache.set(cacheKey, mergedSettings);

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
