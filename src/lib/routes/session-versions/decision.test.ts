import { describe, expect, it } from 'vitest'

import { sanitizeVersionEntryForViewer } from '@/lib/cv/preview-sanitization'

describe('session-versions decision helpers', () => {
  it('keeps unlocked snapshots visible', () => {
    const sanitized = sanitizeVersionEntryForViewer({
      id: 'ver_1',
      sessionId: 'sess_1',
      snapshot: {
        fullName: 'Ana',
        email: 'ana@example.com',
        phone: '1',
        summary: 'summary',
        experience: [],
        skills: [],
        education: [],
      },
      label: 'Base Resume Imported',
      timestamp: '2026-01-01T00:00:00.000Z',
      scope: 'base',
      source: 'ingestion',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }, {
      session: { generatedOutput: { status: 'idle' } },
      targetsById: new Map(),
    })

    expect(sanitized.previewLocked).toBe(false)
    expect(sanitized.snapshot?.fullName).toBe('Ana')
  })
})
