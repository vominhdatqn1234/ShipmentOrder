-- =====================================================================
-- "Add ID" — mã đơn khách gửi TRƯỚC khi đơn được úp lên hệ thống.
--
-- Nhân viên nhận ID từ khách → thêm vào đây. Khi đơn thật có đúng mã đó
-- xuất hiện trong podOrders, hệ thống tự khớp và gắn badge đỏ trên dòng đơn
-- ở tab Quản lý nhân viên để nhân viên kiểm tra lại (vd đơn đã đổi ID).
--
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

create table if not exists "pendingOrderIds" (
  id text primary key,
  "orderCode" text not null,        -- mã đơn khách gửi trước
  note text default '',             -- ghi chú của nhân viên
  "createdBy" text default '',      -- ai add
  created text default '',
  "matchedOrderId" text default '', -- id đơn thật khi đã khớp
  "matchedAt" text default '',      -- thời điểm khớp
  "ackAt" text default '',          -- nhân viên đã kiểm tra xong
  created_at timestamptz not null default now()
);

alter table "pendingOrderIds" disable row level security;
create index if not exists pendingorderids_code_idx
  on "pendingOrderIds" ("orderCode");

-- Reload schema cache của PostgREST (bắt buộc để hết lỗi PGRST204)
notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_name = 'pendingOrderIds'
order by ordinal_position;
