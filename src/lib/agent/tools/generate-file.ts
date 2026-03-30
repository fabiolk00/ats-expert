import { readFileSync } from 'fs'
import path from 'path'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { z } from 'zod'

import { TOOL_ERROR_CODES, toolFailure } from '@/lib/agent/tool-errors'
import { CVStateSchema } from '@/lib/cv/schema'
import type { GenerateFileInput, GenerateFileOutput, GeneratedOutput, ToolPatch } from '@/types/agent'
import type { CVState } from '@/types/cv'

type GenerateFileExecutionResult = {
  output: GenerateFileOutput
  patch?: ToolPatch
  generatedOutput?: GeneratedOutput
}

type SupabaseStorageClient = ReturnType<SupabaseClient['storage']['from']>
type SignedResumeArtifactUrls = {
  docxUrl: string
  pdfUrl: string
}

type ArtifactScope =
  | { type: 'session' }
  | { type: 'target'; targetId: string }

const MARGIN = 50
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN
const MAX_VALIDATION_ERROR_MESSAGE_LENGTH = 500
const DEFAULT_VALIDATION_ERROR_MESSAGE = 'Resume state is incomplete. Please ensure all required fields are filled.'

const GenerationReadyCVStateSchema = CVStateSchema.superRefine((cvState, ctx) => {
  const requireNonEmptyString = (
    value: string,
    path: Array<string | number>,
    label: string,
  ): void => {
    if (value.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: `${label} is required.`,
      })
    }
  }

  requireNonEmptyString(cvState.fullName, ['fullName'], 'fullName')
  requireNonEmptyString(cvState.email, ['email'], 'email')
  requireNonEmptyString(cvState.phone, ['phone'], 'phone')
  requireNonEmptyString(cvState.summary, ['summary'], 'summary')

  if (cvState.experience.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['experience'],
      message: 'At least one work experience entry is required.',
    })
  }

  cvState.experience.forEach((entry, index) => {
    requireNonEmptyString(entry.title, ['experience', index, 'title'], `experience[${index}].title`)
    requireNonEmptyString(entry.company, ['experience', index, 'company'], `experience[${index}].company`)
    requireNonEmptyString(entry.startDate, ['experience', index, 'startDate'], `experience[${index}].startDate`)
    requireNonEmptyString(entry.endDate, ['experience', index, 'endDate'], `experience[${index}].endDate`)

    if (entry.bullets.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['experience', index, 'bullets'],
        message: `experience[${index}].bullets must include at least one bullet.`,
      })
    }

    entry.bullets.forEach((bullet, bulletIndex) => {
      requireNonEmptyString(
        bullet,
        ['experience', index, 'bullets', bulletIndex],
        `experience[${index}].bullets[${bulletIndex}]`,
      )
    })
  })

  cvState.skills.forEach((skill, index) => {
    requireNonEmptyString(skill, ['skills', index], `skills[${index}]`)
  })

  cvState.education.forEach((entry, index) => {
    requireNonEmptyString(entry.degree, ['education', index, 'degree'], `education[${index}].degree`)
    requireNonEmptyString(entry.institution, ['education', index, 'institution'], `education[${index}].institution`)
    requireNonEmptyString(entry.year, ['education', index, 'year'], `education[${index}].year`)
  })

  cvState.certifications?.forEach((entry, index) => {
    requireNonEmptyString(entry.name, ['certifications', index, 'name'], `certifications[${index}].name`)
    requireNonEmptyString(entry.issuer, ['certifications', index, 'issuer'], `certifications[${index}].issuer`)
  })
})

type GenerationValidationResult =
  | {
      success: true
      cvState: CVState
    }
  | {
      success: false
      errorMessage: string
    }

function capValidationErrorMessage(message: string): string {
  return message.length > MAX_VALIDATION_ERROR_MESSAGE_LENGTH
    ? `${message.slice(0, MAX_VALIDATION_ERROR_MESSAGE_LENGTH - 1)}…`
    : message
}

function formatValidationPath(path: ReadonlyArray<string | number>): string {
  return path.reduce<string>((formattedPath, segment) => {
    if (typeof segment === 'number') {
      return `${formattedPath}[${segment}]`
    }

    return formattedPath.length === 0
      ? segment
      : `${formattedPath}.${segment}`
  }, '')
}

function getValidationErrorMessage(error: z.ZodError<CVState>): string {
  const [firstIssue] = error.issues

  if (!firstIssue) {
    return DEFAULT_VALIDATION_ERROR_MESSAGE
  }

  const path = formatValidationPath(firstIssue.path)
  const baseMessage = firstIssue.code === z.ZodIssueCode.custom || path.length === 0
    ? firstIssue.message
    : `${path}: ${firstIssue.message}`

  return capValidationErrorMessage(baseMessage || DEFAULT_VALIDATION_ERROR_MESSAGE)
}

