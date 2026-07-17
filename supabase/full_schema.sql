-- =====================================================================
-- FULL SCHEMA — TeementPOD (Seller Portal + Admin Portal)
-- =====================================================================
-- Chạy 1 lần trong Supabase Dashboard > SQL Editor để dựng toàn bộ DB
-- cho một project mới. An toàn chạy lại (create if not exists + add column
-- if not exists). FLAT MODE: mỗi field = 1 cột thật (không dùng data jsonb).
--
-- Sau khi chạy: PostgREST tự reload schema (notify ở cuối). App dùng REST
-- API ẩn danh (anon) nên các bảng đều TẮT row level security + cấp quyền.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) EMPLOYEE — tài khoản đăng nhập (seller + admin) + phí/ưu đãi seller
-- ---------------------------------------------------------------------
create table if not exists "employee" (
  id text primary key,
  name text,
  "firstName" text,
  "lastName" text,
  phone text,
  email text,
  password text,
  permission text default 'Seller',      -- 'Seller' | 'Admin'
  token text,
  "markup" numeric default 0,            -- phí in thêm / sp
  "perOrderFee" numeric default 0,       -- phí xử lý / đơn
  "discount" numeric default 0,          -- ưu đãi / đơn
  created text,
  created_at timestamptz not null default now()
);
create index if not exists employee_email_idx on "employee" (email);
create index if not exists employee_token_idx on "employee" (token);

-- ---------------------------------------------------------------------
-- 2) STORES — cửa hàng của seller
-- ---------------------------------------------------------------------
create table if not exists "stores" (
  id text primary key,
  name text not null,
  "systemCode" text,
  status text not null default 'active', -- 'active' | 'locked'
  "lockedBy" text,                       -- 'admin' | 'seller' | null
  logo text default '',
  "taxCode" text default '',
  "userId" text default '',
  created text,
  created_at timestamptz not null default now()
);
create index if not exists stores_user_idx on "stores" ("userId");

-- ---------------------------------------------------------------------
-- 3) BASE PRODUCTS — danh mục phôi (Kho Phôi POD)
-- ---------------------------------------------------------------------
create table if not exists "baseProducts" (
  id text primary key,
  name text not null,
  sku text not null,
  category text default 'Khác',
  "baseCost" numeric not null default 0,
  "inStock" boolean not null default true,
  image text default '',
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  material text default '',
  specs text default '',
  created text,
  created_at timestamptz not null default now()
);
create index if not exists baseproducts_sku_idx on "baseProducts" (sku);

-- ---------------------------------------------------------------------
-- 4) DESIGNS — thư viện thiết kế & SKU (theo user + store)
-- ---------------------------------------------------------------------
create table if not exists "designs" (
  id text primary key,
  sku text not null,
  "frontUrl" text default '',
  "backUrl" text default '',
  "mockupUrl" text default '',
  "extraAreas" jsonb not null default '[]'::jsonb,
  "testBg" text default '#FFFFFF',
  "userId" text default '',
  "storeId" text default '',
  created text,
  created_at timestamptz not null default now()
);
create index if not exists designs_sku_idx on "designs" (sku);

-- ---------------------------------------------------------------------
-- 5) POD ORDERS — đơn hàng (items là mảng jsonb vì 1 đơn nhiều món)
-- ---------------------------------------------------------------------
create table if not exists "podOrders" (
  id text primary key,
  "orderCode" text not null,
  "storeId" text,
  "storeName" text,
  "userId" text default '',
  status text not null default 'pending_payment',
  -- status: pending_payment | pending_approval | in_production | shipping
  --         | completed | cancelled | support | reship | refund
  "prevStatus" text,                     -- trạng thái trước khi Hỗ trợ/Hoàn tiền
  tracking text default '',
  source text default 'manual',          -- 'etsy' | 'manual' | 'csv'
  "printHouse" text default '',          -- nhà in được phân bổ
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
  "refundedAmount" numeric,              -- số tiền đã hoàn (thống kê refund)
  "refundedAt" text,
  created text,
  "datePaid" text,
  "dateShipped" text,
  created_at timestamptz not null default now()
);
create index if not exists podorders_status_idx on "podOrders" (status);
create index if not exists podorders_created_idx on "podOrders" (created);
create index if not exists podorders_store_idx on "podOrders" ("storeId");
create index if not exists podorders_user_idx on "podOrders" ("userId");
create index if not exists podorders_code_idx on "podOrders" ("orderCode");

