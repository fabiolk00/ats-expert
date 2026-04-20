do $$
begin
  create type credit_reservation_status as enum (
    'reserved',
    'finalized',
    'released',
    'needs_reconciliation'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type credit_reservation_reconciliation_status as enum (
    'clean',
    'pending',
    'repaired',
    'manual_review'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type credit_ledger_entry_type as enum (
    'reservation_hold',
    'reservation_finalize',
    'reservation_release'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists credit_reservations (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users(id) on delete cascade,
  generation_intent_key text not null unique,
  job_id text references jobs(id) on delete set null,
  session_id text references sessions(id) on delete cascade,
  resume_target_id text references resume_targets(id) on delete set null,
  resume_generation_id text references resume_generations(id) on delete set null,
  type resume_generation_type not null,
  status credit_reservation_status not null default 'reserved',
  credits_reserved integer not null default 1,
  failure_reason text,
  reserved_at timestamptz not null default now(),
  finalized_at timestamptz,
  released_at timestamptz,
  reconciliation_status credit_reservation_reconciliation_status not null default 'clean',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_reservations_user_created_idx
  on credit_reservations(user_id, created_at desc);

create index if not exists credit_reservations_job_idx
  on credit_reservations(job_id);

create index if not exists credit_reservations_session_idx
  on credit_reservations(session_id);

create index if not exists credit_reservations_target_idx
  on credit_reservations(resume_target_id);

create index if not exists credit_reservations_generation_idx
  on credit_reservations(resume_generation_id);

create table if not exists credit_ledger_entries (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references users(id) on delete cascade,
  reservation_id text references credit_reservations(id) on delete set null,
  generation_intent_key text not null,
  entry_type credit_ledger_entry_type not null,
  credits_delta integer not null,
  balance_after integer,
  job_id text references jobs(id) on delete set null,
  session_id text references sessions(id) on delete cascade,
  resume_target_id text references resume_targets(id) on delete set null,
  resume_generation_id text references resume_generations(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_entries_user_created_idx
  on credit_ledger_entries(user_id, created_at desc);

create index if not exists credit_ledger_entries_reservation_idx
  on credit_ledger_entries(reservation_id);

create index if not exists credit_ledger_entries_intent_created_idx
  on credit_ledger_entries(generation_intent_key, created_at asc);

create index if not exists credit_ledger_entries_job_idx
  on credit_ledger_entries(job_id);

create index if not exists credit_ledger_entries_session_idx
  on credit_ledger_entries(session_id);

create index if not exists credit_ledger_entries_target_idx
  on credit_ledger_entries(resume_target_id);

create index if not exists credit_ledger_entries_generation_idx
  on credit_ledger_entries(resume_generation_id);

create or replace function reserve_credit_for_generation_intent(
  p_user_id text,
  p_generation_intent_key text,
  p_generation_type resume_generation_type,
  p_job_id text default null,
  p_session_id text default null,
  p_resume_target_id text default null,
  p_resume_generation_id text default null,
  p_metadata jsonb default null
) returns credit_reservations
language plpgsql
as $$
declare
  v_existing credit_reservations;
  v_reserved credit_reservations;
  v_balance integer;
begin
  perform 1
  from credit_accounts
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Credit account not found for user %', p_user_id;
  end if;

  select *
  into v_existing
  from credit_reservations
  where user_id = p_user_id
    and generation_intent_key = p_generation_intent_key;

  if found then
    return v_existing;
  end if;

  update credit_accounts
  set credits_remaining = credits_remaining - 1,
      updated_at = timezone('utc', now())
  where user_id = p_user_id
    and credits_remaining > 0
  returning credits_remaining into v_balance;

  if not found then
    raise exception 'Insufficient credits to reserve generation intent %', p_generation_intent_key;
  end if;

  insert into credit_reservations (
    id,
    user_id,
    generation_intent_key,
    job_id,
    session_id,
    resume_target_id,
    resume_generation_id,
    type,
    status,
    credits_reserved,
    failure_reason,
    reserved_at,
    finalized_at,
    released_at,
    reconciliation_status,
    metadata,
    created_at,
    updated_at
  ) values (
    gen_random_uuid()::text,
    p_user_id,
    p_generation_intent_key,
    p_job_id,
    p_session_id,
    p_resume_target_id,
    p_resume_generation_id,
    p_generation_type,
    'reserved',
    1,
    null,
    timezone('utc', now()),
    null,
    null,
    'clean',
    p_metadata,
    timezone('utc', now()),
    timezone('utc', now())
  )
  returning * into v_reserved;

  insert into credit_ledger_entries (
    id,
    user_id,
    reservation_id,
    generation_intent_key,
    entry_type,
    credits_delta,
    balance_after,
    job_id,
    session_id,
    resume_target_id,
    resume_generation_id,
    metadata,
    created_at
  ) values (
    gen_random_uuid()::text,
    p_user_id,
    v_reserved.id,
    p_generation_intent_key,
    'reservation_hold',
    -1,
    v_balance,
    p_job_id,
    p_session_id,
    p_resume_target_id,
    p_resume_generation_id,
    p_metadata,
    timezone('utc', now())
  );

  return v_reserved;
end;
$$;

create or replace function finalize_credit_reservation(
  p_user_id text,
  p_generation_intent_key text,
  p_resume_generation_id text default null,
  p_metadata jsonb default null
) returns credit_reservations
language plpgsql
as $$
declare
  v_existing credit_reservations;
  v_finalized credit_reservations;
  v_balance integer;
begin
  select *
  into v_existing
  from credit_reservations
  where user_id = p_user_id
    and generation_intent_key = p_generation_intent_key
  for update;

  if not found then
    raise exception 'Credit reservation not found for generation intent %', p_generation_intent_key;
  end if;

  if v_existing.status = 'finalized' then
    return v_existing;
  end if;

  if v_existing.status <> 'reserved' then
    raise exception 'Cannot finalize credit reservation from % state', v_existing.status;
  end if;

  update credit_reservations
  set status = 'finalized',
      resume_generation_id = coalesce(p_resume_generation_id, resume_generation_id),
      finalized_at = coalesce(finalized_at, timezone('utc', now())),
      metadata = coalesce(p_metadata, metadata),
      updated_at = timezone('utc', now())
  where id = v_existing.id
  returning * into v_finalized;

  if not exists (
    select 1
    from credit_ledger_entries
    where reservation_id = v_existing.id
      and entry_type = 'reservation_finalize'
  ) then
    select credits_remaining
    into v_balance
    from credit_accounts
    where user_id = p_user_id;

    insert into credit_ledger_entries (
      id,
      user_id,
      reservation_id,
      generation_intent_key,
      entry_type,
      credits_delta,
      balance_after,
      job_id,
      session_id,
      resume_target_id,
      resume_generation_id,
      metadata,
      created_at
    ) values (
      gen_random_uuid()::text,
      p_user_id,
      v_existing.id,
      p_generation_intent_key,
      'reservation_finalize',
      0,
      v_balance,
      v_existing.job_id,
      v_existing.session_id,
      v_existing.resume_target_id,
      coalesce(p_resume_generation_id, v_existing.resume_generation_id),
      p_metadata,
      timezone('utc', now())
    );
  end if;

  return v_finalized;
end;
$$;

create or replace function release_credit_reservation(
  p_user_id text,
  p_generation_intent_key text,
  p_resume_generation_id text default null,
  p_metadata jsonb default null
) returns credit_reservations
language plpgsql
as $$
declare
  v_existing credit_reservations;
  v_released credit_reservations;
  v_balance integer;
begin
  select *
  into v_existing
  from credit_reservations
  where user_id = p_user_id
    and generation_intent_key = p_generation_intent_key
  for update;

  if not found then
    raise exception 'Credit reservation not found for generation intent %', p_generation_intent_key;
  end if;

  if v_existing.status = 'released' then
    return v_existing;
  end if;

  if v_existing.status <> 'reserved' then
    raise exception 'Cannot release credit reservation from % state', v_existing.status;
  end if;

  update credit_accounts
  set credits_remaining = credits_remaining + v_existing.credits_reserved,
      updated_at = timezone('utc', now())
  where user_id = p_user_id
  returning credits_remaining into v_balance;

  update credit_reservations
  set status = 'released',
      resume_generation_id = coalesce(p_resume_generation_id, resume_generation_id),
      released_at = coalesce(released_at, timezone('utc', now())),
      metadata = coalesce(p_metadata, metadata),
      updated_at = timezone('utc', now())
  where id = v_existing.id
  returning * into v_released;

  if not exists (
    select 1
    from credit_ledger_entries
    where reservation_id = v_existing.id
      and entry_type = 'reservation_release'
  ) then
    insert into credit_ledger_entries (
      id,
      user_id,
      reservation_id,
      generation_intent_key,
      entry_type,
      credits_delta,
      balance_after,
      job_id,
      session_id,
      resume_target_id,
      resume_generation_id,
      metadata,
      created_at
    ) values (
      gen_random_uuid()::text,
      p_user_id,
      v_existing.id,
      p_generation_intent_key,
      'reservation_release',
      v_existing.credits_reserved,
      v_balance,
      v_existing.job_id,
      v_existing.session_id,
      v_existing.resume_target_id,
      coalesce(p_resume_generation_id, v_existing.resume_generation_id),
      p_metadata,
      timezone('utc', now())
    );
  end if;

  return v_released;
end;
$$;
