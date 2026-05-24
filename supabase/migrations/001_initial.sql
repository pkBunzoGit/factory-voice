-- FactoryVoice MVP — Initial Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Agents (field agents who onboard factories)
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  pin_hash text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. Factories (each onboarded business)
create table if not exists factories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text not null,
  agent_id uuid references agents(id),
  system_prompt text,
  is_active boolean default false,
  visit_status text default 'draft' check (visit_status in ('draft', 'active', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Factory profiles (section-based key-value data)
create table if not exists factory_profiles (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  section text not null,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(factory_id, section)
);

-- 4. Owners (factory owners who log into the dashboard)
create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  email text unique not null,
  password_hash text not null,
  name text,
  created_at timestamptz default now()
);

-- 5. Leads (captured buyer phone numbers)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  phone text not null,
  created_at timestamptz default now()
);

-- 6. Chat sessions (one per lead visit)
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete cascade not null,
  started_at timestamptz default now()
);

-- 7. Chat messages (individual messages in a session)
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_factories_slug on factories(slug);
create index if not exists idx_factory_profiles_factory on factory_profiles(factory_id);
create index if not exists idx_leads_factory on leads(factory_id);
create index if not exists idx_chat_sessions_factory on chat_sessions(factory_id);
create index if not exists idx_chat_sessions_lead on chat_sessions(lead_id);
create index if not exists idx_chat_messages_session on chat_messages(session_id);

-- Updated_at trigger for factories
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists factories_updated_at on factories;
create trigger factories_updated_at
  before update on factories
  for each row execute function update_updated_at();

drop trigger if exists factory_profiles_updated_at on factory_profiles;
create trigger factory_profiles_updated_at
  before update on factory_profiles
  for each row execute function update_updated_at();

-- Row Level Security
alter table factories enable row level security;
alter table factory_profiles enable row level security;
alter table owners enable row level security;
alter table leads enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- Public read for active factories (chat page needs this)
drop policy if exists "Anyone can read active factories by slug" on factories;
create policy "Anyone can read active factories by slug"
  on factories for select
  using (is_active = true);

-- Service role bypasses RLS for agent and admin operations.
-- Owner policies: owners can only see their own factory data.
drop policy if exists "Owners read own factory" on factories;
create policy "Owners read own factory"
  on factories for select
  using (
    id in (select factory_id from owners where id = auth.uid())
  );

drop policy if exists "Owners read own leads" on leads;
create policy "Owners read own leads"
  on leads for select
  using (
    factory_id in (select factory_id from owners where id = auth.uid())
  );

drop policy if exists "Owners read own chat sessions" on chat_sessions;
create policy "Owners read own chat sessions"
  on chat_sessions for select
  using (
    factory_id in (select factory_id from owners where id = auth.uid())
  );

drop policy if exists "Owners read own chat messages" on chat_messages;
create policy "Owners read own chat messages"
  on chat_messages for select
  using (
    session_id in (
      select cs.id from chat_sessions cs
      join owners o on o.factory_id = cs.factory_id
      where o.id = auth.uid()
    )
  );

drop policy if exists "Owners read own factory profiles" on factory_profiles;
create policy "Owners read own factory profiles"
  on factory_profiles for select
  using (
    factory_id in (select factory_id from owners where id = auth.uid())
  );

drop policy if exists "Owners update own factory profiles" on factory_profiles;
create policy "Owners update own factory profiles"
  on factory_profiles for update
  using (
    factory_id in (select factory_id from owners where id = auth.uid())
  );

-- Public insert for leads and chat (buyer interactions — no auth)
drop policy if exists "Public can create leads" on leads;
create policy "Public can create leads"
  on leads for insert
  with check (true);

drop policy if exists "Public can create chat sessions" on chat_sessions;
create policy "Public can create chat sessions"
  on chat_sessions for insert
  with check (true);

drop policy if exists "Public can insert chat messages" on chat_messages;
create policy "Public can insert chat messages"
  on chat_messages for insert
  with check (true);

drop policy if exists "Public can read own session messages" on chat_messages;
create policy "Public can read own session messages"
  on chat_messages for select
  using (true);