function validateGenerationCvState(cvState: GenerateFileInput['cv_state']): GenerationValidationResult {
  const parsedCvState = GenerationReadyCVStateSchema.safeParse(cvState)

  if (!parsedCvState.success) {
    return {
      success: false,
      errorMessage: getValidationErrorMessage(parsedCvState.error),
    }
  }

  return {
    success: true,
    cvState: parsedCvState.data,
  }
}

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are not configured.')
  }

  return createClient(url, serviceRoleKey)
}

function createSuccessPatch(docxPath: string, pdfPath: string): ToolPatch {
  return {
    generatedOutput: createGeneratedOutput('ready', undefined, docxPath, pdfPath),
  }
}

function createGeneratedOutput(status: GeneratedOutput['status'], error?: string, docxPath?: string, pdfPath?: string): GeneratedOutput {
  return {
    status,
    docxPath,
    pdfPath,
    generatedAt: status === 'ready' ? new Date().toISOString() : undefined,
    error,
  }
}

function createFailurePatch(error: string, docxPath?: string, pdfPath?: string): ToolPatch {
  return {
    generatedOutput: createGeneratedOutput('failed', error, docxPath, pdfPath),
  }
}

function buildArtifactPaths(
  userId: string,
  sessionId: string,
  scope: ArtifactScope,
): { docxPath: string; pdfPath: string } {
  if (scope.type === 'target') {
    return {
      docxPath: `${userId}/${sessionId}/targets/${scope.targetId}/resume.docx`,
      pdfPath: `${userId}/${sessionId}/targets/${scope.targetId}/resume.pdf`,
    }
  }

  return {
    docxPath: `${userId}/${sessionId}/resume.docx`,
    pdfPath: `${userId}/${sessionId}/resume.pdf`,
  }
}

export async function createSignedResumeArtifactUrls(
  docxPath: string,
  pdfPath: string,
  supabase: SupabaseClient = generateFileDeps.getSupabase(),
): Promise<SignedResumeArtifactUrls> {
  const [{ data: docxSigned, error: docxError }, { data: pdfSigned, error: pdfError }] = await Promise.all([
    supabase.storage.from('resumes').createSignedUrl(docxPath, 3600),
    supabase.storage.from('resumes').createSignedUrl(pdfPath, 3600),
  ])

  if (docxError || !docxSigned?.signedUrl || pdfError || !pdfSigned?.signedUrl) {
    throw new Error('Failed to create signed download URLs.')
  }

  return {
    docxUrl: docxSigned.signedUrl,
    pdfUrl: pdfSigned.signedUrl,
  }
}

export async function generateFile(
  input: GenerateFileInput,
  userId: string,
  sessionId: string,
  scope: ArtifactScope = { type: 'session' },
): Promise<GenerateFileExecutionResult> {
  let docxPath: string | undefined
  let pdfPath: string | undefined

  const validation = validateGenerationCvState(input.cv_state)
  if (!validation.success) {
    return {
      output: toolFailure(TOOL_ERROR_CODES.VALIDATION_ERROR, validation.errorMessage),
      patch: scope.type === 'session'
        ? createFailurePatch(validation.errorMessage, docxPath, pdfPath)
        : undefined,
      generatedOutput: createGeneratedOutput('failed', validation.errorMessage, docxPath, pdfPath),
    }
  }

  try {
    const supabase = generateFileDeps.getSupabase()

    const [docxBuffer, pdfBuffer] = await Promise.all([
      generateFileDeps.generateDOCX(validation.cvState),
      generateFileDeps.generatePDF(validation.cvState),
    ])

    const artifactPaths = buildArtifactPaths(userId, sessionId, scope)
    docxPath = artifactPaths.docxPath
    pdfPath = artifactPaths.pdfPath

    await Promise.all([
      generateFileDeps.upload(
        supabase,
        docxPath,
        docxBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
      generateFileDeps.upload(
        supabase,
        pdfPath,
        pdfBuffer,
        'application/pdf',
      ),
    ])

    const signedUrls = await createSignedResumeArtifactUrls(docxPath, pdfPath, supabase)

    return {
      output: { success: true, docxUrl: signedUrls.docxUrl, pdfUrl: signedUrls.pdfUrl },
      patch: scope.type === 'session' ? createSuccessPatch(docxPath, pdfPath) : undefined,
      generatedOutput: createGeneratedOutput('ready', undefined, docxPath, pdfPath),
    }
  } catch (err) {
    console.error('[generateFile]', err)

    const error = err instanceof Error && err.message
      ? err.message
      : 'File generation failed.'

    return {
      output: toolFailure(TOOL_ERROR_CODES.GENERATION_ERROR, 'File generation failed.'),
      patch: scope.type === 'session' ? createFailurePatch(error, docxPath, pdfPath) : undefined,
      generatedOutput: createGeneratedOutput('failed', error, docxPath, pdfPath),
    }
  }
}

export async function generateDOCX(cv: CVState): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'src/lib/templates/ats-standard.docx')
  const content = readFileSync(templatePath, 'binary')
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

  doc.render({
    full_name: cv.fullName,
    email: cv.email,
    phone: cv.phone,
    linkedin: cv.linkedin ?? '',
    location: cv.location ?? '',
    summary: cv.summary,
    experience: cv.experience.map(entry => ({
      ...entry,
      bullets_text: entry.bullets.join('\n'),
    })),
    skills: cv.skills.join(', '),
    education: cv.education,
    certifications: cv.certifications ?? [],
  })

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

