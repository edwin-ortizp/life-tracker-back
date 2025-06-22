import { defaultTheme } from './default'
import { programmerLight } from './programmer-light'
import { Theme } from './types'

export const themes: Record<string, Theme> = {
  default: defaultTheme,
  programmer: programmerLight,
}

export type ThemeName = keyof typeof themes
