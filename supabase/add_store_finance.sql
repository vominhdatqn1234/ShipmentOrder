-- =====================================================================
-- BẢNG TÀI CHÍNH THEO SHOP + KỲ (dùng cho bảng "Theo shop" ở Tổng quan)
--
--   storeFinance   : số liệu khách TỰ NHẬP cho mỗi shop trong mỗi kỳ
--                    - revenue    : Doanh thu (khách tự nhập)
--                    - otherCost  : Chi Phí Khác (khách tự nhập)
--                    - extras     : { [financeColumns.id]: number } — các cột
--                                   khách tự Add (vd Lương)
--                    id = "<storeId>__<period>" để upsert on_conflict=id.
--                    period: 2026-08-13 | 2026-W33 | 2026-08 | 2026-Q3 | 2026
--
--   financeColumns : định nghĩa các cột khách tự Add (dùng chung mọi kỳ)
--                    - isCost = true  → TRỪ vào lợi nhuận (vd Lương)
--                    - isCost = false → CỘNG vào lợi nhuận (vd tiền nạp thêm)
--
-- Các cột còn lại (Chi Phí Full, Hỗ Trợ Ship Lại, Refund) tính tự động từ
-- podOrders; Hỗ trợ Design và Chiết Khấu lấy từ bảng stores (admin nhập).
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

create table if not exists "storeFinance" (
  id text primary key,                        -- "<storeId>__<period>"
  "userId" text default '',
  "storeId" text not null,
  period text not null,                       -- 2026-08 | 2026-Q3 | 2026 | ...
  revenue numeric not null default 0,         -- Doanh thu (khách nhập)
  "otherCost" numeric not null default 0,     -- Chi Phí Khác (khách nhập)
  extras jsonb not null default '{}'::jsonb,  -- các cột tự Add
  "updatedAt" text default '',
  created_at timestamptz default now()
);

create index if not exists storefinance_user_period_idx
  on "storeFinance" ("userId", period);
create index if not exists storefinance_store_idx
  on "storeFinance" ("storeId");

create table if not exists "financeColumns" (
  id text primary key,
  "userId" text default '',
  name text not null,                         -- tên cột hiển thị (vd "Lương")
  "isCost" boolean not null default true,     -- true = trừ vào lợi nhuận
  created text default '',
  created_at timestamptz default now()
);

create index if not exists financecolumns_user_idx
  on "financeColumns" ("userId");

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

-- Kiểm tra
select table_name, column_name, data_type
from information_schema.columns
where table_name in ('storeFinance', 'financeColumns')
order by table_name, ordinal_position;
