-- =====================================================================
-- Xuất file cho XƯỞNG (tab Trung tâm điều hành POD)
--
--   sentToFactoryAt : thời điểm đơn được đưa vào file xuất cho xưởng.
--                     Có giá trị = đã chuyển xưởng → dòng tô VÀNG.
--                     Khi đơn có tracking → dòng tự chuyển sang XANH.
--   factoryNote     : ghi chú khi đơn có vấn đề (admin gõ trên bảng đơn).
--                     Có ghi chú → dòng tô ĐỎ để xưởng thấy ngay.
--
-- Cột "Nhân viên xử lý" dùng lại csAssignee đã có (xem add_cs_columns.sql).
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

alter table "podOrders"
  add column if not exists "sentToFactoryAt" text default '',
  add column if not exists "factoryNote" text default '',
  -- Kiểu in do ADMIN nhập cho từng đơn — xuất ra cột "DTF/DTG"
  add column if not exists "dtfDtg" text default '',
  -- Card Code do ADMIN nhập — xuất ra cột "Card Code"
  add column if not exists "cardCode" text default '';

create index if not exists podorders_sent_factory_idx
  on "podOrders" ("sentToFactoryAt");

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

-- Kiểm tra
select column_name, data_type
from information_schema.columns
where table_name = 'podOrders'
  and column_name in
    ('sentToFactoryAt', 'factoryNote', 'dtfDtg', 'cardCode', 'csAssignee')
order by column_name;
