-- =====================================================================
-- GIÁ THEO NHÀ IN cho từng biến thể phôi (Bảng giá POD).
--
--   housePrices : { "<tên nhà in>": <giá> }
--                 vd { "Xưởng B": 12.5, "AK2": 13 }
--
-- Mỗi nhà in trong tab "Nhà In" sẽ có 1 cột giá riêng nằm sau Giá Teement.
-- Nhà in chưa có trong danh sách thì tạo thêm ngay tại Bảng giá POD.
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "podVariants"
  add column if not exists "housePrices" jsonb not null default '{}'::jsonb;

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_name = 'podVariants' and column_name = 'housePrices';
