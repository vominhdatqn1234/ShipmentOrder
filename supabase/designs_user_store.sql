-- Thiết kế riêng theo user và theo từng cửa hàng
-- Chạy trong Supabase SQL Editor (không xóa data)

alter table "designs" add column if not exists "userId" text default '';
alter table "designs" add column if not exists "storeId" text default '';

create index if not exists designs_userid_idx on "designs" ("userId");
create index if not exists designs_storeid_idx on "designs" ("storeId");

notify pgrst, 'reload schema';
