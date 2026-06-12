-- 입상 결과 수동 등록용 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.

alter table public.team_matching_awards
  add column if not exists contest_title text,
  add column if not exists body text;

create index if not exists idx_team_matching_awards_created
  on public.team_matching_awards (created_at desc);
