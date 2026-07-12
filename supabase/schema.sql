-- =====================================================================
-- Schema Supabase cho ShipmentOrder (migrate từ Firestore)
-- Chạy file này trong Supabase Dashboard > SQL Editor TRƯỚC khi migrate data
-- Mỗi collection Firestore = 1 bảng: id text + data jsonb (giữ nguyên cấu trúc)
-- =====================================================================

create or replace function create_collection_table(tbl text)
returns void language plpgsql as $$
begin
  execute format('
    create table if not exists %I (
      id text primary key,
      data jsonb not null default ''{}''::jsonb,
      created_at timestamptz not null default now()
    )', tbl);
  -- App dùng anon key (như Firestore rules mở) -> tắt RLS.
  -- CẢNH BÁO: ai có anon key đều đọc/ghi được. Nên bổ sung RLS + Supabase Auth sau.
  execute format('alter table %I disable row level security', tbl);
  execute format('create index if not exists %I on %I using gin (data)',
    tbl || '_data_gin', tbl);
end $$;

select create_collection_table(t) from unnest(array[
  'aboutMePage',
  'booking',
  'contactPage',
  'contract',
  'employee',
  'homePage',
  'orders',
  'priceWedding',
  'productType',
  'revenue',
  'searchOrders',
  'servicePage',
  'servicesArising',
  'team',
  'weddingDress',
  'weddingDressType'
]) as t;

drop function create_collection_table(text);

-- Index thêm cho các query hay dùng (lọc theo created / userId / createdUser)
create index if not exists orders_created_idx on "orders" ((data->>'created'));
create index if not exists orders_userid_idx on "orders" ((data->>'userId'));
create index if not exists searchorders_created_idx on "searchOrders" ((data->>'created'));
create index if not exists employee_email_idx on "employee" ((data->>'email'));
create index if not exists employee_token_idx on "employee" ((data->>'token'));

-- =====================================================================
-- Storage: bucket public "uploads" (thay Firebase Storage)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "anon read uploads" on storage.objects;
drop policy if exists "anon insert uploads" on storage.objects;
drop policy if exists "anon update uploads" on storage.objects;

create policy "anon read uploads" on storage.objects
  for select to anon using (bucket_id = 'uploads');
create policy "anon insert uploads" on storage.objects
  for insert to anon with check (bucket_id = 'uploads');
create policy "anon update uploads" on storage.objects
  for update to anon using (bucket_id = 'uploads');
