create index if not exists credit_reservations_status_reconciliation_idx
  on credit_reservations(status, reconciliation_status);

create index if not exists credit_ledger_entries_reservation_created_idx
  on credit_ledger_entries(reservation_id, created_at desc);

create index if not exists jobs_status_updated_created_idx
  on jobs(status, updated_at desc, created_at desc);
