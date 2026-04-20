import type {
  CreditLedgerEntryType,
  CreditReservationReconciliationStatus,
  CreditReservationStatus,
} from '@/lib/db/credit-reservations'

export type BillingHistoryEventStatus = 'pending' | 'completed' | 'released' | 'attention'

export type BillingHistoryEntry = {
  createdAt: Date
  generationIntentKey: string
  reservationStatus: CreditReservationStatus
  reconciliationStatus: CreditReservationReconciliationStatus
  ledgerEntryType: CreditLedgerEntryType
  creditsDelta: number
  eventLabel: string
  eventStatus: BillingHistoryEventStatus
  jobId?: string
  sessionId?: string
  resumeTargetId?: string
  resumeGenerationId?: string
}

export type BillingHistory = {
  entries: BillingHistoryEntry[]
}
