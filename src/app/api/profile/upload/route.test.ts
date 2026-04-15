import type { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { importPdfProfile } from '@/lib/profile/pdf-import'
import {
  createPdfImportJob,
} from '@/lib/profile/pdf-import-jobs'
import { getExistingUserProfile } from '@/lib/profile/user-profiles'

import { POST } from './route'

vi.mock('@/lib/auth/app-user', () => ({
  getCurrentAppUser: vi.fn(),
}))

vi.mock('@/lib/profile/user-profiles', () => ({
  getExistingUserProfile: vi.fn(),
}))

vi.mock('@/lib/profile/pdf-import', () => ({
  importPdfProfile: vi.fn(),
}))

vi.mock('@/lib/profile/pdf-import-jobs', () => ({
  createPdfImportJob: vi.fn(),
}))

vi.mock('@/lib/observability/structured-log', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  serializeError: (error: unknown) => ({
    errorMessage: error instanceof Error ? error.message : String(error),
  }),
}))

const appUser = {
  id: 'usr_123',
  email: 'ana@example.com',
} as unknown as NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>>

function makeRequest(file?: File, replaceLinkedinImport = false): NextRequest {
  const formData = new FormData()

  if (file) {
    formData.append('file', file)
  }

  if (replaceLinkedinImport) {
    formData.append('replaceLinkedinImport', 'true')
  }

  return {
    formData: async () => formData,
    signal: new AbortController().signal,
  } as NextRequest
}

function buildImportedProfile(source: 'pdf' | 'linkedin' = 'pdf') {
  return {
    id: 'profile_123',
    user_id: 'usr_123',
    cv_state: {
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '',
      summary: 'Backend engineer',
      experience: [],
      skills: [],
      education: [],
    },
    source,
    linkedin_url: source === 'linkedin' ? 'https://linkedin.com/in/ana' : null,
    profile_photo_url: null,
    extracted_at: '2026-04-13T16:00:00.000Z',
    created_at: '2026-04-13T16:00:00.000Z',
    updated_at: '2026-04-13T16:00:00.000Z',
  }
}

describe('POST /api/profile/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(null)

    const res = await POST(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns 400 when no file is provided', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)

    const res = await POST(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Selecione um arquivo PDF para importar.')
  })

  it('returns 400 for unsupported file types', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)

    const res = await POST(
      makeRequest(new File(['plain text'], 'resume.txt', { type: 'text/plain' })),
    )
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Envie um arquivo PDF.')
  })

  it('returns 400 for DOCX uploads under the PDF-only contract', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)

    const res = await POST(
      makeRequest(
        new File(
          ['docx'],
          'resume.docx',
          { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        ),
      ),
    )
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Envie um arquivo PDF.')
    expect(importPdfProfile).not.toHaveBeenCalled()
  })

  it('requires confirmation before replacing a LinkedIn-imported profile', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)
    vi.mocked(getExistingUserProfile).mockResolvedValueOnce(buildImportedProfile('linkedin'))

    const res = await POST(
      makeRequest(new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })),
    )
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.requiresConfirmation).toBe(true)
    expect(json.error).toBe(
      'Voce ja importou seu perfil pelo LinkedIn. Confirme se deseja substituir essas informacoes pelo PDF.',
    )
    expect(importPdfProfile).not.toHaveBeenCalled()
  })

  it('returns a scanned-pdf failure from the shared import service', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)
    vi.mocked(getExistingUserProfile).mockResolvedValueOnce(null)
    vi.mocked(importPdfProfile).mockResolvedValueOnce({
      success: false,
      code: 'SCANNED_PDF',
      error: 'Nao conseguimos extrair texto desse PDF. Se ele for escaneado, tente outro PDF com texto selecionavel ou preencha manualmente.',
    })

    const res = await POST(
      makeRequest(new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })),
    )
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe(
      'Nao conseguimos extrair texto desse PDF. Se ele for escaneado, tente outro PDF com texto selecionavel ou preencha manualmente.',
    )
  })

  it('imports a small PDF synchronously', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)
    vi.mocked(getExistingUserProfile).mockResolvedValueOnce(null)
    vi.mocked(importPdfProfile).mockResolvedValueOnce({
      success: true,
      profile: buildImportedProfile('pdf'),
      strategy: 'populate_empty',
      changedFields: ['fullName', 'email', 'summary'],
      preservedFields: [],
      warning: undefined,
    })

    const res = await POST(
      makeRequest(new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })),
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.profile.source).toBe('pdf')
    expect(json.changedFields).toEqual(['fullName', 'email', 'summary'])
    expect(importPdfProfile).toHaveBeenCalledWith({
      appUserId: 'usr_123',
      fileBuffer: expect.any(Buffer),
      replaceLinkedinImport: false,
      signal: expect.any(AbortSignal),
    })
  })

  it('returns 409 without saving when an existing profile would not change', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)
    vi.mocked(getExistingUserProfile).mockResolvedValueOnce(buildImportedProfile('pdf'))
    vi.mocked(importPdfProfile).mockResolvedValueOnce({
      success: false,
      code: 'NO_PROFILE_CHANGES',
      error: 'Esse arquivo nao trouxe novas informacoes para o seu perfil atual.',
    })

    const res = await POST(
      makeRequest(new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })),
    )
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toBe('Esse arquivo nao trouxe novas informacoes para o seu perfil atual.')
  })

  it('queues larger PDFs for async processing instead of parsing inline', async () => {
    vi.mocked(getCurrentAppUser).mockResolvedValueOnce(appUser)
    vi.mocked(getExistingUserProfile).mockResolvedValueOnce(null)
    vi.mocked(createPdfImportJob).mockResolvedValueOnce({ jobId: 'job_pdf_123' })

    const largePdf = new File([new Uint8Array(1_500_000)], 'resume.pdf', {
      type: 'application/pdf',
    })

    const res = await POST(makeRequest(largePdf))
    const json = await res.json()

    expect(res.status).toBe(202)
    expect(json).toEqual({
      success: true,
      jobId: 'job_pdf_123',
      status: 'pending',
    })
    expect(createPdfImportJob).toHaveBeenCalledWith({
      appUserId: 'usr_123',
      fileName: 'resume.pdf',
      fileSize: 1_500_000,
      replaceLinkedinImport: false,
      fileBuffer: expect.any(Buffer),
    })
    expect(importPdfProfile).not.toHaveBeenCalled()
  })
})
