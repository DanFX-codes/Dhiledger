import { MoonStar, SunMedium } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'light'
    const saved = window.localStorage.getItem('dhiledger-theme')
    if (saved === 'dark' || saved === 'light') return saved
    const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('dhiledger-theme', theme)
  }, [theme])

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunMedium size={16} aria-hidden="true" /> : <MoonStar size={16} aria-hidden="true" />}
      <span className="sr-only">{label}</span>
    </button>
  )
}
