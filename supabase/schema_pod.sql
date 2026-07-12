-- =====================================================================
-- Schema bổ sung cho TeementPOD Seller Portal clone
-- Chạy trong Supabase SQL Editor (sau schema.sql)
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
  execute format('alter table %I disable row level security', tbl);
  execute format('create index if not exists %I on %I using gin (data)',
    tbl || '_data_gin', tbl);
end $$;

select create_collection_table(t) from unnest(array[
  'stores',        -- cửa hàng
  'baseProducts',  -- danh mục phôi
  'designs',       -- thư viện thiết kế & SKU
  'podOrders'      -- đơn hàng POD
]) as t;

drop function create_collection_table(text);

create index if not exists podorders_status_idx on "podOrders" ((data->>'status'));
create index if not exists podorders_created_idx on "podOrders" ((data->>'created'));
create index if not exists podorders_store_idx on "podOrders" ((data->>'storeId'));
create index if not exists designs_sku_idx on "designs" ((data->>'sku'));
