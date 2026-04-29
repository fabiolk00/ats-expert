import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseFile } from './parse-file'

const { pdfParse } = vi.hoisted(() => ({
  pdfParse: vi.fn(),
}))

const { extractRawText } = vi.hoisted(() => ({
  extractRawText: vi.fn(),
}))

vi.mock('pdf-parse', () => ({
  default: pdfParse,
}))

vi.mock('mammoth', () => ({
  extractRawText,
}))

describe('parseFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts text from a valid PDF upload', async () => {
    const resumeText = [
      'Ana Silva',
      'Backend engineer with TypeScript and PostgreSQL delivery experience.',
      'Built billing APIs, improved observability, and supported production operations.',
    ].join(' ')

    pdfParse.mockResolvedValue({
      text: resumeText,
      numpages: 2,
    })

    const result = await parseFile({
      file_base64: Buffer.from('fake pdf').toString('base64'),
      mime_type: 'application/pdf',
    })

    expect(result).toEqual({
      success: true,
      text: resumeText,
      pageCount: 2,
    })
  })

  it('rejects DOCX uploads with a PDF-only validation failure', async () => {
    extractRawText.mockResolvedValue({
      value: 'DOCX resume text that should not be parsed in the PDF-only product.',
    })

    const result = await parseFile({
      file_base64: Buffer.from('fake docx').toString('base64'),
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    expect(result).toEqual({
      success: false,
      code: 'VALIDATION_ERROR',
      error: 'O produto aceita apenas currículos em PDF.',
    })
    expect(extractRawText).not.toHaveBeenCalled()
  })

  it('rejects image uploads with the same PDF-only validation failure', async () => {
    const result = await parseFile({
      file_base64: Buffer.from('fake image').toString('base64'),
      mime_type: 'image/png',
    })

    expect(result).toEqual({
      success: false,
      code: 'VALIDATION_ERROR',
      error: 'O produto aceita apenas currículos em PDF.',
    })
  })

  it('returns PARSE_ERROR when extracted PDF text is insufficient', async () => {
    pdfParse.mockResolvedValue({
      text: 'too short',
      numpages: 1,
    })

    const result = await parseFile({
      file_base64: Buffer.from('fake pdf').toString('base64'),
      mime_type: 'application/pdf',
    })

    expect(result).toEqual({
      success: false,
      code: 'PARSE_ERROR',
      error: 'PDF_SCANNED - very little text extracted. The file may be image-based. Upload a text-based PDF.',
    })
  })
})
