import { ReactNode, useEffect, useState, createContext, useContext } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { themes, ThemeName } from './index'

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

  useEffect(() => {
    if (!user) return
    const docRef = doc(db, 'settings', user.uid)
    const unsub = onSnapshot(docRef, snap => {
      const data = snap.data() as { theme?: ThemeName } | undefined
      setTheme((data?.theme as ThemeName) || defaultTheme)
    })
    return unsub
  }, [user, defaultTheme])

  useEffect(() => {
    const themeVars = themes[theme] || themes[defaultTheme]
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
    if (user) {
      const docRef = doc(db, 'settings', user.uid)
      setDoc(docRef, { theme }, { merge: true }).catch(console.error)
    }
  }, [theme, user, defaultTheme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
