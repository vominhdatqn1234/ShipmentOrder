-- =====================================================================
-- Tài khoản đăng nhập cho nhân viên CS (bảng "csEmployees").
--
--   username : tên đăng nhập riêng của nhân viên (duy nhất, không dấu)
--   password : mật khẩu đăng nhập admin portal
--   active   : true = còn được đăng nhập, false = đã khóa tài khoản
--
-- Nhân viên đăng nhập vào admin portal bằng username + password,
-- chỉ thấy các trang được phép (Quản lý Seller, Quản lý nhân viên,
-- Thông báo) và KHÔNG thấy các cột tiền: Giá / Phí / Tổng / Giá đối chiếu.
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "csEmployees"
  add column if not exists username text default '',
  add column if not exists password text default '',
  add column if not exists active boolean default true;

-- Username phải là duy nhất (bỏ qua các dòng chưa cấp tài khoản)
create unique index if not exists csemployees_username_uniq
  on "csEmployees" (lower(username))
  where coalesce(username, '') <> '';

create index if not exists csemployees_username_idx on "csEmployees" (username);

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

select id, name, code, username, active from "csEmployees" order by created;
