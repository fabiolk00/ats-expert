# Skill: File Generation

Auto-invoked when working on any file inside `src/lib/storage/` or `src/app/api/file/`.

## What this skill covers
Generating the final ATS-optimized DOCX and converting it to PDF, then uploading to Supabase Storage.

## Pipeline

```
cv_state (JSON)
  → fill DOCX template (Docxtemplater)
  → upload .docx to Supabase Storage
  → convert to PDF (LibreOffice headless)
  → upload .pdf to Supabase Storage
  → return { docxUrl, pdfUrl }
```

## DOCX template rules
Template lives at `src/lib/templates/ats-standard.docx`. Rules for the template:
- **Single column only** — no text boxes, no tables for layout
- **No images or logos** — header is plain text
- **Standard fonts only**: Calibri 11pt body, Calibri 14pt name, Calibri 12pt section headings
- **Section headings**: bold, ALL CAPS, followed by a simple horizontal line (not a border)
- **Margins**: 1.5cm all sides
- **Template tags**: use `{variable}` syntax for Docxtemplater

## Template variables
```
{full_name}
{email}  {phone}  {linkedin}  {location}
{summary}
{experience}     ← loop: {#experience}{title} at {company} | {startDate}–{endDate}\n{bullets_text}{/experience}
{skills}         ← comma-separated string
{education}      ← loop: {#education}{degree} — {institution} — {year}{/education}
{certifications} ← optional loop
```

## Docxtemplater setup

```ts
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { readFileSync } from 'fs'
import path from 'path'

export async function generateDOCX(cvState: CVState): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'src/lib/templates/ats-standard.docx')
  const content = readFileSync(templatePath, 'binary')
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

  doc.render({
    full_name:      cvState.fullName,
    email:          cvState.email,
    phone:          cvState.phone,
    linkedin:       cvState.linkedin ?? '',
    location:       cvState.location ?? '',
    summary:        cvState.summary,
    experience:     cvState.experience.map(e => ({ ...e, bullets_text: e.bullets.join('\n') })),
    skills:         cvState.skills.join(', '),
    education:      cvState.education,
    certifications: cvState.certifications ?? [],
  })

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}
```

## PDF conversion via LibreOffice

```ts
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

const execFileAsync = promisify(execFile)

export async function convertToPDF(docxBuffer: Buffer): Promise<Buffer> {
  if (process.env.PDF_DRIVER === 'mock') {
    return Buffer.from('%PDF-1.4 mock')
  }

  const tmpDir   = mkdtempSync(path.join(tmpdir(), 'curria-'))
  const docxPath = path.join(tmpDir, 'resume.docx')

  try {
    writeFileSync(docxPath, docxBuffer)
    await execFileAsync('libreoffice', [
      '--headless', '--convert-to', 'pdf', '--outdir', tmpDir, docxPath
    ])
    return readFileSync(path.join(tmpDir, 'resume.pdf'))
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}
```

Always use a temp directory per job — never reuse paths across concurrent requests.

## Supabase Storage upload

```ts
// Path pattern: {userId}/{sessionId}/{filename}
const docxPath = `${userId}/${sessionId}/resume.docx`
const pdfPath  = `${userId}/${sessionId}/resume.pdf`

await supabase.storage.from('resumes').upload(docxPath, docxBuffer, {
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  upsert: true,
})
```

Bucket `resumes` is private. Files are served via signed URLs (1-hour expiry) through `/api/file/[sessionId]`.
Never expose the service role key on the client — all signed URL generation happens server-side.

## Error handling
- LibreOffice not found → throw with message `PDF_UNAVAILABLE` — client should offer DOCX-only download
- Template rendering fails → log the Docxtemplater error and the cv_state keys, then throw
- Storage upload fails → throw with the Supabase error message
- Always clean up the temp directory after conversion, even on failure (use `try/finally`)
