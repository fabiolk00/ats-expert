import React from 'react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import AuthLayout, { dynamic } from './layout'

const mockGetCurrentAppUser = vi.fn()
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`)
})

vi.mock('@/lib/auth/app-user', () => ({
  getCurrentAppUser: () => mockGetCurrentAppUser(),
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))

vi.mock('@/components/dashboard/dashboard-shell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the auth subtree force-dynamic', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('redirects unauthenticated users to /login', async () => {
    mockGetCurrentAppUser.mockResolvedValue(null)

    await expect(
      AuthLayout({
        children: <div>Child</div>,
      }),
    ).rejects.toThrow('redirect:/login')

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('renders the dashboard shell for authenticated users', async () => {
    mockGetCurrentAppUser.mockResolvedValue({ id: 'usr_123' })

    const jsx = await AuthLayout({
      children: <div>Child</div>,
    })

    render(jsx)

    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
  })
})
