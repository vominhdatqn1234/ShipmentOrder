-- =====================================================================
-- Danh mục (Loại) phôi POD (bảng "podBlankCategories").
--
-- Admin bấm "Quản lý danh mục" ở trang Kho Phôi POD để thêm / đổi tên / xoá.
-- Danh sách này dùng cho:
--   - Dropdown lọc phôi theo danh mục ở đầu trang Kho Phôi POD
--   - Nút "Gán danh mục" hàng loạt cho các phôi đang chọn
-- Ô "Danh mục (Loại)" trong form thêm/sửa phôi vẫn là ô nhập tay tự do.
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

create table if not exists "podBlankCategories" (
  id text primary key,
  created_at timestamptz default now(),
  name text not null,
  created text default ''
);

create index if not exists podblankcategories_created_idx
  on "podBlankCategories" (created);

-- Giống các bảng khác của portal: không bật RLS (client dùng chung key)
alter table "podBlankCategories" disable row level security;

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';
