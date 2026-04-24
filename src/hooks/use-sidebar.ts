'use client'

import { useCallback, useEffect, useState } from 'react'

const DESKTOP_SIDEBAR_OPEN = false

export function useSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggle = useCallback(() => {
    // Desktop sidebar stays permanently collapsed to preserve workspace width.
  }, [])

  const open = useCallback(() => {
    // Desktop sidebar stays permanently collapsed to preserve workspace width.
  }, [])

  const close = useCallback(() => {
    // Desktop sidebar stays permanently collapsed to preserve workspace width.
  }, [])

  const openMobile = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((previous) => !previous)
  }, [])

  return {
    isOpen: DESKTOP_SIDEBAR_OPEN,
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
