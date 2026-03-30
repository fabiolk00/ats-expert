"use client"

import { useState } from "react"

import { DashboardNavbar } from "./navbar"
import { DashboardSidebar } from "./sidebar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.12),transparent_60%)]" />
      <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="relative z-10 lg:pl-72">{children}</main>
    </div>
  )
}
