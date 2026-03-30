import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import React from 'react'

import PricingCards from './pricing-cards'

const {
  mockPush,
  mockReplace,
  mockSearchParamsGet,
  mockNavigateToUrl,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockSearchParamsGet: vi.fn(),
  mockNavigateToUrl: vi.fn(),
}))

let mockIsSignedIn = false

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: mockIsSignedIn,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}))

vi.mock('@/lib/navigation/external', () => ({
  navigateToUrl: mockNavigateToUrl,
}))

describe('PricingCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSignedIn = false
    mockSearchParamsGet.mockReturnValue(null)
    vi.stubGlobal('fetch', vi.fn())
  })

  it('redirects signed-out users to signup with the selected checkout plan', async () => {
    const user = userEvent.setup()

    render(<PricingCards />)

    await user.click(screen.getAllByRole('button', { name: /Come.*agora/i })[0])

    expect(mockPush).toHaveBeenCalledWith('/signup?redirect_to=%2Fpricing%3FcheckoutPlan%3Dunit')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('redirects signed-in users to the checkout url returned by the API', async () => {
    mockIsSignedIn = true
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://sandbox.asaas.com/payment-link/test' }),
    } as Response)
    const user = userEvent.setup()

    render(<PricingCards />)

    await user.click(screen.getAllByRole('button', { name: /Come.*agora/i })[1])

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({
        method: 'POST',
      }))
    })

    await waitFor(() => {
      expect(mockNavigateToUrl).toHaveBeenCalledWith('https://sandbox.asaas.com/payment-link/test')
    })
  })

  it('resumes checkout automatically after auth when checkoutPlan is present in the url', async () => {
    mockIsSignedIn = true
    mockSearchParamsGet.mockImplementation((key: string) => (
      key === 'checkoutPlan' ? 'pro' : null
    ))
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://sandbox.asaas.com/subscription/test' }),
    } as Response)

    render(<PricingCards />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/pricing')
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' }),
      }))
    })

    await waitFor(() => {
      expect(mockNavigateToUrl).toHaveBeenCalledWith('https://sandbox.asaas.com/subscription/test')
    })
  })
})
