import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from './useAuth';
import { firestoreLogger } from '@/utils/firestore-logger';

export function useModuleSettings<T>(module: string, defaults: T) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<T>(defaults);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Load settings once (single-load pattern)
  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    setStatus('loading');
    setError(null);
    
    try {
      const docRef = doc(db, 'settings', `${user.uid}_${module}`);
      firestoreLogger.logRead('settings', 'useModuleSettings.loadSettings', `${user.uid}_${module}`);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        setSettings({ ...defaults, ...snap.data() } as T);
      } else {
        setSettings(defaults);
      }
      setStatus('idle');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [user, module, defaults]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (updates: Partial<T>) => {
    if (!user) return;
    
    setStatus('saving');
    setError(null);
    
    // Save previous state for rollback
    const previousSettings = settings;
    
    try {
      // Optimistic update: update UI immediately
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      setStatus('saved');
      
      const docRef = doc(db, 'settings', `${user.uid}_${module}`);
      const sanitized = Object.fromEntries(
        Object.entries(updates).filter(
          ([, v]) => v !== undefined && !(typeof v === 'number' && isNaN(v))
        )
      );
      
      firestoreLogger.logWrite('settings', 'useModuleSettings.saveSettings', `${user.uid}_${module}`);
      await setDoc(docRef, { userId: user.uid, ...sanitized }, { merge: true });
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
