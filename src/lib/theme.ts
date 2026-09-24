import { useCallback, useEffect, useState } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'titra.theme'

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    // The night lab is Titra's identity: dark unless the user chose otherwise.
    return v === 'light' || v === 'system' ? v : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(pref: ThemePref): void {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
  const dark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
  if (meta) meta.content = dark ? '#050b0d' : '#eef4f2'
}

export function useTheme(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(readPref)
  useEffect(() => {
    applyTheme(pref)
  }, [pref])
  const set = useCallback((p: ThemePref) => {
    try {
      localStorage.setItem(KEY, p)
    } catch {
      /* private mode */
    }
    setPref(p)
  }, [])
  return [pref, set]
}

/** Call once at boot so there is no flash before React mounts. */
export function bootTheme(): void {
  applyTheme(readPref())
}
