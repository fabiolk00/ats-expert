import { createDatabaseId } from '@/lib/db/ids'
import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import { createInsertTimestamps, createUpdatedAtTimestamp } from '@/lib/db/timestamps'
import { logError, logInfo, logWarn } from '@/lib/observability/structured-log'
import { importPdfProfile } from '@/lib/profile/pdf-import'

export type PdfImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type PdfImportJobRow = {
  id: string
  user_id: string
  storage_path: string
  source_file_name: string
  source_file_size: number
  status: PdfImportJobStatus
  replace_linkedin_import: boolean
  error_message: string | null
  warning_message: string | null
  claimed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

const IMPORT_BUCKET = 'resumes'
const STALE_PROCESSING_MINUTES = 5

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().toLowerCase()
  const safe = trimmed.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-')
  return safe.endsWith('.pdf') ? safe : `${safe || 'resume'}.pdf`
}

function buildStoragePath(appUserId: string, jobId: string, fileName: string): string {
  return `imports/${appUserId}/${jobId}/${sanitizeFilename(fileName)}`
}

function isStaleProcessing(job: PdfImportJobRow): boolean {
  if (job.status !== 'processing' || !job.claimed_at) {
    return false
  }

  const claimedAtMs = new Date(job.claimed_at).getTime()
  return Date.now() - claimedAtMs > STALE_PROCESSING_MINUTES * 60 * 1000
}

async function removeSourceFile(storagePath: string): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.storage.from(IMPORT_BUCKET).remove([storagePath])

  if (error) {
    logWarn('[pdf-import-jobs] Failed to remove temporary source file', {
      storagePath,
      errorMessage: error.message,
    })
  }
}

async function downloadSourceFile(storagePath: string): Promise<Buffer> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage.from(IMPORT_BUCKET).download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download temporary import file: ${error?.message ?? 'missing blob'}`)
  }

  return Buffer.from(await data.arrayBuffer())
}

async function atomicClaim(
  jobId: string,
  appUserId: string,
  fromStatus: PdfImportJobStatus,
  expectedClaimedAt?: string,
): Promise<PdfImportJobRow | null> {
  const supabase = getSupabaseAdminClient()
  const claimedAt = new Date().toISOString()

  let query = supabase
    .from('pdf_import_jobs')
    .update({
      status: 'processing' as PdfImportJobStatus,
      claimed_at: claimedAt,
      error_message: null,
      warning_message: null,
      ...createUpdatedAtTimestamp(),
    })
    .eq('id', jobId)
    .eq('user_id', appUserId)
    .eq('status', fromStatus)

  if (expectedClaimedAt !== undefined) {
    query = query.eq('claimed_at', expectedClaimedAt)
  }

  const { data, error } = await query.select('*').single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to claim PDF import job: ${error.message}`)
  }

  return (data as PdfImportJobRow | null) ?? null
}

