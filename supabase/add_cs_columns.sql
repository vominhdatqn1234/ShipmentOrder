-- =====================================================================
-- Cột phục vụ tab "Quản lý seller / Chăm sóc đơn" (CS) trên podOrders.
-- Mỗi đơn có thêm thông tin xử lý CS. Chạy trong Supabase Dashboard > SQL.
-- =====================================================================
alter table "podOrders"
  add column if not exists "csAssignee" text default '',      -- Nhân viên phụ trách
  add column if not exists "csStatus" text default '',        -- '' = Chưa xử lý | waiting = Chờ khách | done = Đã xử lý
  add column if not exists "csPartner" text default '',       -- Đối tác
  add column if not exists "csCustomerMsg" text default '',    -- Tin nhắn khách
  add column if not exists "csChangeInfo" text default '',     -- Đổi thông tin
  add column if not exists "csAutoReplyAt" text default '',    -- Thời gian trả lời tự động
  add column if not exists "csNote" text default '',          -- Ghi chú / sticker
  add column if not exists "csEditedBy" text default '',       -- Nhân viên chỉnh sửa gần nhất
  add column if not exists "csEditedAt" text default '';       -- Thời điểm chỉnh sửa gần nhất

create index if not exists podorders_cs_status_idx on "podOrders" ("csStatus");
create index if not exists podorders_cs_assignee_idx on "podOrders" ("csAssignee");
create index if not exists podorders_cs_editedby_idx on "podOrders" ("csEditedBy");
