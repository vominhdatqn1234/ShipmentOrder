-- =====================================================================
-- Mã nhân viên (userID) cho danh sách nhân viên CS.
--
--   code : mã nhận dạng riêng của mỗi nhân viên, vd NV001.
--          Hệ thống tự sinh khi tạo nhân viên mới; nhân viên cũ chưa có mã
--          sẽ được cấp tự động khi mở trang Quản lý nhân viên.
--
-- File xuất cho xưởng ghi cột "Nhân viên xử lý" dạng: Phương(NV001)
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "csEmployees" add column if not exists code text default '';

create index if not exists csemployees_code_idx on "csEmployees" (code);

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

select id, name, code from "csEmployees" order by created;