-- ---------------------------------------------------------------------
-- 6) POD COLORS — mã màu phôi (tên màu -> hex), làm nền thiết kế
-- ---------------------------------------------------------------------
create table if not exists "podColors" (
  id text primary key,
  name text not null,
  hex text not null default '#ffffff',
  created text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7) POD PRICES — bảng giá theo Loại SP + Size (đơn giản)
-- ---------------------------------------------------------------------
create table if not exists "podPrices" (
  id text primary key,
  "productType" text,
  size text,
  "baseCost" numeric default 0,
  "extraPrintFee" numeric default 0,
  created text,
  created_at timestamptz not null default now()
);
create index if not exists podprices_type_idx on "podPrices" ("productType");

-- ---------------------------------------------------------------------
-- 8) POD VARIANTS — Bảng giá POD theo Sản phẩm × Màu × Size (file Teement)
-- ---------------------------------------------------------------------
create table if not exists "podVariants" (
  id text primary key,
  product text not null,
  color text default '',
  size text default '',
  price numeric default 0,               -- Giá
  "shipPrice" numeric default 0,         -- Giá ship
  "printOneSide" numeric default 0,      -- In 1 mặt
  "printExtraArea" numeric default 0,    -- In vùng phụ
  "priceAK2" numeric default 0,          -- Giá AK2
  "priceFashship" numeric default 0,     -- Giá Fashship
  "price3D" numeric default 0,           -- Giá 3D
  "priceTeement" numeric default 0,      -- Giá Teement
  created text,
  created_at timestamptz not null default now()
);
create index if not exists podvariants_product_idx on "podVariants" (product);
create index if not exists podvariants_lookup_idx
  on "podVariants" (product, size, color);

-- ---------------------------------------------------------------------
-- 9) LEDGER ENTRIES — sổ cái gạch nợ seller
-- ---------------------------------------------------------------------
create table if not exists "ledgerEntries" (
  id text primary key,
  "txnId" text,
  "sellerId" text,
  "sellerName" text,
  "storeId" text,
  "storeName" text,
  period text,
  "orderCount" integer default 0,
  amount numeric default 0,
  note text default '',
  created text,
  created_at timestamptz not null default now()
);
create index if not exists ledger_seller_idx on "ledgerEntries" ("sellerId");
create index if not exists ledger_store_idx on "ledgerEntries" ("storeId");

-- ---------------------------------------------------------------------
-- 10) SHIPPING PRICES — bảng giá vận chuyển
-- ---------------------------------------------------------------------
create table if not exists "shippingPrices" (
  id text primary key,
  region text,
  method text,
  "firstItem" numeric default 0,
  "additionalItem" numeric default 0,
  "estimatedDays" text default '',
  note text default '',
  created text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 11) DESIGN REQUESTS — đơn thiết kế theo yêu cầu
-- ---------------------------------------------------------------------
create table if not exists "designRequests" (
  id text primary key,
  "sellerId" text,
  "sellerName" text,
  title text,
  description text default '',
  "referenceUrl" text default '',
  "resultUrl" text default '',
  status text default 'pending',         -- pending | in_progress | done | cancelled
  price numeric default 0,
  created text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 12) SERVICES — dịch vụ mở rộng hiển thị cho seller
-- ---------------------------------------------------------------------
create table if not exists "services" (
  id text primary key,
  title text,
  description text default '',
  tags jsonb default '[]'::jsonb,
  icon text default '',
  hot boolean default false,
  active boolean default true,
  created text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 13) PRINT ORDERS — đơn gửi Nhà In (định dạng AK2, 41 cột)
-- ---------------------------------------------------------------------
create table if not exists "printOrders" (
  id text primary key,
  "orderDate" text,
  "orderId" text,
  "orderSource" text,
  address1 text,
  address2 text,
  city text,
  "countryCode" text,
  "firstName" text,
  "lastName" text,
  phone text,
  state text,
  zip text,
  "shippingMethod" text,
  "shippingLabelUrl" text,
  "productCode" text,
  size text,
  color text,
  sku text,
  quantity integer default 1,
  "frontDesignUrl" text,
  "frontMockupUrl" text,
  "backDesignUrl" text,
  "backMockupUrl" text,
  "leftSleeveDesignUrl" text,
  "leftSleeveMockupUrl" text,
  "rightSleeveDesignUrl" text,
  "rightSleeveMockupUrl" text,
  "specialFrontDesignUrl" text,
  "specialFrontMockupUrl" text,
  "specialBackDesignUrl" text,
  "specialBackMockupUrl" text,
  "specialLeftSleeveDesignUrl" text,
  "specialLeftSleeveMockupUrl" text,
  "specialRightSleeveDesignUrl" text,
  "specialRightSleeveMockupUrl" text,
  "frontPrintSize" text,
  "backPrintSize" text,
  "producingService" text,
  technology text,
  "pushTracking" text,
  note text,
  "printHouse" text default '',
  created text,
  created_at timestamptz not null default now()
);
create index if not exists printorders_order_idx on "printOrders" ("orderId");
create index if not exists printorders_sku_idx on "printOrders" (sku);

