-- =====================================================================
-- Thêm cột "Giá đối chiếu" cho podOrders.
-- Admin nhập một mức giá để SO SÁNH với cột Tổng (dương/âm).
-- Cột này CHỈ dùng để đối chiếu, không ảnh hưởng tổng tiền/công nợ.
-- Chạy trong Supabase Dashboard > SQL Editor.
-- =====================================================================
alter table "podOrders"
  add column if not exists "comparePrice" numeric;
