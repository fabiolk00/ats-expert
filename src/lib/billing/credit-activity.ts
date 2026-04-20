import {
  listCreditLedgerEntriesForUser,
  listCreditReservationsForUser,
  type CreditLedgerEntry,
  type CreditReservation,
} from '@/lib/db/credit-reservations'
import type { BillingHistory, BillingHistoryEntry } from '@/types/billing'

function buildReservationLookup(
  reservations: CreditReservation[],
): Map<string, CreditReservation> {
  return new Map(
    reservations.map((reservation) => [reservation.generationIntentKey, reservation]),
  )
}

function resolveHistoryCopy(
  ledgerEntry: CreditLedgerEntry,
  reservation: CreditReservation | undefined,
): Pick<BillingHistoryEntry, 'eventLabel' | 'eventStatus'> {
  if (ledgerEntry.entryType === 'reservation_hold') {
    return {
      eventLabel: 'Crédito reservado para exportação',
      eventStatus: 'pending',
    }
  }

  if (ledgerEntry.entryType === 'reservation_release') {
    return {
      eventLabel: 'Crédito liberado após falha na exportação',
      eventStatus: 'released',
    }
  }

  if (reservation?.status === 'needs_reconciliation') {
    return {
      eventLabel: 'Cobrança concluída com reconciliação pendente',
      eventStatus: 'attention',
    }
  }

  return {
    eventLabel: 'Exportação concluída e cobrada',
    eventStatus: 'completed',
  }
}

function mapBillingHistoryEntry(
  ledgerEntry: CreditLedgerEntry,
  reservation: CreditReservation | undefined,
): BillingHistoryEntry {
  const historyCopy = resolveHistoryCopy(ledgerEntry, reservation)

  return {
    createdAt: ledgerEntry.createdAt,
    generationIntentKey: ledgerEntry.generationIntentKey,
    reservationStatus: reservation?.status ?? 'needs_reconciliation',
    reconciliationStatus: reservation?.reconciliationStatus ?? 'pending',
    ledgerEntryType: ledgerEntry.entryType,
    creditsDelta: ledgerEntry.creditsDelta,
    eventLabel: historyCopy.eventLabel,
    eventStatus: historyCopy.eventStatus,
    jobId: ledgerEntry.jobId ?? reservation?.jobId,
    sessionId: ledgerEntry.sessionId ?? reservation?.sessionId,
    resumeTargetId: ledgerEntry.resumeTargetId ?? reservation?.resumeTargetId,
    resumeGenerationId: ledgerEntry.resumeGenerationId ?? reservation?.resumeGenerationId,
  }
}

export async function listBillingHistoryForUser(input: {
  userId: string
  limit?: number
}): Promise<BillingHistory> {
  const [ledgerEntries, reservations] = await Promise.all([
    listCreditLedgerEntriesForUser(input),
    listCreditReservationsForUser(input),
  ])
  const reservationLookup = buildReservationLookup(reservations)
  const entries = ledgerEntries
    .map((ledgerEntry) => mapBillingHistoryEntry(
      ledgerEntry,
      reservationLookup.get(ledgerEntry.generationIntentKey),
    ))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, input.limit ?? 50)

  return { entries }
}
