-- =====================================================================
-- Thêm cột "printHouse" (Nhà In) cho đơn hàng POD — FLAT MODE
-- Chạy trong Supabase SQL Editor
-- =====================================================================

alter table "podOrders" add column if not exists "printHouse" text default '';

-- Nạp lại schema cache cho PostgREST (hết lỗi PGRST205 nếu có)
notify pgrst, 'reload schema';