-- ---------------------------------------------------------------------
-- 14) PRINT HOUSES — danh mục tên nhà in
-- ---------------------------------------------------------------------
create table if not exists "printHouses" (
  id text primary key,
  name text not null,
  created text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 15) PRINT HOUSE SKUS — data SKU riêng của từng nhà in (file SK2)
--     Tra Variant ID theo printHouse + brand(=sản phẩm) + color + size
-- ---------------------------------------------------------------------
create table if not exists "printHouseSkus" (
  id text primary key,
  "printHouse" text not null,
  "productName" text default '',
  style text default '',
  brand text not null,
  color text default '',
  size text default '',
  "variantId" text not null,
  created text,
  created_at timestamptz not null default now()
);
create index if not exists printhouseskus_house_idx on "printHouseSkus" ("printHouse");
create index if not exists printhouseskus_lookup_idx
  on "printHouseSkus" ("printHouse", brand, color, size);

-- ---------------------------------------------------------------------
-- 16) TRACKINGS — Order ID -> mã tracking + nhà vận chuyển
-- ---------------------------------------------------------------------
create table if not exists "trackings" (
  id text primary key,
  "orderId" text,
  tracking text,
  carrier text,
  created text,
  created_at timestamptz not null default now()
);
create index if not exists trackings_order_idx on "trackings" ("orderId");

-- =====================================================================
-- PATCH cột cho DB đã tồn tại (an toàn nếu chạy lại trên DB cũ)
-- =====================================================================
alter table "employee"     add column if not exists "markup" numeric default 0;
alter table "employee"     add column if not exists "perOrderFee" numeric default 0;
alter table "employee"     add column if not exists "discount" numeric default 0;
alter table "stores"       add column if not exists "userId" text default '';
alter table "stores"       add column if not exists "taxCode" text default '';
alter table "stores"       add column if not exists "lockedBy" text;
alter table "baseProducts" add column if not exists "material" text default '';
alter table "baseProducts" add column if not exists "specs" text default '';
alter table "designs"      add column if not exists "userId" text default '';
alter table "designs"      add column if not exists "storeId" text default '';
alter table "services"     add column if not exists "icon" text default '';
alter table "podOrders"    add column if not exists "userId" text default '';
alter table "podOrders"    add column if not exists "prevStatus" text;
alter table "podOrders"    add column if not exists "printHouse" text default '';
alter table "podOrders"    add column if not exists "refundedAmount" numeric;
alter table "podOrders"    add column if not exists "refundedAt" text;

-- =====================================================================
-- TẮT RLS + CẤP QUYỀN cho anon/authenticated (app gọi REST ẩn danh)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'employee','stores','baseProducts','designs','podOrders','podColors',
    'podPrices','podVariants','ledgerEntries','shippingPrices','designRequests',
    'services','printOrders','printHouses','printHouseSkus','trackings'
  ] loop
    execute format('alter table %I disable row level security', t);
    execute format(
      'grant select, insert, update, delete on %I to anon, authenticated, service_role', t);
  end loop;
end $$;

-- =====================================================================
-- STORAGE bucket cho upload ảnh design/mockup
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

-- =====================================================================
-- SEED tối thiểu — tài khoản Admin mặc định (đổi mật khẩu sau khi đăng nhập)
-- =====================================================================
insert into "employee" (id, name, email, password, permission, created)
values ('admin-0000000000000001', 'Admin', 'admin@teementpod.com',
        'Admin@123', 'Admin', now()::text)
on conflict (id) do nothing;

-- =====================================================================
-- Nạp lại schema cache cho PostgREST (hết lỗi PGRST205)
-- =====================================================================
notify pgrst, 'reload schema';

-- Kiểm tra nhanh (số bảng đã tạo)
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'employee','stores','baseProducts','designs','podOrders','podColors',
    'podPrices','podVariants','ledgerEntries','shippingPrices','designRequests',
    'services','printOrders','printHouses','printHouseSkus','trackings'
  )
order by table_name;
