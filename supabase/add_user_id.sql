-- Mỗi user có cửa hàng riêng: thêm cột userId
-- Chạy trong Supabase SQL Editor (không xóa data)

alter table "stores" add column if not exists "userId" text default '';
alter table "podOrders" add column if not exists "userId" text default '';

create index if not exists stores_userid_idx on "stores" ("userId");
create index if not exists podorders_userid_idx on "podOrders" ("userId");

notify pgrst, 'reload schema';
