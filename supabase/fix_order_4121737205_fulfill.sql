-- =====================================================================
-- Sửa Phôi Fulfill về "CamTran-CTV-24" cho ĐÚNG 1 đơn: 4121737205
-- (đơn chỉ có 1 sản phẩm → item index 0)
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1) Xem trước giá trị hiện tại (kiểm tra trước khi sửa)
select "orderCode",
       items->0->>'productSku'  as fulfill_type,
       items->0->>'color'       as fulfill_color,
       items->0->>'size'        as fulfill_size,
       items->0->>'origType'    as goc_type
from "podOrders"
where "orderCode" = '4121737205';

-- 2) Cập nhật Phôi Fulfill = CamTran-CTV-24, bỏ color/size (khớp bản gốc)
update "podOrders"
set items = jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(items, '{0,productSku}',  '"CamTran-CTV-24"'),
                  '{0,productName}', '"CamTran-CTV-24"'),
                '{0,color}', '""'),
              '{0,size}',  '""')
where "orderCode" = '4121737205';

-- 3) Xem lại sau khi sửa (phải thấy CamTran-CTV-24)
select "orderCode",
       items->0->>'productSku' as fulfill_type,
       items->0->>'color'      as fulfill_color,
       items->0->>'size'       as fulfill_size
from "podOrders"
where "orderCode" = '4121737205';
