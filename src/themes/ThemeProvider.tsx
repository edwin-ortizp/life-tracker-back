import { ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { themes, ThemeName } from './index'
import { firestoreLogger } from '@/utils/firestore-logger'

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeName
}

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (name: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export const ThemeProvider = ({ children, defaultTheme = 'default' }: ThemeProviderProps) => {
  const { user } = useAuth()
  const [theme, setTheme] = useState<ThemeName>(defaultTheme)

  // Load theme once (single-load pattern)
  const loadTheme = useCallback(async () => {
    if (!user) {
      return
    }
    
    try {
      const docRef = doc(db, 'settings', user.uid)
      firestoreLogger.logRead('settings', 'ThemeProvider.loadTheme', user.uid)
      const snap = await getDoc(docRef)
      
      if (snap.exists()) {
        const data = snap.data() as { theme?: ThemeName } | undefined
        setTheme((data?.theme as ThemeName) || defaultTheme)
      } else {
        setTheme(defaultTheme)
      }
    } catch (error) {
      console.error('Error loading theme:', error)
      setTheme(defaultTheme)
    }
  }, [user, defaultTheme])

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  // Apply theme variables to DOM
  useEffect(() => {
    const themeVars = themes[theme] || themes[defaultTheme]
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  }, [theme, defaultTheme])

  // Save theme with optimistic update
  const updateTheme = useCallback(async (newTheme: ThemeName) => {
    // Optimistic update: apply theme immediately
    setTheme(newTheme)
    
    if (user) {
      try {
        const docRef = doc(db, 'settings', user.uid)
        firestoreLogger.logWrite('settings', 'ThemeProvider.updateTheme', user.uid)
        await setDoc(docRef, { userId: user.uid, theme: newTheme }, { merge: true })
      } catch (error) {
        // On error, revert to previous theme (could be enhanced with proper rollback)
        console.error('Error saving theme:', error)
        // Note: For themes, we might want to keep the optimistic update since it's visual
      }
    }
  }, [user])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
