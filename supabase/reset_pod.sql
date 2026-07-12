-- =====================================================================
-- RESET TOÀN BỘ THEO LOGIC TEEMENTPOD SELLER PORTAL
-- ⚠️ CẢNH BÁO: file này XÓA VĨNH VIỄN data cũ (wedding studio migrate từ
-- Firebase) và tạo lại schema sạch cho POD portal. Backup trước nếu cần.
-- Chạy trong Supabase Dashboard > SQL Editor.
-- Giữ lại bảng "employee" để đăng nhập.
-- =====================================================================

-- 1. Xóa các bảng cũ không thuộc logic POD
drop table if exists "aboutMePage" cascade;
drop table if exists "booking" cascade;
drop table if exists "contactPage" cascade;
drop table if exists "contract" cascade;
drop table if exists "homePage" cascade;
drop table if exists "orders" cascade;
drop table if exists "priceWedding" cascade;
drop table if exists "productType" cascade;
drop table if exists "revenue" cascade;
drop table if exists "searchOrders" cascade;
drop table if exists "servicePage" cascade;
drop table if exists "servicesArising" cascade;
drop table if exists "team" cascade;
drop table if exists "weddingDress" cascade;
drop table if exists "weddingDressType" cascade;

-- 2. Tạo lại 4 bảng POD (sạch, trống)
drop table if exists "stores" cascade;
drop table if exists "baseProducts" cascade;
drop table if exists "designs" cascade;
drop table if exists "podOrders" cascade;

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
  'stores', 'baseProducts', 'designs', 'podOrders'
]) as t;

drop function create_collection_table(text);

create index if not exists podorders_status_idx on "podOrders" ((data->>'status'));
create index if not exists podorders_created_idx on "podOrders" ((data->>'created'));
create index if not exists podorders_store_idx on "podOrders" ((data->>'storeId'));
create index if not exists designs_sku_idx on "designs" ((data->>'sku'));

-- 3. Data chuẩn theo web: 1 store BESUN
insert into "stores" (id, data) values (
  'store-besun-0000000001',
  jsonb_build_object(
    'name', 'BESUN',
    'systemCode', '01KX32P5GDE51AQ3J9MB5029PS',
    'status', 'active',
    'logo', '',
    'created', now()::text
  )
);

-- 4. Danh mục 25 phôi (đúng như catalog của web)
with catalog(name, sku) as (values
  ('Baseball Jersey', 'Baseball3D'),
  ('T-shirt 3D', '3D Shirt'),
  ('V-Neck Soccer Jersey', '3D-Soccer'),
  ('V-Neck Shirt', '3D-Vneck'),
  ('Football Jersey Croptop', '3D-Croptop'),
  ('Other', 'Other'),
  ('Hoodie Kid', 'Kid'),
  ('Button', 'Button'),
  ('Hawaiian Youth', 'Hawaiian Youth'),
  ('Hawaii', 'Hawaii'),
  ('Custom Shape Magnets', 'TM-000-16'),
  ('Die-Cut Magnet', 'TM-000-15'),
  ('Car Magnet', 'TM-000-14'),
  ('Die Cut Sticker', 'TM-000-13'),
  ('Kiss Cut Sticker', 'TM-000-12'),
  ('Square Sticker', 'TM-000-11'),
  ('Tank Top Gildan', 'TM-000-09'),
  ('Hoodie Wash', 'TM-000-08'),
  ('Zip Hoodie', 'TM-000-07'),
  ('Kid shirt', 'TM-000-06'),
  ('Hoodie', 'TM-000-05'),
  ('Sweatshirt', 'TM-000-04'),
  ('T-Shirt Wash', 'TM-000-03'),
  ('T-Shirt Comfort', 'TM-000-02'),
  ('T-shirt Gildan', 'TM-000-00')
)
insert into "baseProducts" (id, data)
select
  'phoi-' || lower(regexp_replace(sku, '[^a-zA-Z0-9]', '-', 'g')),
  jsonb_build_object(
    'name', name,
    'sku', sku,
    'category', 'Khác',
    'baseCost', 0,
    'inStock', true,
    'image', '',
    'colors', jsonb_build_array('White','Black','Navy','Red','Sport Grey'),
    'sizes', jsonb_build_array('S','M','L','XL','2XL','3XL','4XL','5XL'),
    'created', (now() - (row_number() over ()) * interval '1 minute')::text
  )
from catalog;

-- 5. Storage bucket cho upload ảnh design (nếu chưa có)
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

-- 6. Bắt PostgREST nạp lại schema cache (tránh lỗi PGRST205)
notify pgrst, 'reload schema';

-- Kiểm tra kết quả
select 'stores' as bang, count(*) from "stores"
union all select 'baseProducts', count(*) from "baseProducts"
union all select 'designs', count(*) from "designs"
union all select 'podOrders', count(*) from "podOrders";
