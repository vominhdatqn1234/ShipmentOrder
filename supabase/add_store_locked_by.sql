-- =====================================================================
-- Thêm cột "lockedBy" cho bảng stores — FLAT MODE
-- Phân biệt shop bị Admin khóa (admin) hay Seller tự khóa (seller)
-- Chạy trong Supabase SQL Editor
-- =====================================================================

alter table "stores" add column if not exists "lockedBy" text;

notify pgrst, 'reload schema';
