-- =====================================================================
-- Danh sách nhân viên xử lý (CS) — dùng cho ô "Tạo nhân viên" và cột
-- "Nhân viên" (chọn nhiều) trong tab Quản lý nhân viên.
-- Chạy trong Supabase Dashboard > SQL Editor.
-- =====================================================================
create table if not exists "csEmployees" (
  id text primary key,
  name text not null,
  created text,
  created_at timestamptz not null default now()
);
alter table "csEmployees" disable row level security;
create index if not exists csemployees_name_idx on "csEmployees" (name);
