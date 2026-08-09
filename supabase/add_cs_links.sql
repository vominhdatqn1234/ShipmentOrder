-- =====================================================================
-- Link thiết kế nhập tay ở tab Quản lý nhân viên (mặt trước / mặt sau / mockup)
-- Chạy trong Supabase Dashboard > SQL Editor.
-- =====================================================================
alter table "podOrders"
  add column if not exists "csFrontUrl" text default '',
  add column if not exists "csBackUrl" text default '',
  add column if not exists "csMockupUrl" text default '';
