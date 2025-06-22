import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from './useAuth';

export function useModuleSettings<T>(module: string, defaults: T) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<T>(defaults);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setStatus('loading');
    const docRef = doc(db, 'settings', `${user.uid}_${module}`);
    const unsub = onSnapshot(docRef, { includeMetadataChanges: true }, (snap) => {
      if (snap.exists()) {
        setSettings({ ...defaults, ...snap.data() } as T);
      } else {
        setSettings(defaults);
      }
      setStatus('idle');
    }, (e) => {
      setError(e.message);
      setStatus('error');
    });
    return () => unsub();
  }, [user, module]);

  const saveSettings = async (updates: Partial<T>) => {
    if (!user) return;
    setStatus('saving');
    setError(null);
    try {
      const docRef = doc(db, 'settings', `${user.uid}_${module}`);
      const sanitized = Object.fromEntries(
        Object.entries(updates).filter(
          ([, v]) => v !== undefined && !(typeof v === 'number' && isNaN(v))
        )
      );
      await setDoc(docRef, { userId: user.uid, ...sanitized }, { merge: true });
      setStatus('saved');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  return { settings, status, error, saveSettings };
}
