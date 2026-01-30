import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'
import { ThemeName } from '@/themes'

export interface UserSettings {
  name?: string
  birthDate?: string
  theme?: ThemeName
  lifeExpectancyYears?: number
}

export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const columnMapRef = useRef<{ nameKey?: string; birthKey?: string; themeKey?: string; expectancyKey?: string }>({})

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
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError
      }

      if (data) {
        const nameKey = Object.prototype.hasOwnProperty.call(data, 'full_name')
          ? 'full_name'
          : (Object.prototype.hasOwnProperty.call(data, 'name') ? 'name' : undefined)
        const birthKey = Object.prototype.hasOwnProperty.call(data, 'birth_date')
          ? 'birth_date'
          : (Object.prototype.hasOwnProperty.call(data, 'birthDate') ? 'birthDate' : undefined)
        const themeKey = Object.prototype.hasOwnProperty.call(data, 'theme') ? 'theme' : undefined
        const expectancyKey = Object.prototype.hasOwnProperty.call(data, 'life_expectancy_years')
          ? 'life_expectancy_years'
          : (Object.prototype.hasOwnProperty.call(data, 'lifeExpectancyYears') ? 'lifeExpectancyYears' : undefined)

        columnMapRef.current = { nameKey, birthKey, themeKey, expectancyKey }

        setSettings({
          name: (nameKey ? data[nameKey] : undefined) ?? undefined,
          birthDate: (birthKey ? data[birthKey] : undefined) ?? undefined,
          theme: (themeKey ? data[themeKey] : undefined) ?? undefined,
          lifeExpectancyYears: (expectancyKey ? data[expectancyKey] : undefined) ?? undefined
        })
      } else {
        setSettings(null)
      }
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
      const dbData: any = {}
      const { nameKey, birthKey, themeKey, expectancyKey } = columnMapRef.current

      if (updates.name !== undefined) {
        if (nameKey) {
          dbData[nameKey] = updates.name
        } else {
          dbData.full_name = updates.name
        }
      }
      if (updates.birthDate !== undefined) {
        if (birthKey) {
          dbData[birthKey] = updates.birthDate
        } else {
          dbData.birth_date = updates.birthDate
        }
      }
      if (updates.theme !== undefined) {
        if (themeKey) {
          dbData[themeKey] = updates.theme
        } else {
          dbData.theme = updates.theme
        }
      }
      if (updates.lifeExpectancyYears !== undefined) {
        if (expectancyKey) {
          dbData[expectancyKey] = updates.lifeExpectancyYears
        } else {
          dbData.life_expectancy_years = updates.lifeExpectancyYears
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ ...dbData, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) throw updateError
    } catch (err) {
      // Rollback on error
      setSettings(previousSettings)
      setError(err instanceof Error ? err.message : 'Error saving settings')
      throw err
    }
  }

  return { settings, loading, error, saveSettings, refetch: loadSettings }
}
