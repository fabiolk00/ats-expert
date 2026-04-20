import { describe, expect, it } from 'vitest'

import {
  sanitizeCompareRefForViewer,
  sanitizeVersionEntryForViewer,
  sanitizeVersionSnapshotForViewer,
} from './preview-sanitization'

function buildCvState(summary: string) {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary,
    experience: [],
    skills: ['TypeScript'],
    education: [],
  }
}

describe('preview sanitization', () => {
  it('removes version snapshots for locked free-trial preview access', () => {
    const result = sanitizeVersionSnapshotForViewer(
      {
        snapshot: buildCvState('Resumo real'),
        source: 'ats-enhancement',
      },
      {
        session: {
          generatedOutput: {
            status: 'ready',
            previewAccess: {
              locked: true,
              blurred: true,
              canViewRealContent: false,
              requiresUpgrade: true,
              requiresRegenerationAfterUnlock: true,
              reason: 'free_trial_locked',
              message: 'Seu preview gratuito esta bloqueado.',
            },
          },
        },
      },
    )

    expect(result).toEqual({
      snapshot: undefined,
      previewLocked: true,
      blurred: true,
      canViewRealContent: false,
      requiresUpgrade: true,
      requiresRegenerationAfterUnlock: true,
      previewLock: {
        locked: true,
        blurred: true,
        reason: 'free_trial_locked',
        requiresUpgrade: true,
        requiresPaidRegeneration: true,
        message: 'Seu preview gratuito esta bloqueado.',
      },
    })
  })

  it('preserves real snapshots for paid-access versions', () => {
    const version = {
      id: 'ver_123',
      sessionId: 'sess_123',
      targetResumeId: undefined,
      snapshot: buildCvState('Resumo real'),
      source: 'rewrite' as const,
      label: 'Base Resume Updated',
      timestamp: '2026-04-20T12:00:00.000Z',
      scope: 'base' as const,
      createdAt: new Date('2026-04-20T12:00:00.000Z'),
    }

    const result = sanitizeVersionEntryForViewer(version, {
      session: {
        generatedOutput: {
          status: 'ready',
        },
      },
    })

    expect(result).toMatchObject({
      id: 'ver_123',
      snapshot: buildCvState('Resumo real'),
      previewLocked: false,
      canViewRealContent: true,
      requiresUpgrade: false,
    })
  })

  it('blocks compare output when one side is locked', () => {
    const result = sanitizeCompareRefForViewer({
      kind: 'version',
      id: 'ver_123',
      label: 'ATS Enhancement Created',
      source: 'ats-enhancement',
      timestamp: '2026-04-20T12:00:00.000Z',
      snapshot: buildCvState('Resumo real'),
      previewAccess: {
        locked: true,
        blurred: true,
        canViewRealContent: false,
        requiresUpgrade: true,
        requiresRegenerationAfterUnlock: true,
        reason: 'free_trial_locked',
        message: 'Seu preview gratuito esta bloqueado.',
      },
    })

    expect(result.previewLocked).toBe(true)
    expect(result.snapshot).toBeUndefined()
    expect(result.previewLock).toMatchObject({
      locked: true,
      reason: 'free_trial_locked',
    })
  })
})
