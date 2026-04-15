import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentAppUser } from '@/lib/auth/app-user'
import { logError, logInfo, serializeError } from '@/lib/observability/structured-log'
import {
  getExistingUserProfile,
  type UserProfileRow,
} from '@/lib/profile/user-profiles'
import { importPdfProfile } from '@/lib/profile/pdf-import'
import {
  createPdfImportJob,
} from '@/lib/profile/pdf-import-jobs'

export const runtime = 'nodejs'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_ASYNC_PDF_IMPORT_THRESHOLD_BYTES = 1 * 1024 * 1024

const FileMetadataSchema = z.object({
  type: z.literal('application/pdf'),
  size: z.number().positive().max(MAX_FILE_SIZE_BYTES),
})

const AUTH_REQUIRED_MESSAGE = 'Voce precisa estar autenticado para importar um curriculo.'
const MISSING_FILE_MESSAGE = 'Selecione um arquivo PDF para importar.'
const INVALID_FILE_TYPE_MESSAGE = 'Envie um arquivo PDF.'
const FILE_TOO_LARGE_MESSAGE = 'Arquivo muito grande. Envie um curriculo de ate 5 MB.'
const SCANNED_PDF_MESSAGE = 'Nao conseguimos extrair texto desse PDF. Se ele for escaneado, tente outro PDF com texto selecionavel ou preencha manualmente.'
const EXTRACTION_FAILURE_MESSAGE = 'Nao foi possivel identificar dados suficientes no arquivo enviado.'
const NO_PROFILE_CHANGES_MESSAGE = 'Esse arquivo nao trouxe novas informacoes para o seu perfil atual.'
const REPLACE_LINKEDIN_CONFIRMATION_MESSAGE = 'Voce ja importou seu perfil pelo LinkedIn. Confirme se deseja substituir essas informacoes pelo PDF.'
const START_IMPORT_FAILURE_MESSAGE = 'Nao foi possivel importar seu curriculo agora. Tente novamente em instantes.'

function resolveAsyncPdfImportThresholdBytes(): number {
  const parsed = Number.parseInt(process.env.PDF_IMPORT_ASYNC_THRESHOLD_BYTES ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_ASYNC_PDF_IMPORT_THRESHOLD_BYTES
}

function mapProfileResponse(data: UserProfileRow) {
  return {
    id: data.id,
    source: data.source,
    cvState: data.cv_state,
    linkedinUrl: data.linkedin_url,
    profilePhotoUrl: data.profile_photo_url,
    extractedAt: data.extracted_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function POST(req: NextRequest) {
  const appUser = await getCurrentAppUser(req)
  if (!appUser) {
    logError('[api/profile/upload] Unauthorized access attempt')
    return NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    logError('[api/profile/upload] Invalid multipart payload', { appUserId: appUser.id })
    return NextResponse.json({ error: MISSING_FILE_MESSAGE }, { status: 400 })
  }

  const uploadedFile = formData.get('file')
  const replaceLinkedinImport = formData.get('replaceLinkedinImport') === 'true'
  if (
    !uploadedFile
    || typeof uploadedFile === 'string'
    || typeof uploadedFile.arrayBuffer !== 'function'
  ) {
    return NextResponse.json({ error: MISSING_FILE_MESSAGE }, { status: 400 })
  }

  const metadata = FileMetadataSchema.safeParse({
    type: uploadedFile.type,
    size: uploadedFile.size,
  })

  if (!metadata.success) {
    const firstIssue = metadata.error.issues[0]
    const errorMessage = firstIssue?.path[0] === 'size'
      ? FILE_TOO_LARGE_MESSAGE
      : INVALID_FILE_TYPE_MESSAGE

    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  try {
    const existingProfile = await getExistingUserProfile(appUser.id)
    if (existingProfile?.source === 'linkedin' && !replaceLinkedinImport) {
      return NextResponse.json(
        {
          error: REPLACE_LINKEDIN_CONFIRMATION_MESSAGE,
          requiresConfirmation: true,
        },
        { status: 409 },
      )
    }

    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer())

    const asyncThresholdBytes = resolveAsyncPdfImportThresholdBytes()

    if (uploadedFile.size > asyncThresholdBytes) {
      const { jobId } = await createPdfImportJob({
        appUserId: appUser.id,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        replaceLinkedinImport,
        fileBuffer,
      })

      logInfo('[api/profile/upload] PDF import queued', {
        appUserId: appUser.id,
        jobId,
        fileSize: uploadedFile.size,
        fileName: uploadedFile.name,
        status: 'pending',
        processingMode: 'async_job',
        asyncThresholdBytes,
      })

      return NextResponse.json(
        {
          success: true,
          jobId,
          status: 'pending',
        },
        { status: 202 },
      )
    }

    const result = await importPdfProfile({
      appUserId: appUser.id,
      fileBuffer,
      replaceLinkedinImport,
      signal: req.signal,
    })

    if (!result.success) {
      if (result.error === SCANNED_PDF_MESSAGE || result.error === EXTRACTION_FAILURE_MESSAGE) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      if (result.error === NO_PROFILE_CHANGES_MESSAGE) {
        return NextResponse.json({ error: result.error }, { status: 409 })
      }

      if (result.error === REPLACE_LINKEDIN_CONFIRMATION_MESSAGE) {
        return NextResponse.json(
          {
            error: result.error,
            requiresConfirmation: true,
          },
          { status: 409 },
        )
      }

      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    logInfo('[api/profile/upload] Resume imported', {
      appUserId: appUser.id,
      fileType: metadata.data.type,
      fileSize: uploadedFile.size,
      replaceLinkedinImport,
      processingMode: 'inline_sync',
      asyncThresholdBytes,
      strategy: result.strategy,
      changedFields: result.changedFields.join(','),
      preservedFields: result.preservedFields.join(','),
    })

    return NextResponse.json({
      success: true,
      profile: mapProfileResponse(result.profile),
      strategy: result.strategy,
      changedFields: result.changedFields,
      preservedFields: result.preservedFields,
      warning: result.warning,
    })
  } catch (error) {
    logError('[api/profile/upload] Failed to import profile', {
      appUserId: appUser.id,
      ...serializeError(error),
    })

    return NextResponse.json(
      { error: START_IMPORT_FAILURE_MESSAGE },
      { status: 500 },
    )
  }
}
