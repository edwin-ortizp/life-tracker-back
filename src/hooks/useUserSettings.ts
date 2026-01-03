import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import { ThemeName } from '@/themes'

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
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError
      }

      setSettings(data ? {
        name: data.name,
        birthDate: data.birth_date,
        theme: data.theme
      } : null)
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

      // Map camelCase to snake_case for Supabase
      const dbData: any = {
        user_id: user.id,
      }

      if (updates.name !== undefined) dbData.name = updates.name
      if (updates.birthDate !== undefined) dbData.birth_date = updates.birthDate
      if (updates.theme !== undefined) dbData.theme = updates.theme

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert(dbData, { onConflict: 'user_id' })

      if (upsertError) throw upsertError
    } catch (err) {
      // Rollback on error
      setSettings(previousSettings)
      setError(err instanceof Error ? err.message : 'Error saving settings')
      throw err
    }
  }

  return { settings, loading, error, saveSettings, refetch: loadSettings }
}
