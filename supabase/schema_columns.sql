-- =====================================================================
-- CHUYỂN TỪ JSONB SANG CỘT RIÊNG TỪNG FIELD
-- ⚠️ Xóa & tạo lại: stores, baseProducts, designs, podOrders (data cũ mất)
--    Bảng employee được MIGRATE giữ nguyên tài khoản (chuyển jsonb -> cột)
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. EMPLOYEE: migrate từ jsonb sang cột (giữ tài khoản cũ)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'employee' and column_name = 'data'
  ) then
    alter table "employee" rename to "employee_old";

    create table "employee" (
      id text primary key,
      name text,
      "firstName" text,
      "lastName" text,
      phone text,
      email text,
      password text,
      permission text default 'Seller',
      token text,
      created text,
      created_at timestamptz not null default now()
    );

    insert into "employee"
      (id, name, "firstName", "lastName", phone, email, password, permission, token, created)
    select
      id,
      data->>'name',
      data->>'firstName',
      data->>'lastName',
      data->>'phone',
      data->>'email',
      data->>'password',
      coalesce(data->>'permission', 'Seller'),
      data->>'token',
      coalesce(data->>'created', now()::text)
    from "employee_old";

    drop table "employee_old";
  end if;
end $$;

alter table "employee" disable row level security;
create index if not exists employee_email_idx on "employee" (email);
create index if not exists employee_token_idx on "employee" (token);

-- 2. STORES
drop table if exists "stores" cascade;
create table "stores" (
  id text primary key,
  name text not null,
  "systemCode" text,
  status text not null default 'active',
  logo text default '',
  created text,
  created_at timestamptz not null default now()
);
alter table "stores" disable row level security;

-- 3. BASE PRODUCTS (danh mục phôi)
drop table if exists "baseProducts" cascade;
create table "baseProducts" (
  id text primary key,
  name text not null,
  sku text not null,
  category text default 'Khác',
  "baseCost" numeric not null default 0,
  "inStock" boolean not null default true,
  image text default '',
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  created text,
  created_at timestamptz not null default now()
);
alter table "baseProducts" disable row level security;
create index if not exists baseproducts_sku_idx on "baseProducts" (sku);

-- 4. DESIGNS (thư viện thiết kế & SKU)
drop table if exists "designs" cascade;
create table "designs" (
  id text primary key,
  sku text not null,
  "frontUrl" text default '',
  "backUrl" text default '',
  "mockupUrl" text default '',
  "extraAreas" jsonb not null default '[]'::jsonb,
  "testBg" text default '#FFFFFF',
  created text,
  created_at timestamptz not null default now()
);
alter table "designs" disable row level security;
create index if not exists designs_sku_idx on "designs" (sku);

-- 5. POD ORDERS (đơn hàng — items là mảng jsonb vì 1 đơn nhiều món)
drop table if exists "podOrders" cascade;
create table "podOrders" (
  id text primary key,
  "orderCode" text not null,
  "storeId" text,
  "storeName" text,
  status text not null default 'pending_payment',
  tracking text default '',
  source text default 'manual',
  "customerName" text,
  "customerEmail" text default '',
  "customerPhone" text default '',
  address1 text,
  address2 text default '',
  city text,
  state text,
  zip text,
  country text default 'United States',
  items jsonb not null default '[]'::jsonb,
  note text default '',
  total numeric not null default 0,
  created text,
  "datePaid" text,
  "dateShipped" text,
  created_at timestamptz not null default now()
);
alter table "podOrders" disable row level security;
create index if not exists podorders_status_idx on "podOrders" (status);
create index if not exists podorders_created_idx on "podOrders" (created);
create index if not exists podorders_store_idx on "podOrders" ("storeId");
create index if not exists podorders_code_idx on "podOrders" ("orderCode");

-- 6. Data chuẩn: store BESUN + 25 phôi
insert into "stores" (id, name, "systemCode", status, logo, created) values (
  'store-besun-0000000001', 'BESUN', '01KX32P5GDE51AQ3J9MB5029PS',
  'active', '', now()::text
);

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
insert into "baseProducts" (id, name, sku, category, "baseCost", "inStock", colors, sizes, created)
select
  'phoi-' || lower(regexp_replace(sku, '[^a-zA-Z0-9]', '-', 'g')),
  name, sku, 'Khác', 0, true,
  '["White","Black","Navy","Red","Sport Grey"]'::jsonb,
  '["S","M","L","XL","2XL","3XL","4XL","5XL"]'::jsonb,
  (now() - (row_number() over ()) * interval '1 minute')::text
from catalog;

-- 7. Reload schema cache
notify pgrst, 'reload schema';

-- Kiểm tra
select 'employee' as bang, count(*) from "employee"
union all select 'stores', count(*) from "stores"
union all select 'baseProducts', count(*) from "baseProducts"
union all select 'designs', count(*) from "designs"
union all select 'podOrders', count(*) from "podOrders";
