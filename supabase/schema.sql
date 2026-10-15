create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vendor text not null check (char_length(trim(vendor)) between 1 and 120),
  category text not null check (char_length(trim(category)) between 1 and 80),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'NGN', 'GBP', 'EUR')),
  transaction_date date not null default current_date,
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_user_date_idx
  on public.ledger_entries (user_id, transaction_date desc, created_at desc);

alter table public.ledger_entries enable row level security;
revoke all on public.ledger_entries from public, anon;
grant select, insert, delete on public.ledger_entries to authenticated;

drop policy if exists "Users can read their own ledger entries" on public.ledger_entries;
create policy "Users can read their own ledger entries"
  on public.ledger_entries for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add their own ledger entries" on public.ledger_entries;
create policy "Users can add their own ledger entries"
  on public.ledger_entries for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own ledger entries" on public.ledger_entries;
create policy "Users can delete their own ledger entries"
  on public.ledger_entries for delete to authenticated
  using (user_id = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ledger_entries'
  ) then
    alter publication supabase_realtime add table public.ledger_entries;
  end if;
end
$$;