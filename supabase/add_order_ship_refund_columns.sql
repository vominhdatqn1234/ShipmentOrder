-- =====================================================================
-- FIX: thêm các cột đơn hàng còn thiếu trên bảng podOrders
-- Lỗi khi đồng bộ: PGRST204 "Could not find the 'shipBy' column ..."
-- Nguyên nhân: model PodOrder có thêm field mới nhưng bảng chưa có cột.
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "podOrders" add column if not exists "shipBy" text;
alter table "podOrders" add column if not exists "prevStatus" text;
alter table "podOrders" add column if not exists "refundedAmount" numeric;
alter table "podOrders" add column if not exists "refundedAt" text;

-- Index phục vụ thống kê refund theo thời gian (tùy chọn)
create index if not exists podorders_refundedat_idx on "podOrders" ("refundedAt");

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy đủ 4 cột
select column_name, data_type
from information_schema.columns
where table_name = 'podOrders'
  and column_name in ('shipBy', 'prevStatus', 'refundedAmount', 'refundedAt')
order by column_name;
