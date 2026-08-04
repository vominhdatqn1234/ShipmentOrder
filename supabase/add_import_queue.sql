-- =====================================================================
-- Hàng đợi import đơn từ PDF (chờ admin duyệt)
-- Seller upload PDF -> ghi 1 dòng vào bảng này (status 'pending').
-- Admin duyệt cả lô -> các đơn mới được ghi sang "podOrders".
-- Chạy file này trong Supabase Dashboard > SQL Editor.
-- =====================================================================
create table if not exists "podImportQueue" (
  id text primary key,
  "storeId" text,
  "storeName" text,
  "userId" text default '',          -- seller sở hữu lô đơn này
  "sellerName" text default '',
  "fileName" text default '',
  source text default 'pdf',         -- 'pdf' | 'csv'
  status text not null default 'pending',
  -- status: pending | approved | rejected
  count integer not null default 0,  -- số đơn trong lô
  orders jsonb not null default '[]'::jsonb, -- [{ id, data }] đã parse sẵn
  "rejectedReason" text default '',
  "reviewedBy" text default '',      -- admin đã duyệt/từ chối
  "reviewedAt" text default '',
  created text,
  created_at timestamptz not null default now()
);

-- App dùng anon key (như các bảng khác) -> tắt RLS.
alter table "podImportQueue" disable row level security;

create index if not exists importqueue_status_idx on "podImportQueue" (status);
create index if not exists importqueue_user_idx on "podImportQueue" ("userId");
create index if not exists importqueue_created_idx on "podImportQueue" (created);
