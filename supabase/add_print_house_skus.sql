-- =====================================================================
-- Bảng "printHouseSkus" — Data SKU riêng theo từng Nhà In (file SK2)
-- Key tra cứu: printHouse + brand (=tên sản phẩm) + color + size -> variantId
-- Chạy trong Supabase Dashboard > SQL Editor (FLAT MODE — mỗi field = 1 cột).
-- =====================================================================

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

alter table "printHouseSkus" disable row level security;

-- Quyền truy cập cho PostgREST (giống các bảng POD khác)
grant select, insert, update, delete on "printHouseSkus"
  to anon, authenticated, service_role;

-- Index phục vụ lọc theo nhà in + tra cứu theo brand/màu/size
create index if not exists printhouseskus_house_idx
  on "printHouseSkus" ("printHouse");
create index if not exists printhouseskus_lookup_idx
  on "printHouseSkus" ("printHouse", brand, color, size);

-- Nạp lại schema cache cho PostgREST (hết lỗi PGRST205)
notify pgrst, 'reload schema';
