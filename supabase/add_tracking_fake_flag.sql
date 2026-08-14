-- =====================================================================
-- TRACKING THẬT / TRACKING GIẢ
--
--   trackings.fake        : true = mã tracking giả (mua tạm, chưa có hàng thật)
--   podOrders.trackingFake: cờ tương ứng ghi vào đơn khi áp tracking vào đơn,
--                           để bên Quản lý Seller tô sáng + lọc được.
--
-- Mặc định đều là FALSE (tracking thật).
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "trackings"
  add column if not exists fake boolean not null default false;

alter table "podOrders"
  add column if not exists "trackingFake" boolean not null default false;

create index if not exists podorders_tracking_fake_idx
  on "podOrders" ("trackingFake");

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

select table_name, column_name, data_type
from information_schema.columns
where (table_name = 'trackings' and column_name = 'fake')
   or (table_name = 'podOrders' and column_name = 'trackingFake');
