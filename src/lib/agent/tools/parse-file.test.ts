import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseFile } from './parse-file'

const { pdfParse } = vi.hoisted(() => ({
  pdfParse: vi.fn(),
}))

vi.mock('pdf-parse', () => ({
  default: pdfParse,
}))

describe('parseFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      error: 'PDF_SCANNED - very little text extracted. The file may be image-based. Try uploading a DOCX or use our image upload option.',
    })
  })
})