export async function generatePDF(cv: CVState): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let currentY = PAGE_HEIGHT - MARGIN

  function drawText(
    activePage: typeof page,
    text: string,
    x: number,
    y: number,
    size: number,
    activeFont: typeof font,
    color = rgb(0, 0, 0),
  ): number {
    activePage.drawText(text, { x, y, size, font: activeFont, color })
    return y - size - 4
  }

  function drawLine(activePage: typeof page, y: number): void {
    activePage.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
  }

  function wrapText(text: string, activeFont: typeof font, size: number, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = activeFont.widthOfTextAtSize(testLine, size)

      if (width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  function drawSectionHeading(activePage: typeof page, title: string, y: number): number {
    let nextY = y - 12
    activePage.drawText(title.toUpperCase(), {
      x: MARGIN,
      y: nextY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    nextY -= 16
    drawLine(activePage, nextY)
    return nextY - 6
  }

  function checkPageOverflow(y: number): typeof page {
    if (y < MARGIN + 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      currentY = PAGE_HEIGHT - MARGIN
    }

    return page
  }

  currentY = drawText(page, cv.fullName, MARGIN, currentY, 18, fontBold)

  const contactParts = [cv.email, cv.phone, cv.linkedin, cv.location].filter(Boolean)
  const contactLine = contactParts.join('  |  ')
  currentY = drawText(page, contactLine, MARGIN, currentY, 10, font)
  currentY -= 6
  drawLine(page, currentY)
  currentY -= 12

  if (cv.summary) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Resumo Profissional', currentY)

    const summaryLines = wrapText(cv.summary, font, 10, USABLE_WIDTH)
    for (const line of summaryLines) {
      page = checkPageOverflow(currentY)
      currentY = drawText(page, line, MARGIN, currentY, 10, font)
    }
    currentY -= 6
  }

  if (cv.experience.length > 0) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Experiencia Profissional', currentY)

    for (const experience of cv.experience) {
      page = checkPageOverflow(currentY)
      const titleLine = `${experience.title} - ${experience.company}`
      currentY = drawText(page, titleLine, MARGIN, currentY, 12, fontBold)

      const dateRange = `${experience.startDate} - ${experience.endDate}`
      currentY = drawText(page, dateRange, MARGIN, currentY, 10, font, rgb(0.3, 0.3, 0.3))
      currentY -= 2

      for (const bullet of experience.bullets) {
        page = checkPageOverflow(currentY)
        const bulletLines = wrapText(bullet, font, 10, USABLE_WIDTH - 15)

        for (let lineIndex = 0; lineIndex < bulletLines.length; lineIndex++) {
          page = checkPageOverflow(currentY)
          const prefix = lineIndex === 0 ? '- ' : '  '
          currentY = drawText(page, prefix + bulletLines[lineIndex], MARGIN + 15, currentY, 10, font)
        }
      }
      currentY -= 6
    }
  }

  if (cv.skills.length > 0) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Habilidades', currentY)

    const skillsText = cv.skills.join(', ')
    const skillsLines = wrapText(skillsText, font, 10, USABLE_WIDTH)
    for (const line of skillsLines) {
      page = checkPageOverflow(currentY)
      currentY = drawText(page, line, MARGIN, currentY, 10, font)
    }
    currentY -= 6
  }

  if (cv.education.length > 0) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Formacao Academica', currentY)

    for (const education of cv.education) {
      page = checkPageOverflow(currentY)
      const educationLine = `${education.degree} - ${education.institution} - ${education.year}`
      currentY = drawText(page, educationLine, MARGIN, currentY, 10, font)
    }
    currentY -= 6
  }

  if (cv.certifications && cv.certifications.length > 0) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Certificacoes', currentY)

    for (const certification of cv.certifications) {
      page = checkPageOverflow(currentY)
      const certificationLine = `${certification.name} - ${certification.issuer}${certification.year ? `  ${certification.year}` : ''}`
      currentY = drawText(page, certificationLine, MARGIN, currentY, 10, font)
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

async function upload(
  supabase: SupabaseClient,
  filePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from('resumes')
    .upload(filePath, buffer, { contentType, upsert: true })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }
}

export const generateFileDeps = {
  getSupabase,
  generateDOCX,
  generatePDF,
  upload,
}

export type { GenerateFileExecutionResult, SupabaseStorageClient }
