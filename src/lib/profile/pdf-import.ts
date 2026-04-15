import { ingestResumeText } from '@/lib/agent/tools/resume-ingestion'
import { parseFile } from '@/lib/agent/tools/parse-file'
import { logInfo, logWarn } from '@/lib/observability/structured-log'
import {
  getExistingUserProfile,
  saveImportedUserProfile,
  type UserProfileRow,
} from '@/lib/profile/user-profiles'
import type { CVState } from '@/types/cv'

export const PDF_IMPORT_ERROR_CODES = {
  SCANNED_PDF: 'SCANNED_PDF',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  NO_PROFILE_CHANGES: 'NO_PROFILE_CHANGES',
  LINKEDIN_REPLACEMENT_REQUIRED: 'LINKEDIN_REPLACEMENT_REQUIRED',
} as const

export type PdfImportErrorCode = typeof PDF_IMPORT_ERROR_CODES[keyof typeof PDF_IMPORT_ERROR_CODES]

export type PdfImportResult =
  | {
      success: true
      profile: UserProfileRow
      warning?: string
      strategy: 'populate_empty' | 'merge_preserving_existing' | 'unstructured_only'
      changedFields: string[]
      preservedFields: string[]
    }
  | {
      success: false
      code: PdfImportErrorCode
      error: string
    }

const SCANNED_PDF_MESSAGE = 'Não conseguimos extrair texto desse PDF. Se ele for escaneado, tente outro PDF com texto selecionável ou preencha manualmente.'
const EXTRACTION_FAILURE_MESSAGE = 'Não foi possível identificar dados suficientes no arquivo enviado.'
const NO_PROFILE_CHANGES_MESSAGE = 'Esse arquivo não trouxe novas informações para o seu perfil atual.'
const REPLACE_LINKEDIN_CONFIRMATION_MESSAGE = 'Você já importou seu perfil pelo LinkedIn. Confirme se deseja substituir essas informações pelo PDF.'

function createEmptyCvState(): CVState {
  return {
    fullName: '',
    email: '',
    phone: '',
    summary: '',
    experience: [],
    skills: [],
    education: [],
  }
}

function mergeCvState(currentCvState: CVState, patch?: Partial<CVState>): CVState {
  if (!patch) {
    return currentCvState
  }

  return {
    ...currentCvState,
    ...patch,
    certifications: patch.certifications ?? currentCvState.certifications,
  }
}

function shouldReplaceImportedProfile(
  existingProfile: Pick<UserProfileRow, 'source'> | null,
  replaceLinkedinImport: boolean,
) {
  if (!existingProfile) {
    return false
  }

  return existingProfile.source === 'pdf'
    || (existingProfile.source === 'linkedin' && replaceLinkedinImport)
}

export async function importPdfProfile(params: {
  appUserId: string
  fileBuffer: Buffer
  replaceLinkedinImport: boolean
  signal?: AbortSignal
}): Promise<PdfImportResult> {
  const { appUserId, fileBuffer, replaceLinkedinImport, signal } = params

  const parsedFile = await parseFile(
    {
      file_base64: fileBuffer.toString('base64'),
      mime_type: 'application/pdf',
    },
    appUserId,
    undefined,
    signal,
  )

  if (!parsedFile.success) {
    return parsedFile.error.startsWith('PDF_SCANNED')
      ? {
          success: false,
          code: PDF_IMPORT_ERROR_CODES.SCANNED_PDF,
          error: SCANNED_PDF_MESSAGE,
        }
      : {
          success: false,
          code: PDF_IMPORT_ERROR_CODES.EXTRACTION_FAILED,
          error: EXTRACTION_FAILURE_MESSAGE,
        }
  }

  const existingProfile = await getExistingUserProfile(appUserId)
  if (existingProfile?.source === 'linkedin' && !replaceLinkedinImport) {
    return {
      success: false,
      code: PDF_IMPORT_ERROR_CODES.LINKEDIN_REPLACEMENT_REQUIRED,
      error: REPLACE_LINKEDIN_CONFIRMATION_MESSAGE,
    }
  }

  const replaceImportedProfile = shouldReplaceImportedProfile(
    existingProfile,
    replaceLinkedinImport,
  )
  const currentCvState = existingProfile
    ? (
      replaceImportedProfile
        ? createEmptyCvState()
        : existingProfile.cv_state
    )
    : createEmptyCvState()

  const ingestionResult = await ingestResumeText(
    parsedFile.text,
    currentCvState,
    appUserId,
    undefined,
    signal,
  )

  const nextCvState = mergeCvState(currentCvState, ingestionResult.patch?.cvState)

  if (ingestionResult.changedFields.length === 0 && !existingProfile) {
    return {
      success: false,
      code: PDF_IMPORT_ERROR_CODES.EXTRACTION_FAILED,
      error: EXTRACTION_FAILURE_MESSAGE,
    }
  }

  if (ingestionResult.changedFields.length === 0) {
    logInfo('[profile/pdf-import] Resume import skipped because no profile fields changed', {
      appUserId,
      strategy: ingestionResult.strategy,
      preservedFields: ingestionResult.preservedFields.join(','),
      existingProfileSource: existingProfile?.source ?? null,
    })

    return {
      success: false,
      code: PDF_IMPORT_ERROR_CODES.NO_PROFILE_CHANGES,
      error: NO_PROFILE_CHANGES_MESSAGE,
    }
  }

  const profile = await saveImportedUserProfile({
    appUserId,
    cvState: nextCvState,
    source: 'pdf',
    linkedinUrl: replaceImportedProfile ? nextCvState.linkedin ?? null : undefined,
    profilePhotoUrl: replaceImportedProfile ? null : undefined,
  })

  const warning = ingestionResult.confidenceScore !== undefined && ingestionResult.confidenceScore < 0.55
    ? 'Revise os dados importados antes de salvar. A confiança desta leitura foi baixa.'
    : undefined

  if (warning) {
    logWarn('[profile/pdf-import] Low-confidence import saved', {
      appUserId,
      strategy: ingestionResult.strategy,
      confidenceScore: ingestionResult.confidenceScore,
      changedFields: ingestionResult.changedFields.join(','),
    })
  }

  return {
    success: true,
    profile,
    warning,
    strategy: ingestionResult.strategy,
    changedFields: ingestionResult.changedFields,
    preservedFields: ingestionResult.preservedFields,
  }
}
