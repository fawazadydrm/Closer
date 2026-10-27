-- ── CLOSER · Supabase schema v6 (idempotent) ───────────────────
-- Safe to run repeatedly. v6 adds deals.hps (patokan budget end user,
-- umumnya sudah termasuk PPN 11%) — mesin simulasi: dari HPS + margin%
-- dihitung harga jual & COGS bid ke distributor.
-- v5 adds deals.deal_type + deals.landing_page_url.
-- Run in: Dashboard → SQL Editor → New query → Run.

-- 1. Enums mirror src/lib/types.ts exactly.
do $$ begin
  create type stage_id     as enum ('prospecting','solution_design','proposal_sent','negotiation','closed_won','closed_lost');
exception when duplicate_object then null; end $$;
do $$ begin
  create type priority     as enum ('high','medium','low');
exception when duplicate_object then null; end $$;
do $$ begin
  create type doc_category as enum ('quotation','spek_teknis','bast','kontrak_spk');
exception when duplicate_object then null; end $$;
do $$ begin
  create type doc_source   as enum ('drive','dropbox','upload');
exception when duplicate_object then null; end $$;
do $$ begin
  create type task_channel as enum ('telegram','manual');
exception when duplicate_object then null; end $$;
do $$ begin
  create type deal_type      as enum ('tender','mini_kompetisi','sales_langsung');
exception when duplicate_object then null; end $$;

-- 2. Tables (create if missing).
create table if not exists public.deals (
  id                text primary key,          -- app-generated ("de_xxxxxxx")
  title             text not null,
  company           text not null,
  contact_name      text not null default '',
  contact_phone     text not null default '',
  contact_role      text,
  value             bigint not null default 0, -- IDR (harga jual; cache hasil simulasi HPS)
  hps               bigint not null default 0, -- IDR (patokan budget end user, incl. PPN; 0 = belum ada)
  cogs              bigint not null default 0, -- IDR (hasil bidikan ke distributor; bukan input utama)
  margin_pct        numeric not null default 0,
  stage             stage_id not null default 'prospecting',
  priority          priority not null default 'medium',
  deal_type         deal_type not null default 'sales_langsung',
  landing_page_url  text,
  target_close_date date not null,
  industry          text not null default '',
  owner             text not null default '',
  archived          boolean not null default false, -- dipindah manual ke Repository
  created_at        timestamptz not null default now()
);

create table if not exists public.deal_documents (
  id          text primary key,
  deal_id     text not null references public.deals(id) on delete cascade,
  name        text not null,
  category    doc_category not null,
  url         text not null,
  source      doc_source not null,
  size_label  text,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.deal_notes (
  id         text primary key,
  deal_id    text not null references public.deals(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id      text primary key,
  deal_id text not null references public.deals(id) on delete cascade,
  title   text not null,
  due_at  timestamptz not null,
  done    boolean not null default false,
  channel task_channel not null default 'telegram'
);

-- 3. Migrate tables that were created with the earlier uuid-keyed schema.
do $$
declare
  t text;
  col_type text;
begin
  foreach t in array array['deals','deal_documents','deal_notes','tasks'] loop
    select data_type into col_type
      from information_schema.columns
     where table_schema = 'public' and table_name = t and column_name = 'id';
    if col_type = 'uuid' then
      execute format('alter table public.%I alter column id type text using id::text', t);
      raise notice 'CLOSER: migrated %.id uuid -> text', t;
    end if;
  end loop;

  -- deals.target_close_date: timestamp/date both cast cleanly to date
  select data_type into col_type
    from information_schema.columns
   where table_schema = 'public' and table_name = 'deals' and column_name = 'target_close_date';
  if col_type is not null and col_type <> 'date' then
    execute format('alter table public.deals alter column target_close_date type date using target_close_date::date');
    raise notice 'CLOSER: migrated deals.target_close_date -> date';
  end if;
end $$;

-- 4. Remove dummy demo rows from Supabase's sample-project templates
--    (they have no FK parents / random ids and break inserts & joins).
delete from public.deals where id in ('deal-1','deal-2','deal-3');

-- 4b. v3 migration: add deals.cogs to tables created before it existed.
alter table public.deals add column if not exists cogs bigint not null default 0;

-- 4c. v5 migration: deal type + landing page URL for existing tables.
alter table public.deals add column if not exists deal_type deal_type not null default 'sales_langsung';
alter table public.deals add column if not exists landing_page_url text;

-- 4d. v6 migration: HPS (patokan budget end user) drives the margin simulation.
alter table public.deals add column if not exists hps bigint not null default 0;

-- 4e. v7 migration: Repository — deals archived manually by the user.
alter table public.deals add column if not exists archived boolean not null default false;

-- 5. Indexes.
create index if not exists idx_documents_deal on public.deal_documents(deal_id);
create index if not exists idx_notes_deal     on public.deal_notes(deal_id);
create index if not exists idx_tasks_deal     on public.tasks(deal_id);
create index if not exists idx_tasks_due      on public.tasks(due_at);

-- 6. RLS: open to anon by design (single-user internal tool, no auth flow).
alter table public.deals          enable row level security;
alter table public.deal_documents enable row level security;
alter table public.deal_notes     enable row level security;
alter table public.tasks          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['deals','deal_documents','deal_notes','tasks'] loop
    execute format('drop policy if exists "closer_anon_full" on public.%I', t);
    execute format(
      'create policy "closer_anon_full" on public.%I for all to anon using (true) with check (true)', t
    );
  end loop;
end $$;

-- 7. v4: Storage bucket for uploaded PDFs (public read, anon upload/delete).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

do $$ begin
  drop policy if exists "closer_documents_anon_all" on storage.objects;
  create policy "closer_documents_anon_all" on storage.objects
    for all to anon
    using (bucket_id = 'documents')
    with check (bucket_id = 'documents');
exception when others then
  raise notice 'CLOSER: storage policy skipped (%); create the "documents" bucket + policy in the dashboard if uploads fail', sqlerrm;
end $$;
