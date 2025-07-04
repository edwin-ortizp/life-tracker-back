import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useAuth } from './useAuth'
import { db } from '@/firebase'
import { ThemeName } from '@/themes'
import { firestoreLogger } from '@/utils/firestore-logger'

export interface UserSettings {
  name?: string
  birthDate?: string
  theme?: ThemeName
}

export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load settings once (single-load pattern)
  const loadSettings = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const ref = doc(db, 'settings', user.uid)
      firestoreLogger.logRead('settings', 'useUserSettings.loadSettings', user.uid)
      const snap = await getDoc(ref)
      setSettings(snap.exists() ? snap.data() as UserSettings : null)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading settings')
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const saveSettings = async (updates: UserSettings) => {
    if (!user) return
    
    // Save previous state for rollback
    const previousSettings = settings
    
    try {
      // Optimistic update: update UI immediately
      const newSettings = { ...settings, ...updates }
      setSettings(newSettings)
      
      const ref = doc(db, 'settings', user.uid)
      firestoreLogger.logWrite('settings', 'useUserSettings.saveSettings', user.uid)
      await setDoc(ref, { userId: user.uid, ...updates }, { merge: true })
    } catch (err) {
      // Rollback on error
      setSettings(previousSettings)
      setError(err instanceof Error ? err.message : 'Error saving settings')
      throw err
    }
  }

  return { settings, loading, error, saveSettings, refetch: loadSettings }
}
