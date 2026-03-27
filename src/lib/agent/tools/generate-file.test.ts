import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CVState } from '@/types/cv'

import { generateFile, generateFileDeps } from './generate-file'

function buildCvState(): CVState {
  return {
    fullName: 'Ana Silva',
    email: 'ana@example.com',
    phone: '555-0100',
    summary: 'Backend engineer',
    experience: [],
    skills: ['TypeScript', 'PostgreSQL'],
    education: [],
  }
}

function buildSupabase() {
  return {
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn((filePath: string) => Promise.resolve({
          data: {
            signedUrl: `https://cdn.example.com/${filePath}`,
          },
        })),
      })),
    },
  }
}

describe('generateFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('persists generated output paths but not signed URLs', async () => {
    const supabase = buildSupabase()
    const upload = vi.fn().mockResolvedValue(undefined)
    const generateDOCX = vi.fn().mockResolvedValue(Buffer.from('docx'))
    const generatePDF = vi.fn().mockResolvedValue(Buffer.from('pdf'))

    vi.spyOn(generateFileDeps, 'getSupabase').mockReturnValue(
      supabase as unknown as ReturnType<typeof generateFileDeps.getSupabase>,
    )
    vi.spyOn(generateFileDeps, 'upload').mockImplementation(upload)
    vi.spyOn(generateFileDeps, 'generateDOCX').mockImplementation(generateDOCX)
    vi.spyOn(generateFileDeps, 'generatePDF').mockImplementation(generatePDF)

    const result = await generateFile({
      cv_state: buildCvState(),
    }, 'usr_123', 'sess_123')

    expect(result.output).toEqual({
      success: true,
      docxUrl: 'https://cdn.example.com/usr_123/sess_123/resume.docx',
      pdfUrl: 'https://cdn.example.com/usr_123/sess_123/resume.pdf',
    })
    expect(result.patch).toMatchObject({
      generatedOutput: {
        status: 'ready',
        docxPath: 'usr_123/sess_123/resume.docx',
        pdfPath: 'usr_123/sess_123/resume.pdf',
      },
    })
    expect(result.patch?.generatedOutput).not.toHaveProperty('docxUrl')
    expect(result.patch?.generatedOutput).not.toHaveProperty('pdfUrl')
  })

  it('persists failed status and explicit error on failure', async () => {
    vi.spyOn(generateFileDeps, 'getSupabase').mockReturnValue(
      buildSupabase() as unknown as ReturnType<typeof generateFileDeps.getSupabase>,
    )
    vi.spyOn(generateFileDeps, 'generateDOCX').mockRejectedValue(new Error('template render failed'))
    vi.spyOn(generateFileDeps, 'generatePDF').mockResolvedValue(Buffer.from('pdf'))

    const result = await generateFile({
      cv_state: buildCvState(),
    }, 'usr_123', 'sess_123')

    expect(result.output).toEqual({
      success: false,
      error: 'File generation failed.',
    })
    expect(result.patch).toEqual({
      generatedOutput: {
        status: 'failed',
        docxPath: undefined,
        pdfPath: undefined,
        error: 'template render failed',
      },
    })
  })

  it('returns a client-compatible tool output shape', async () => {
    vi.spyOn(generateFileDeps, 'getSupabase').mockReturnValue(
      buildSupabase() as unknown as ReturnType<typeof generateFileDeps.getSupabase>,
    )
    vi.spyOn(generateFileDeps, 'generateDOCX').mockResolvedValue(Buffer.from('docx'))
    vi.spyOn(generateFileDeps, 'generatePDF').mockResolvedValue(Buffer.from('pdf'))
    vi.spyOn(generateFileDeps, 'upload').mockResolvedValue(undefined)

    const result = await generateFile({
      cv_state: buildCvState(),
    }, 'usr_123', 'sess_123')

    expect(result.output.success).toBe(true)
    if (!result.output.success) {
      throw new Error('Expected successful output.')
    }

    expect(result.output.docxUrl).toContain('resume.docx')
    expect(result.output.pdfUrl).toContain('resume.pdf')
  })

  it('builds target-specific artifact metadata without touching session-level patching', async () => {
    vi.spyOn(generateFileDeps, 'getSupabase').mockReturnValue(
      buildSupabase() as unknown as ReturnType<typeof generateFileDeps.getSupabase>,
    )
    vi.spyOn(generateFileDeps, 'generateDOCX').mockResolvedValue(Buffer.from('docx'))
    vi.spyOn(generateFileDeps, 'generatePDF').mockResolvedValue(Buffer.from('pdf'))
    vi.spyOn(generateFileDeps, 'upload').mockResolvedValue(undefined)

    const result = await generateFile({
      cv_state: buildCvState(),
      target_id: 'target_123',
    }, 'usr_123', 'sess_123', { type: 'target', targetId: 'target_123' })

    expect(result.output).toEqual({
      success: true,
      docxUrl: 'https://cdn.example.com/usr_123/sess_123/targets/target_123/resume.docx',
      pdfUrl: 'https://cdn.example.com/usr_123/sess_123/targets/target_123/resume.pdf',
    })
    expect(result.patch).toBeUndefined()
    expect(result.generatedOutput).toEqual({
      status: 'ready',
      docxPath: 'usr_123/sess_123/targets/target_123/resume.docx',
      pdfPath: 'usr_123/sess_123/targets/target_123/resume.pdf',
      generatedAt: expect.any(String),
      error: undefined,
    })
  })
})
