-- =====================================================================
-- Thêm 3 cột phí do ADMIN nhập cho từng shop (per store)
--   designSupportFee : Hỗ trợ design ($)
--   mgmtFee          : Chi phí quản lý ($)
--   discountAmount   : Mức chiết khấu ($)
-- Các giá trị này hiển thị trên Overview của seller theo shop đang chọn.
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "stores" add column if not exists "designSupportFee" numeric default 0;
alter table "stores" add column if not exists "mgmtFee" numeric default 0;
alter table "stores" add column if not exists "discountAmount" numeric default 0;

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy đủ 3 cột
select column_name, data_type
from information_schema.columns
where table_name = 'stores'
  and column_name in ('designSupportFee', 'mgmtFee', 'discountAmount')
order by column_name;
