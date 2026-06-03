-- Supabase production schema for the household finance app.
-- Run this in the Supabase SQL editor for the project used by app.js.

create extension if not exists pgcrypto;

create table if not exists public.finance_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rules jsonb not null default '[]'::jsonb,
  daily jsonb not null default '[]'::jsonb,
  memories jsonb not null default '[]'::jsonb,
  field_aliases jsonb not null default '{}'::jsonb,
  locale text not null default 'zh-CN',
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_monthly_ledgers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ledger_month text not null check (ledger_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  transactions jsonb not null default '[]'::jsonb,
  import_summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, ledger_month)
);

create index if not exists finance_monthly_ledgers_user_month_idx
  on public.finance_monthly_ledgers(user_id, ledger_month);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_finance_user_state on public.finance_user_state;
create trigger touch_finance_user_state
before update on public.finance_user_state
for each row execute function public.touch_updated_at();

drop trigger if exists touch_finance_monthly_ledgers on public.finance_monthly_ledgers;
create trigger touch_finance_monthly_ledgers
before update on public.finance_monthly_ledgers
for each row execute function public.touch_updated_at();

alter table public.finance_user_state enable row level security;
alter table public.finance_monthly_ledgers enable row level security;

drop policy if exists "Users can read own finance state" on public.finance_user_state;
create policy "Users can read own finance state"
on public.finance_user_state
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own finance state" on public.finance_user_state;
create policy "Users can insert own finance state"
on public.finance_user_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own finance state" on public.finance_user_state;
create policy "Users can update own finance state"
on public.finance_user_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own monthly ledgers" on public.finance_monthly_ledgers;
create policy "Users can read own monthly ledgers"
on public.finance_monthly_ledgers
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own monthly ledgers" on public.finance_monthly_ledgers;
create policy "Users can insert own monthly ledgers"
on public.finance_monthly_ledgers
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own monthly ledgers" on public.finance_monthly_ledgers;
create policy "Users can update own monthly ledgers"
on public.finance_monthly_ledgers
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own monthly ledgers" on public.finance_monthly_ledgers;
create policy "Users can delete own monthly ledgers"
on public.finance_monthly_ledgers
for delete
to authenticated
using ((select auth.uid()) = user_id);
