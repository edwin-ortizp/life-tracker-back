import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import { ThemeName } from '@/themes'

export interface UserSettings {
  fullName?: string
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
        .from('profiles')
        .select('full_name, birth_date, theme')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError
      }

      setSettings(data ? {
        fullName: data.full_name,
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
        id: user.id,
      }

      if (updates.fullName !== undefined) dbData.full_name = updates.fullName
      if (updates.birthDate !== undefined) dbData.birth_date = updates.birthDate
      if (updates.theme !== undefined) dbData.theme = updates.theme

      const { error: upsertError } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', user.id)

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
