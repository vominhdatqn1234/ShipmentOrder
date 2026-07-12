-- =====================================================
-- FIX: thêm các cột userId / storeId còn thiếu
-- (gộp add_user_id.sql + designs_user_store.sql)
-- Chạy trong Supabase SQL Editor — chỉ ALTER, không xóa data
-- =====================================================

-- Mỗi user có cửa hàng riêng
alter table "stores" add column if not exists "userId" text default '';
create index if not exists stores_userid_idx on "stores" ("userId");

-- Thiết lập cửa hàng: mã số thuế / IOSS / VAT
alter table "stores" add column if not exists "taxCode" text default '';

-- Đơn hàng theo user
alter table "podOrders" add column if not exists "userId" text default '';
create index if not exists podorders_userid_idx on "podOrders" ("userId");

-- Thiết kế riêng theo user và từng cửa hàng
alter table "designs" add column if not exists "userId" text default '';
alter table "designs" add column if not exists "storeId" text default '';
create index if not exists designs_userid_idx on "designs" ("userId");
create index if not exists designs_storeid_idx on "designs" ("storeId");

-- Nạp lại schema cache (hết lỗi PGRST204)
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy các cột userId/storeId
select table_name, column_name from information_schema.columns
where table_name in ('stores','podOrders','designs')
  and column_name in ('userId','storeId')
order by table_name, column_name;
