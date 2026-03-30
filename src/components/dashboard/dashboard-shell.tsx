"use client"

import { useState } from "react"

import { DashboardNavbar } from "./navbar"
import { DashboardSidebar } from "./sidebar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="relative lg:ml-72">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,oklch(var(--primary)/0.12),transparent_60%)]" />
        <div className="relative">{children}</div>
      </main>
    </div>
  )
}
