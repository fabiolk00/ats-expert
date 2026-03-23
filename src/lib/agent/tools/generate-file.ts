import { readFileSync } from 'fs'
import path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { GenerateFileInput, GenerateFileOutput } from '@/types/agent'
import type { CVState } from '@/types/cv'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const MARGIN = 50
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN

export async function generateFile(
  input: GenerateFileInput,
  userId: string,
  sessionId: string,
): Promise<GenerateFileOutput> {
  try {
    const supabase = getSupabase()

    // Run both in parallel
    const [docxBuffer, pdfBuffer] = await Promise.all([
      generateDOCX(input.cv_state),
      generatePDF(input.cv_state),
    ])

    const docxPath = `${userId}/${sessionId}/resume.docx`
    const pdfPath = `${userId}/${sessionId}/resume.pdf`

    await Promise.all([
      upload(supabase, docxPath, docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      upload(supabase, pdfPath, pdfBuffer, 'application/pdf'),
    ])

    const { data: docxSigned } = await supabase.storage.from('resumes').createSignedUrl(docxPath, 3600)
    const { data: pdfSigned } = await supabase.storage.from('resumes').createSignedUrl(pdfPath, 3600)

    if (!docxSigned || !pdfSigned) {
      return { success: false, error: 'Failed to create signed download URLs.' }
    }

    return { success: true, docxUrl: docxSigned.signedUrl, pdfUrl: pdfSigned.signedUrl }
  } catch (err) {
    console.error('[generateFile]', err)
    return { success: false, error: 'File generation failed.' }
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
    experience: cv.experience.map(e => ({
      ...e,
      bullets_text: e.bullets.join('\n'),
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

  // Helper functions
  function drawText(
    p: typeof page,
    text: string,
    x: number,
    y: number,
    size: number,
    f: typeof font,
    color = rgb(0, 0, 0)
  ): number {
    p.drawText(text, { x, y, size, font: f, color })
    return y - size - 4
  }

  function drawLine(p: typeof page, y: number): void {
    p.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
  }

  function wrapText(text: string, f: typeof font, size: number, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = f.widthOfTextAtSize(testLine, size)

      if (width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) lines.push(currentLine)
    return lines
  }

  function drawSectionHeading(p: typeof page, title: string, y: number): number {
    let newY = y - 12 // gap before
    p.drawText(title.toUpperCase(), {
      x: MARGIN,
      y: newY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    newY -= 10 + 6 // text height + gap after
    drawLine(p, newY)
    return newY - 6
  }

  function checkPageOverflow(y: number): typeof page {
    if (y < MARGIN + 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      currentY = PAGE_HEIGHT - MARGIN
      return page
    }
    return page
  }

  // 1. Header - full name
  currentY = drawText(page, cv.fullName, MARGIN, currentY, 18, fontBold)

  // Contact line
  const contactParts = [cv.email, cv.phone, cv.linkedin, cv.location].filter(Boolean)
  const contactLine = contactParts.join('  |  ')
  currentY = drawText(page, contactLine, MARGIN, currentY, 10, font)
  currentY -= 6
  drawLine(page, currentY)
  currentY -= 12

  // 2. Summary
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

  // 3. Experience
  if (cv.experience.length > 0) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Experiência Profissional', currentY)

    for (const exp of cv.experience) {
      page = checkPageOverflow(currentY)

      // Title and company
      const titleLine = `${exp.title} — ${exp.company}`
      currentY = drawText(page, titleLine, MARGIN, currentY, 12, fontBold)

      // Date range
      const dateRange = `${exp.startDate} – ${exp.endDate}`
      currentY = drawText(page, dateRange, MARGIN, currentY, 10, font, rgb(0.3, 0.3, 0.3))
      currentY -= 2

      // Bullets
      for (const bullet of exp.bullets) {
        page = checkPageOverflow(currentY)
        const bulletLines = wrapText(bullet, font, 10, USABLE_WIDTH - 15)

        for (let i = 0; i < bulletLines.length; i++) {
          page = checkPageOverflow(currentY)
          const prefix = i === 0 ? '• ' : '  '
          currentY = drawText(page, prefix + bulletLines[i], MARGIN + 15, currentY, 10, font)
        }
      }
      currentY -= 6
    }
  }

  // 4. Skills
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

  // 5. Education
  if (cv.education.length > 0) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Formação Acadêmica', currentY)

    for (const edu of cv.education) {
      page = checkPageOverflow(currentY)
      const eduLine = `${edu.degree} — ${edu.institution} — ${edu.year}`
      currentY = drawText(page, eduLine, MARGIN, currentY, 10, font)
    }
    currentY -= 6
  }

  // 6. Certifications
  if (cv.certifications && cv.certifications.length > 0) {
    page = checkPageOverflow(currentY)
    currentY = drawSectionHeading(page, 'Certificações', currentY)

    for (const cert of cv.certifications) {
      page = checkPageOverflow(currentY)
      const certLine = `${cert.name} — ${cert.issuer}  ${cert.year}`
      currentY = drawText(page, certLine, MARGIN, currentY, 10, font)
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

async function upload(supabase: ReturnType<typeof getSupabase>, filePath: string, buffer: Buffer, contentType: string): Promise<void> {
  const { error } = await supabase.storage
    .from('resumes')
    .upload(filePath, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)
}
