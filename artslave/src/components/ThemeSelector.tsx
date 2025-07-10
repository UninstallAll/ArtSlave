'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme, ThemeMode } from '@/contexts/ThemeContext'
import {
  Palette,
  Monitor,
  Moon,
  Check
} from 'lucide-react'

const themeOptions = [
  {
    id: 'professional' as ThemeMode,
    name: '专业模式',
    description: '简洁专业的商务风格',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  {
    id: 'dark' as ThemeMode,
    name: '夜间模式',
    description: '护眼的深色主题',
    icon: Moon,
    preview: 'bg-gradient-to-r from-gray-800 to-gray-900'
  }
]

export default function ThemeSelector() {
  const { theme, setTheme, getThemeClasses } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const themeClasses = getThemeClasses()

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-2xl border-2 ${themeClasses.border} ${themeClasses.buttonHover} transition-all duration-200 ${themeClasses.textPrimary}`}
      >
        <Palette className="w-4 h-4 mr-2" />
        主题
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Theme Panel */}
          <div className={`absolute right-0 top-full mt-2 w-80 ${themeClasses.cardBackground} rounded-3xl border-2 ${themeClasses.border} shadow-xl z-50 p-6`}>
            <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-4`}>
              选择主题
            </h3>
            
            <div className="space-y-3">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = theme === option.id
                
                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      setTheme(option.id)
                      setIsOpen(false)
                    }}
                    className={`flex items-center space-x-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? `${themeClasses.accent} bg-opacity-10` 
                        : `${themeClasses.buttonHover}`
                    }`}
                  >
                    {/* Preview Circle */}
                    <div className={`w-12 h-12 rounded-xl ${option.preview} flex items-center justify-center relative`}>
                      <Icon className="w-6 h-6 text-white" />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Theme Info */}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${themeClasses.textPrimary}`}>
                        {option.name}
                      </h4>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className={`mt-6 pt-4 border-t ${themeClasses.border}`}>
              <p className={`text-xs ${themeClasses.textSecondary} text-center`}>
                主题设置会自动保存
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
