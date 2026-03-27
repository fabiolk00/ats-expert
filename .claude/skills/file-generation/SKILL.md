# Skill: File Generation

Auto-invoked when working on resume output generation.

## Current implementation
- Tool entrypoint: `src/lib/agent/tools/generate-file.ts`
- Input: canonical `cv_state`
- DOCX generation: Docxtemplater + PizZip
- PDF generation: `pdf-lib`
- Upload target: Supabase Storage bucket `resumes`
- Returned to client: signed URLs
- Persisted in session or target: artifact metadata only

## Current pipeline

```text
canonical cv_state
  -> generate DOCX from template
  -> generate PDF directly with pdf-lib
  -> upload both files to Supabase Storage
  -> create signed URLs
  -> return tool output
  -> persist artifact metadata on the owning record
```

## Storage contract
Paths:
- `${userId}/${sessionId}/resume.docx`
- `${userId}/${sessionId}/resume.pdf`
- `${userId}/${sessionId}/targets/${targetId}/resume.docx`
- `${userId}/${sessionId}/targets/${targetId}/resume.pdf`

Persisted metadata:
- `status`
- `docxPath`
- `pdfPath`
- `generatedAt`
- `error`

Not persisted:
- `docxUrl`
- `pdfUrl`

## Rules
- Read only canonical `cvState`
- Read `resume_targets.derivedCvState` only when a validated target is explicitly selected
- Do not reconstruct resume state from chat history or transient tool input
- Keep tool output client-compatible
- On failure, persist `generatedOutput.status = 'failed'` with an explicit error

## Important realities
- `/api/file/[sessionId]` can mint fresh signed URLs from persisted storage paths
- `src/lib/storage/` is not the active implementation path
- There is no LibreOffice conversion pipeline in the live system

## Canonical vs Target-Derived Input
- Generation reads canonical base `cvState` unless a caller explicitly chooses a validated target-derived `CVState` from `resume_targets`.
- Base artifacts persist to `session.generatedOutput`; target artifacts persist to `resume_targets.generatedOutput`.
- Signed URLs remain transient and must not be persisted.
