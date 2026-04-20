import { getSupabaseAdminClient } from '@/lib/db/supabase-admin'
import type { ResumeGenerationType } from '@/types/agent'

export type CreditReservationStatus = 'reserved' | 'finalized' | 'released' | 'needs_reconciliation'
export type CreditReservationReconciliationStatus = 'clean' | 'pending' | 'repaired' | 'manual_review'
export type CreditLedgerEntryType = 'reservation_hold' | 'reservation_finalize' | 'reservation_release'

export type CreditReservation = {
  id: string
  userId: string
  generationIntentKey: string
  jobId?: string
  sessionId?: string
  resumeTargetId?: string
  resumeGenerationId?: string
  type: ResumeGenerationType
  status: CreditReservationStatus
  creditsReserved: number
  failureReason?: string
  reservedAt: Date
  finalizedAt?: Date
  releasedAt?: Date
  reconciliationStatus: CreditReservationReconciliationStatus
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export type CreditLedgerEntry = {
  id: string
  userId: string
  reservationId?: string
  generationIntentKey: string
  entryType: CreditLedgerEntryType
  creditsDelta: number
  balanceAfter?: number
  jobId?: string
  sessionId?: string
  resumeTargetId?: string
  resumeGenerationId?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

type CreditReservationRow = {
  id: string
  user_id: string
  generation_intent_key: string
  job_id?: string | null
  session_id?: string | null
  resume_target_id?: string | null
  resume_generation_id?: string | null
  type: ResumeGenerationType
  status: CreditReservationStatus
  credits_reserved: number
  failure_reason?: string | null
  reserved_at: string
  finalized_at?: string | null
  released_at?: string | null
  reconciliation_status: CreditReservationReconciliationStatus
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type CreditLedgerEntryRow = {
  id: string
  user_id: string
  reservation_id?: string | null
  generation_intent_key: string
  entry_type: CreditLedgerEntryType
  credits_delta: number
  balance_after?: number | null
  job_id?: string | null
  session_id?: string | null
  resume_target_id?: string | null
  resume_generation_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

type PostgrestErrorLike = {
  code?: string
  message?: string
}

type ReserveCreditReservationInput = {
  userId: string
  generationIntentKey: string
  generationType: ResumeGenerationType
  jobId?: string
  sessionId?: string
  resumeTargetId?: string
  resumeGenerationId?: string
  metadata?: Record<string, unknown>
}

type ReservationTransitionAction = 'finalize' | 'release'

type SettleCreditReservationInput = {
  userId: string
  generationIntentKey: string
  action: ReservationTransitionAction
  resumeGenerationId?: string
  metadata?: Record<string, unknown>
}

function isDuplicateKeyError(error: PostgrestErrorLike | null | undefined): boolean {
  if (!error) {
    return false
  }

  return error.code === '23505' || error.message?.toLowerCase().includes('duplicate key') === true
}

function isMissingReservationInfraError(message: string | undefined): boolean {
  const normalized = (message ?? '').toLowerCase()

  return (
    normalized.includes('does not exist')
    || normalized.includes('relation')
    || normalized.includes('function')
    || normalized.includes('column')
    || normalized.includes('type')
  )
}

function mapCreditReservationRow(row: CreditReservationRow): CreditReservation {
  return {
    id: row.id,
    userId: row.user_id,
    generationIntentKey: row.generation_intent_key,
    jobId: row.job_id ?? undefined,
    sessionId: row.session_id ?? undefined,
    resumeTargetId: row.resume_target_id ?? undefined,
    resumeGenerationId: row.resume_generation_id ?? undefined,
    type: row.type,
    status: row.status,
    creditsReserved: row.credits_reserved,
    failureReason: row.failure_reason ?? undefined,
    reservedAt: new Date(row.reserved_at),
    finalizedAt: row.finalized_at ? new Date(row.finalized_at) : undefined,
    releasedAt: row.released_at ? new Date(row.released_at) : undefined,
    reconciliationStatus: row.reconciliation_status,
    metadata: row.metadata ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapCreditLedgerEntryRow(row: CreditLedgerEntryRow): CreditLedgerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    reservationId: row.reservation_id ?? undefined,
    generationIntentKey: row.generation_intent_key,
    entryType: row.entry_type,
    creditsDelta: row.credits_delta,
    balanceAfter: row.balance_after ?? undefined,
    jobId: row.job_id ?? undefined,
    sessionId: row.session_id ?? undefined,
    resumeTargetId: row.resume_target_id ?? undefined,
    resumeGenerationId: row.resume_generation_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

export async function getCreditReservationByIntent(input: {
  userId: string
  generationIntentKey: string
}): Promise<CreditReservation | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('credit_reservations')
    .select('*')
    .eq('user_id', input.userId)
    .eq('generation_intent_key', input.generationIntentKey)
    .maybeSingle<CreditReservationRow>()

  if (error) {
    throw new Error(`Failed to load credit reservation by generation intent: ${error.message}`)
  }

  return data ? mapCreditReservationRow(data) : null
}

export async function listCreditReservationsForReconciliation(input: {
  userId?: string
  limit?: number
} = {}): Promise<CreditReservation[]> {
  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from('credit_reservations')
    .select('*')
    .in('status', ['reserved', 'needs_reconciliation'])

  if (input.userId) {
    query = query.eq('user_id', input.userId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(input.limit ?? 100)

  if (error) {
    throw new Error(`Failed to list credit reservations for reconciliation: ${error.message}`)
  }

  return (data ?? []).map((row) => mapCreditReservationRow(row as CreditReservationRow))
}

export async function listCreditReservationsForUser(input: {
  userId: string
  limit?: number
}): Promise<CreditReservation[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('credit_reservations')
    .select('*')
    .eq('user_id', input.userId)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 50)

  if (error) {
    throw new Error(`Failed to list credit reservations for user: ${error.message}`)
  }

  return (data ?? []).map((row) => mapCreditReservationRow(row as CreditReservationRow))
}

export async function markCreditReservationReconciliation(input: {
  reservationId: string
  status: CreditReservationStatus
  reconciliationStatus: CreditReservationReconciliationStatus
  failureReason?: string
  metadata?: Record<string, unknown>
}): Promise<CreditReservation> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('credit_reservations')
    .update({
      status: input.status,
      reconciliation_status: input.reconciliationStatus,
      failure_reason: input.failureReason ?? null,
      metadata: input.metadata ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.reservationId)
    .select('*')
    .single<CreditReservationRow>()

  if (error || !data) {
    throw new Error(`Failed to mark credit reservation reconciliation state: ${error?.message ?? 'Unknown error'}`)
  }

  return mapCreditReservationRow(data)
}

function assertReservationTransitionAllowed(
  reservation: CreditReservation,
  action: ReservationTransitionAction,
): void {
  if (reservation.status === 'reserved' || reservation.status === 'needs_reconciliation') {
    return
  }

  if (reservation.status === 'finalized' && action === 'finalize') {
    return
  }

  if (reservation.status === 'released' && action === 'release') {
    return
  }

  throw new Error(`Cannot ${action} credit reservation from ${reservation.status} state`)
}

export async function reserveCreditForGenerationIntent(
  input: ReserveCreditReservationInput,
): Promise<{ reservation: CreditReservation; wasCreated: boolean }> {
  const existingReservation = await getCreditReservationByIntent({
    userId: input.userId,
    generationIntentKey: input.generationIntentKey,
  })

  if (existingReservation) {
    return {
      reservation: existingReservation,
      wasCreated: false,
    }
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc('reserve_credit_for_generation_intent', {
    p_user_id: input.userId,
    p_generation_intent_key: input.generationIntentKey,
    p_generation_type: input.generationType,
    p_job_id: input.jobId ?? null,
    p_session_id: input.sessionId ?? null,
    p_resume_target_id: input.resumeTargetId ?? null,
    p_resume_generation_id: input.resumeGenerationId ?? null,
    p_metadata: input.metadata ?? null,
  })

  if (error && (isDuplicateKeyError(error) || isMissingReservationInfraError(error.message))) {
    const duplicatedReservation = await getCreditReservationByIntent({
      userId: input.userId,
      generationIntentKey: input.generationIntentKey,
    })

    if (duplicatedReservation) {
      return {
        reservation: duplicatedReservation,
        wasCreated: false,
      }
    }
  }

  if (error || !data) {
    throw new Error(`Failed to reserve credit for generation intent: ${error?.message ?? 'Unknown error'}`)
  }

  return {
    reservation: mapCreditReservationRow(data),
    wasCreated: true,
  }
}

export async function settleCreditReservationTransition(
  input: SettleCreditReservationInput,
): Promise<CreditReservation> {
  const reservation = await getCreditReservationByIntent({
    userId: input.userId,
    generationIntentKey: input.generationIntentKey,
  })

  if (!reservation) {
    throw new Error(`Credit reservation not found for generation intent: ${input.generationIntentKey}`)
  }

  assertReservationTransitionAllowed(reservation, input.action)
  if ((reservation.status === 'finalized' && input.action === 'finalize')
    || (reservation.status === 'released' && input.action === 'release')) {
    return {
      ...reservation,
      resumeGenerationId: input.resumeGenerationId ?? reservation.resumeGenerationId,
    }
  }

  const supabase = getSupabaseAdminClient()
  const rpcName = input.action === 'finalize'
    ? 'finalize_credit_reservation'
    : 'release_credit_reservation'
  const { data, error } = await supabase.rpc(rpcName, {
    p_user_id: input.userId,
    p_generation_intent_key: input.generationIntentKey,
    p_resume_generation_id: input.resumeGenerationId ?? null,
    p_metadata: input.metadata ?? null,
  })

  if (error || !data) {
    throw new Error(
      `Failed to ${input.action} credit reservation: ${error?.message ?? 'Unknown error'}`,
    )
  }

  return mapCreditReservationRow(data as CreditReservationRow)
}

export async function finalizeCreditReservation(input: {
  userId: string
  generationIntentKey: string
  resumeGenerationId?: string
  metadata?: Record<string, unknown>
}): Promise<CreditReservation> {
  return settleCreditReservationTransition({
    ...input,
    action: 'finalize',
  })
}

export async function releaseCreditReservation(input: {
  userId: string
  generationIntentKey: string
  resumeGenerationId?: string
  metadata?: Record<string, unknown>
}): Promise<CreditReservation> {
  return settleCreditReservationTransition({
    ...input,
    action: 'release',
  })
}

export async function getCreditLedgerEntriesForIntent(input: {
  userId: string
  generationIntentKey: string
}): Promise<CreditLedgerEntry[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('credit_ledger_entries')
    .select('*')
    .eq('user_id', input.userId)
    .eq('generation_intent_key', input.generationIntentKey)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load credit ledger entries for generation intent: ${error.message}`)
  }

  return (data ?? []).map((row) => mapCreditLedgerEntryRow(row as CreditLedgerEntryRow))
}

export async function listCreditLedgerEntriesForUser(input: {
  userId: string
  limit?: number
}): Promise<CreditLedgerEntry[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('credit_ledger_entries')
    .select('*')
    .eq('user_id', input.userId)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 50)

  if (error) {
    throw new Error(`Failed to list credit ledger entries for user: ${error.message}`)
  }

  return (data ?? []).map((row) => mapCreditLedgerEntryRow(row as CreditLedgerEntryRow))
}
