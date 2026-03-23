import type { ParseFileInput, ParseFileOutput } from '@/types/agent'

export async function parseFile(input: ParseFileInput): Promise<ParseFileOutput> {
  try {
    const buffer = Buffer.from(input.file_base64, 'base64')

    if (input.mime_type === 'application/pdf') {
      return await parsePDF(buffer)
    }

    if (input.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await parseDOCX(buffer)
    }

    if (input.mime_type.startsWith('image/')) {
      return await parseImageOCR(buffer, input.mime_type)
    }

    return { success: false, error: `Unsupported mime type: ${input.mime_type}` }
  } catch (err) {
    console.error('[parseFile]', err)
    return { success: false, error: 'Failed to extract text from file.' }
  }
}

async function parsePDF(buffer: Buffer): Promise<ParseFileOutput> {
  const pdfParse = (await import('pdf-parse')).default
  const data     = await pdfParse(buffer)

  if (!data.text || data.text.trim().length < 100) {
    return { success: false, error: 'PDF_SCANNED — very little text extracted. The file may be image-based. Try uploading a DOCX or use our image upload option.' }
  }

  return { success: true, text: data.text.trim(), pageCount: data.numpages }
}

async function parseDOCX(buffer: Buffer): Promise<ParseFileOutput> {
  const mammoth = await import('mammoth')
  const result  = await mammoth.extractRawText({ buffer })

  if (!result.value || result.value.trim().length < 100) {
    return { success: false, error: 'Could not extract text from DOCX file.' }
  }

  return { success: true, text: result.value.trim(), pageCount: 1 }
}

async function parseImageOCR(buffer: Buffer, mime: string): Promise<ParseFileOutput> {
  // Use Claude's vision capability for OCR on resume images
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client    = new Anthropic()

  const mediaType = mime as 'image/png' | 'image/jpeg'

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') },
        },
        {
          type: 'text',
          text: 'Extract all text from this resume image. Output only the raw text, preserving the logical reading order. No commentary.',
        },
      ],
    }],
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? ''

  if (text.length < 100) {
    return { success: false, error: 'Could not read text from image.' }
  }

  return { success: true, text: text.trim(), pageCount: 1 }
}
