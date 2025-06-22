import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useAuth } from './useAuth'
import { db } from '@/firebase'
import { ThemeName } from '@/themes'

export interface UserSettings {
  name?: string
  birthDate?: string
  theme?: ThemeName
}

export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'settings', user.uid)
    const unsub = onSnapshot(ref, snap => {
      setSettings(snap.data() as UserSettings | null)
    })
    return unsub
  }, [user])

  const saveSettings = async (updates: UserSettings) => {
    if (!user) return
    const ref = doc(db, 'settings', user.uid)
    await setDoc(ref, { userId: user.uid, ...updates }, { merge: true })
  }

  return { settings, saveSettings }
}
