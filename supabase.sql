-- 鐵週期：在 Supabase「SQL Editor」貼上整段後按 Run
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.workout_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  log jsonb not null,
  ended_at bigint not null
);
create index if not exists workout_logs_user_idx on public.workout_logs(user_id, ended_at desc);

alter table public.app_state enable row level security;
alter table public.workout_logs enable row level security;

-- 每個人只能讀寫自己的資料
create policy "own state" on public.app_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs" on public.workout_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
