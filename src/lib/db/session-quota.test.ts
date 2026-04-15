import { describe, expect, it, vi } from 'vitest'

import { checkUserQuota } from '@/lib/db/session-quota'

vi.mock('@/lib/asaas/quota', () => ({
  checkUserQuota: vi.fn(async (appUserId: string) => appUserId === 'usr_allowed'),
}))

describe('session quota adapter', () => {
  it('delegates quota checks to the billing quota module', async () => {
    await expect(checkUserQuota('usr_allowed')).resolves.toBe(true)
    await expect(checkUserQuota('usr_blocked')).resolves.toBe(false)
  })
})
