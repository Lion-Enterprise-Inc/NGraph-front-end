'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminLang, AdminCopy, getAdminCopy } from '../i18n/adminCopy'

const STORAGE_KEY = 'omiseai_admin_lang'

function readStoredLang(): AdminLang {
  if (typeof window === 'undefined') return 'ja'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'ja'
}

export function useAdminLang(): {
  lang: AdminLang
  setLang: (next: AdminLang) => void
  toggle: () => void
  t: AdminCopy
} {
  const [lang, setLangState] = useState<AdminLang>('ja')

  useEffect(() => {
    setLangState(readStoredLang())
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      setLangState(e.newValue === 'en' ? 'en' : 'ja')
    }
    const onLocal = () => setLangState(readStoredLang())
    window.addEventListener('storage', onStorage)
    window.addEventListener('adminLangChanged', onLocal)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('adminLangChanged', onLocal)
    }
  }, [])

  const setLang = useCallback((next: AdminLang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
      window.dispatchEvent(new Event('adminLangChanged'))
    } catch {
      // ignore quota / disabled storage
    }
  }, [])

  const toggle = useCallback(() => {
    setLang(lang === 'ja' ? 'en' : 'ja')
  }, [lang, setLang])

  return { lang, setLang, toggle, t: getAdminCopy(lang) }
}
