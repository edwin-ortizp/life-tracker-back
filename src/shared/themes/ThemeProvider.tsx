import { ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react'
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

const THEME_STORAGE_KEY = 'life-tracker-theme'

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export const ThemeProvider = ({ children, defaultTheme = 'default' }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme)

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme && Object.keys(themes).includes(savedTheme)) {
        setTheme(savedTheme as ThemeName)
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error)
    }
  }, [])

  // Apply theme variables to DOM
  useEffect(() => {
    const themeVars = themes[theme] || themes[defaultTheme]
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })
  }, [theme, defaultTheme])

  // Save theme to localStorage
  const updateTheme = useCallback((newTheme: ThemeName) => {
    setTheme(newTheme)

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
