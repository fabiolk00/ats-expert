import { TOOL_ERROR_CODES, toolFailure, toolFailureFromUnknown } from '@/lib/agent/tool-errors'
import type { ParseFileInput, ParseFileOutput } from '@/types/agent'

const PDF_ONLY_PARSE_ERROR = 'O produto aceita apenas currículos em PDF.'

export async function parseFile(
  input: ParseFileInput,
  _userId?: string,
  _sessionId?: string,
  _externalSignal?: AbortSignal,
): Promise<ParseFileOutput> {
  try {
    if (input.mime_type !== 'application/pdf') {
      return toolFailure(TOOL_ERROR_CODES.VALIDATION_ERROR, PDF_ONLY_PARSE_ERROR)
    }

    const buffer = Buffer.from(input.file_base64, 'base64')
    return await parsePDF(buffer)
  } catch (error) {
    console.error('[parseFile]', error)
    return toolFailureFromUnknown(error, 'Failed to extract text from file.', TOOL_ERROR_CODES.PARSE_ERROR)
  }
}

async function parsePDF(buffer: Buffer): Promise<ParseFileOutput> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)

  if (!data.text || data.text.trim().length < 100) {
    return toolFailure(
      TOOL_ERROR_CODES.PARSE_ERROR,
      'PDF_SCANNED - very little text extracted. The file may be image-based. Upload a text-based PDF.',
    )
  }

  return { success: true, text: data.text.trim(), pageCount: data.numpages }
}
