-- =====================================================================
-- Chat nội bộ Admin <-> Nhân viên (bảng "staffMessages").
--
-- Mỗi dòng là 1 tin nhắn trong luồng chat của MỘT nhân viên:
--   staffId    : csEmployees.id — chủ luồng chat (admin nhắn cho ai)
--   senderRole : 'admin' = admin gửi | 'staff' = nhân viên trả lời
--   orderCode  : mã đơn liên quan (không bắt buộc) — bấm vào nhảy tới đơn
--   readByStaff / readByAdmin : đã đọc chưa (để hiện badge đỏ ở menu)
--   doneAt     : nhân viên bấm "Đã xử lý" lúc nào
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

create table if not exists "staffMessages" (
  id text primary key,
  created_at timestamptz default now(),
  "staffId" text not null,
  "staffName" text default '',
  "senderRole" text default 'admin',
  "senderName" text default '',
  content text default '',
  "orderCode" text default '',
  "readByStaff" boolean default false,
  "readByAdmin" boolean default false,
  "doneAt" text default '',
  created text default ''
);

create index if not exists staffmessages_staff_idx on "staffMessages" ("staffId");
create index if not exists staffmessages_created_idx on "staffMessages" (created);
create index if not exists staffmessages_readstaff_idx on "staffMessages" ("readByStaff");
create index if not exists staffmessages_readadmin_idx on "staffMessages" ("readByAdmin");

-- Giống các bảng khác của portal: không bật RLS (client dùng chung key)
alter table "staffMessages" disable row level security;

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';
