-- =====================================================================
-- Bảng giá phôi POD theo (Loại SP + Size) — FLAT MODE
-- Chạy trong Supabase SQL Editor
-- =====================================================================

create table if not exists "podPrices" (
  id text primary key,
  "productType" text,            -- Loại Sản Phẩm
  size text,                     -- Size
  "baseCost" numeric default 0,  -- Giá Gốc (Base Cost)
  "extraPrintFee" numeric default 0, -- Phí In Mặt Phụ (in thêm/mặt)
  created text,
  created_at timestamptz not null default now()
);

alter table "podPrices" disable row level security;

create index if not exists podprices_type_idx on "podPrices" ("productType");
create index if not exists podprices_size_idx on "podPrices" (size);

-- Bắt PostgREST nạp lại schema cache (hết lỗi PGRST205)
notify pgrst, 'reload schema';
