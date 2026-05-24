-- Products & Combo Solutions
-- Run this in Supabase SQL Editor after 001_initial.sql

-- Structured product catalog
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  category text not null,
  sub_category text,
  name text not null,
  size_spec text,
  unit_price decimal,
  price_unit text,
  created_at timestamptz default now()
);

-- Combo / packaged solutions with images
create table if not exists combo_solutions (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid references factories(id) on delete cascade not null,
  name text not null,
  crop text,
  land_size text,
  spacing_spec text,
  items jsonb not null default '[]',
  grand_total decimal,
  image_url text,
  created_at timestamptz default now()
);

create index if not exists idx_products_factory on products(factory_id);
create index if not exists idx_combo_solutions_factory on combo_solutions(factory_id);

-- RLS
alter table products enable row level security;
alter table combo_solutions enable row level security;

-- Service role handles agent operations.
-- Owner can read/write their own products and combos.
drop policy if exists "Owners read own products" on products;
create policy "Owners read own products"
  on products for select
  using (factory_id in (select factory_id from owners where id = auth.uid()));

drop policy if exists "Owners write own products" on products;
create policy "Owners write own products"
  on products for all
  using (factory_id in (select factory_id from owners where id = auth.uid()));

drop policy if exists "Owners read own combos" on combo_solutions;
create policy "Owners read own combos"
  on combo_solutions for select
  using (factory_id in (select factory_id from owners where id = auth.uid()));

drop policy if exists "Owners write own combos" on combo_solutions;
create policy "Owners write own combos"
  on combo_solutions for all
  using (factory_id in (select factory_id from owners where id = auth.uid()));

-- Public read for active factory products/combos (chat needs system prompt data)
drop policy if exists "Public read products of active factories" on products;
create policy "Public read products of active factories"
  on products for select
  using (factory_id in (select id from factories where is_active = true));

drop policy if exists "Public read combos of active factories" on combo_solutions;
create policy "Public read combos of active factories"
  on combo_solutions for select
  using (factory_id in (select id from factories where is_active = true));
