create table if not exists public.resume_targets (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  target_job_description text not null,
  derived_cv_state jsonb not null,
  gap_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_targets_session_id_created_at_idx
  on public.resume_targets(session_id, created_at desc);

create table if not exists public.cv_versions (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  target_resume_id text references public.resume_targets(id) on delete set null,
  snapshot jsonb not null,
  source text not null check (source in ('ingestion', 'rewrite', 'manual', 'target-derived')),
  created_at timestamptz not null default now()
);

create index if not exists cv_versions_session_id_created_at_idx
  on public.cv_versions(session_id, created_at desc);

create index if not exists cv_versions_target_resume_id_idx
  on public.cv_versions(target_resume_id);
