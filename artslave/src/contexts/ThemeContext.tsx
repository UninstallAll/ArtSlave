'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeMode = 'professional' | 'dark'

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  getThemeClasses: () => {
    background: string
    cardBackground: string
    textPrimary: string
    textSecondary: string
    border: string
    accent: string
    button: string
    buttonHover: string
    input: string
    inputFocus: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const themeConfigs = {
  professional: {
    background: 'bg-white',
    cardBackground: 'bg-white',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-300',
    accent: 'text-blue-700',
    button: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
    buttonHover: 'hover:bg-gray-50',
    input: 'bg-white border-gray-300',
    inputFocus: 'focus:border-blue-500'
  },
  dark: {
    background: 'bg-gray-900',
    cardBackground: 'bg-gray-800',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    border: 'border-gray-600',
    accent: 'text-blue-400',
    button: 'bg-blue-600 text-white hover:bg-blue-700',
    buttonHover: 'hover:bg-gray-700',
    input: 'bg-gray-700 border-gray-600 text-white',
    inputFocus: 'focus:border-blue-500'
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('professional')

  useEffect(() => {
    const savedTheme = localStorage.getItem('artslave-theme') as ThemeMode
    if (savedTheme && themeConfigs[savedTheme]) {
      setTheme(savedTheme)
    }
  }, [])

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    localStorage.setItem('artslave-theme', newTheme)
  }

  const getThemeClasses = () => themeConfigs[theme]

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, getThemeClasses }}>
      {children}
    </ThemeContext.Provider>
  )
}
