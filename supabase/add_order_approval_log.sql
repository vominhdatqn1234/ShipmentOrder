-- =====================================================================
-- Log người duyệt đơn trên "podOrders" (tab Quản lý Seller).
--
-- Mỗi lần bấm Duyệt đơn / Hủy đơn / Reship / Trả về trạng thái trước,
-- hệ thống ghi lại AI thao tác (nhân viên hoặc admin) + lúc nào + thao tác gì:
--   approvedBy     : tên nhân viên / admin đã bấm
--   approvedAt     : thời điểm (ISO)
--   approvedAction : tên thao tác (Duyệt đơn, Hủy đơn, Reship...)
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "podOrders"
  add column if not exists "approvedBy" text default '',
  add column if not exists "approvedAt" text default '',
  add column if not exists "approvedAction" text default '';

create index if not exists podorders_approvedby_idx on "podOrders" ("approvedBy");

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';
