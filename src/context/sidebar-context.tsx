'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { useSidebar } from '@/hooks/use-sidebar'

type SidebarContextValue = ReturnType<typeof useSidebar>

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const sidebar = useSidebar()

  return <SidebarContext.Provider value={sidebar}>{children}</SidebarContext.Provider>
}

export function useSidebarContext() {
  const context = useContext(SidebarContext)

  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider')
  }

  return context
}