async function persistTerminalStatus(
  jobId: string,
  ownerClaimedAt: string,
  status: 'completed' | 'failed',
  fields: {
    errorMessage?: string
    warningMessage?: string
  },
): Promise<PdfImportJobRow> {
  const supabase = getSupabaseAdminClient()
  const update: Record<string, unknown> = {
    status,
    completed_at: new Date().toISOString(),
    ...createUpdatedAtTimestamp(),
  }

  if (fields.errorMessage !== undefined) {
    update.error_message = fields.errorMessage.slice(0, 500)
  }

  if (fields.warningMessage !== undefined) {
    update.warning_message = fields.warningMessage.slice(0, 500)
  }

  const { data, error } = await supabase
    .from('pdf_import_jobs')
    .update(update)
    .eq('id', jobId)
    .eq('claimed_at', ownerClaimedAt)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Failed to persist PDF import job terminal status: ${error?.message ?? 'no row returned'}`)
  }

  return data as PdfImportJobRow
}

async function processClaimedJob(job: PdfImportJobRow): Promise<void> {
  try {
    const fileBuffer = await downloadSourceFile(job.storage_path)
    const result = await importPdfProfile({
      appUserId: job.user_id,
      fileBuffer,
      replaceLinkedinImport: job.replace_linkedin_import,
    })

    if (!result.success) {
      await persistTerminalStatus(job.id, job.claimed_at!, 'failed', {
        errorMessage: result.error,
      })

      logWarn('[pdf-import-jobs] Job failed', {
        jobId: job.id,
        appUserId: job.user_id,
        status: 'failed',
        errorMessage: result.error,
      })
      return
    }

    await persistTerminalStatus(job.id, job.claimed_at!, 'completed', {
      warningMessage: result.warning,
    })

    logInfo('[pdf-import-jobs] Job completed', {
      jobId: job.id,
      appUserId: job.user_id,
      status: 'completed',
      strategy: result.strategy,
      changedFields: result.changedFields.join(','),
      preservedFields: result.preservedFields.join(','),
      warningPresent: Boolean(result.warning),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError('[pdf-import-jobs] Job processing threw', {
      jobId: job.id,
      appUserId: job.user_id,
      errorMessage,
    })

    try {
      await persistTerminalStatus(job.id, job.claimed_at!, 'failed', {
        errorMessage: 'Nao foi possivel importar seu curriculo agora. Tente novamente em instantes.',
      })
    } catch (persistError) {
      logError('[pdf-import-jobs] Failed to persist job failure', {
        jobId: job.id,
        appUserId: job.user_id,
        errorMessage: persistError instanceof Error ? persistError.message : String(persistError),
      })
    }
  } finally {
    await removeSourceFile(job.storage_path)
  }
}

export async function createPdfImportJob(input: {
  appUserId: string
  fileName: string
  fileSize: number
  replaceLinkedinImport: boolean
  fileBuffer: Buffer
}): Promise<{ jobId: string }> {
  const supabase = getSupabaseAdminClient()
  const jobId = createDatabaseId()
  const storagePath = buildStoragePath(input.appUserId, jobId, input.fileName)

  const { error: uploadError } = await supabase.storage
    .from(IMPORT_BUCKET)
    .upload(storagePath, input.fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload temporary PDF import file: ${uploadError.message}`)
  }

  const { data, error } = await supabase
    .from('pdf_import_jobs')
    .insert({
      id: jobId,
      user_id: input.appUserId,
      storage_path: storagePath,
      source_file_name: input.fileName,
      source_file_size: input.fileSize,
      replace_linkedin_import: input.replaceLinkedinImport,
      status: 'pending' as PdfImportJobStatus,
      ...createInsertTimestamps(),
    })
    .select('id')
    .single()

  if (error || !data) {
    await removeSourceFile(storagePath)
    throw new Error(`Failed to create PDF import job: ${error?.message ?? 'no row returned'}`)
  }

  logInfo('[pdf-import-jobs] Job created', {
    jobId: data.id,
    appUserId: input.appUserId,
    fileSize: input.fileSize,
  })

  return { jobId: data.id }
}

export async function getPdfImportJob(
  jobId: string,
  appUserId: string,
): Promise<PdfImportJobRow | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('pdf_import_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', appUserId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get PDF import job: ${error.message}`)
  }

  return (data as PdfImportJobRow | null) ?? null
}

export async function startPdfImportJobProcessing(
  jobId: string,
  appUserId: string,
): Promise<PdfImportJobRow> {
  let claimed = await atomicClaim(jobId, appUserId, 'pending')

  if (!claimed) {
    const current = await getPdfImportJob(jobId, appUserId)
    if (!current) {
      throw new Error('PDF import job not found')
    }

    if (isStaleProcessing(current)) {
      logInfo('[pdf-import-jobs] Reclaiming stale processing job', {
        jobId,
        appUserId,
        claimedAt: current.claimed_at,
      })
      claimed = await atomicClaim(jobId, appUserId, 'processing', current.claimed_at!)
    }

    if (!claimed) {
      return current
    }
  }

  queueMicrotask(() => {
    void processClaimedJob(claimed!).catch((error) => {
      logError('[pdf-import-jobs] Background processing failed', {
        jobId: claimed?.id,
        appUserId: claimed?.user_id,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
    })
  })

  return claimed
}

export async function cleanupOldPdfImportJobs(daysOld: number = 1): Promise<number> {
  const supabase = getSupabaseAdminClient()
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('pdf_import_jobs')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('created_at', cutoff)
    .select('id, storage_path')

  if (error) {
    throw new Error(`Failed to cleanup PDF import jobs: ${error.message}`)
  }

  const deletedRows = (data ?? []) as Array<{ id: string; storage_path: string | null }>
  const removablePaths = deletedRows
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path))

  if (removablePaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(IMPORT_BUCKET).remove(removablePaths)
    if (removeError) {
      logWarn('[pdf-import-jobs] Failed to cleanup temporary files', {
        errorMessage: removeError.message,
        removablePaths: removablePaths.length,
      })
    }
  }

  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000).toISOString()
  const { data: resetData, error: resetError } = await supabase
    .from('pdf_import_jobs')
    .update({
      status: 'pending' as PdfImportJobStatus,
      claimed_at: null,
      error_message: null,
      warning_message: null,
      ...createUpdatedAtTimestamp(),
    })
    .eq('status', 'processing')
    .lt('claimed_at', staleCutoff)
    .select('id')

  if (resetError) {
    throw new Error(`Failed to reset stale PDF import jobs: ${resetError.message}`)
  }

  return deletedRows.length + (resetData?.length ?? 0)
}
