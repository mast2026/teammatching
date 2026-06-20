alter table public.team_matching_members
  add column if not exists password_hash text,
  add column if not exists password_set_at timestamptz;
