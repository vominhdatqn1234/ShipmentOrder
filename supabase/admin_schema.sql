-- =====================================================================
-- SCHEMA CHO ADMIN PORTAL (quản lý seller, tài chính công nợ)
-- Chạy trong Supabase SQL Editor — chỉ ALTER/CREATE, không xóa data
-- =====================================================================

-- 1. Phí & ưu đãi của seller (trên bảng employee)
alter table "employee" add column if not exists "markup" numeric default 0;
alter table "employee" add column if not exists "perOrderFee" numeric default 0;
alter table "employee" add column if not exists "discount" numeric default 0;

-- 2. Sổ cái gạch nợ (ledger)
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
alter table "ledgerEntries" disable row level security;
create index if not exists ledger_seller_idx on "ledgerEntries" ("sellerId");
create index if not exists ledger_store_idx on "ledgerEntries" ("storeId");

-- 3. Bảng giá vận chuyển
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
alter table "shippingPrices" disable row level security;

-- 4. Đơn thiết kế theo yêu cầu
create table if not exists "designRequests" (
  id text primary key,
  "sellerId" text,
  "sellerName" text,
  title text,
  description text default '',
  "referenceUrl" text default '',
  "resultUrl" text default '',
  status text default 'pending', -- pending | in_progress | done | cancelled
  price numeric default 0,
  created text,
  created_at timestamptz not null default now()
);
alter table "designRequests" disable row level security;

-- 5. Dịch vụ mở rộng (hiển thị trên trang seller)
create table if not exists "services" (
  id text primary key,
  title text,
  description text default '',
  tags jsonb default '[]'::jsonb,
  hot boolean default false,
  active boolean default true,
  created text,
  created_at timestamptz not null default now()
);
alter table "services" disable row level security;

-- 6. Tài khoản admin mặc định (đổi mật khẩu sau khi đăng nhập)
insert into "employee" (id, name, email, password, permission, created)
values (
  'admin-0000000000000001', 'Admin', 'admin@teementpod.com', 'Admin@123',
  'Admin', now()::text
)
on conflict (id) do nothing;

notify pgrst, 'reload schema';

-- Kiểm tra
select 'ledgerEntries' as bang, count(*) from "ledgerEntries"
union all select 'shippingPrices', count(*) from "shippingPrices"
union all select 'designRequests', count(*) from "designRequests"
union all select 'services', count(*) from "services"
union all select 'admin account', count(*) from "employee" where permission = 'Admin';

-- (bổ sung) SVG icon cho dịch vụ
alter table "services" add column if not exists "icon" text default '';

-- (bổ sung) Chất liệu + thông số chi tiết cho phôi
alter table "baseProducts" add column if not exists "material" text default '';
alter table "baseProducts" add column if not exists "specs" text default '';

-- (bổ sung) Bảng giá phôi POD theo Loại SP + Size
create table if not exists "podPrices" (
  id text primary key,
  "productType" text,
  size text,
  "baseCost" numeric default 0,
  "extraPrintFee" numeric default 0,
  created text,
  created_at timestamptz not null default now()
);
alter table "podPrices" disable row level security;
create index if not exists podprices_type_idx on "podPrices" ("productType");
notify pgrst, 'reload schema';
