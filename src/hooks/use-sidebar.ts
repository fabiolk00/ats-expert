'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'curria:sidebar:open'

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsOpen(stored === 'true')
    }
  }, [])

  const persistDesktopState = useCallback((nextValue: boolean) => {
    setIsOpen(nextValue)
    window.localStorage.setItem(STORAGE_KEY, String(nextValue))
  }, [])

  const toggle = useCallback(() => {
    persistDesktopState(!isOpen)
  }, [isOpen, persistDesktopState])

  const open = useCallback(() => {
    persistDesktopState(true)
  }, [persistDesktopState])

  const close = useCallback(() => {
    persistDesktopState(false)
  }, [persistDesktopState])

  const openMobile = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((previous) => !previous)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        persistDesktopState(!isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, persistDesktopState])

  return {
    isOpen,
    isMobileOpen,
    isMounted,
    toggle,
    open,
    close,
    openMobile,
    closeMobile,
    toggleMobile,
  }
}
