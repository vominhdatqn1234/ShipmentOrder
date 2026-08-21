-- ============================================================================
-- SOI TOÀN BỘ ĐƠN POD: đơn nào đang lưu giá $0 và vì sao
-- Chạy trong Supabase SQL Editor (project czypkctnlwyormkwjwfl)
--
-- Schema: podOrders / podVariants / baseProducts dùng CỘT RIÊNG (không phải
-- jsonb "data"); chỉ riêng podOrders.items là jsonb array.
-- Logic tra bảng giá mô phỏng đúng findVariantForItem của web:
--   thử productName -> tên phôi suy từ SKU (baseProducts) -> productSku
-- ============================================================================


-- ============================================================================
-- (1) ĐƠN ĐANG LƯU GIÁ $0 — kèm kết luận phải làm gì
-- ============================================================================
with items as (
  select
    o.id                        as order_id,
    o."orderCode"               as order_code,
    o.status                    as status,
    coalesce(o.total, 0)        as total,
    coalesce(o."printHouse",'') as print_house,
    o.created                   as created,
    it->>'productName'          as product_name,
    it->>'productSku'           as product_sku,
    it->>'color'                as color,
    it->>'size'                 as size,
    coalesce(nullif(it->>'price','')::numeric, 0)  as item_price,
    coalesce(nullif(it->>'quantity','')::int, 1)   as qty,
    -- In 2 mặt khi có link BACK hoặc MOCKUP -> giá = price + shipPrice + printOneSide
    (coalesce(btrim(it->>'backUrl'),'') <> '' or
     coalesce(btrim(it->>'mockupUrl'),'') <> '')   as two_side,
    -- Vùng in đặc biệt / In Full -> cộng thêm printExtraArea
    (it->>'printArea' in ('special','full') or
     jsonb_array_length(coalesce(it->'extraAreas','[]'::jsonb)) > 0) as has_extra
  from "podOrders" o
  cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) it
  where coalesce(o.total, 0) = 0
    and o.status not in ('refund', 'cancelled')
    and o."orderCode" !~ '-(C|RS)[0-9]+$'   -- bỏ đơn copy / reship (0đ cố ý)
),
-- Tên phôi suy từ SKU qua danh mục baseProducts (giống blankName ở web)
named as (
  select i.*, coalesce(bp.name, i.product_sku) as sku_as_name
  from items i
  left join "baseProducts" bp
    on lower(btrim(bp.sku)) = lower(btrim(i.product_sku))
),
-- Tra bảng giá phôi theo 3 ứng viên tên phôi
matched as (
  select
    n.*,
    v.id as variant_id,
    case
      when v.id is null then null
      when n.two_side then coalesce(v.price,0) + coalesce(v."shipPrice",0)
                           + coalesce(v."printOneSide",0)
      else coalesce(v."priceTeement", 0)
    end
    + case when n.has_extra and v.id is not null
           then coalesce(v."printExtraArea",0) else 0 end   as unit_price
  from named n
  left join lateral (
    select *
    from "podVariants" v2
    where lower(btrim(v2.product)) in (
            lower(btrim(coalesce(n.product_name, ''))),
            lower(btrim(coalesce(n.sku_as_name,  ''))),
            lower(btrim(coalesce(n.product_sku,  '')))
          )
      and lower(btrim(coalesce(v2.size,  ''))) = lower(btrim(coalesce(n.size,  '')))
      and lower(btrim(coalesce(v2.color, ''))) = lower(btrim(coalesce(n.color, '')))
    limit 1
  ) v on true
)
select
  order_code,
  status,
  nullif(print_house, '')                          as nha_in,
  left(coalesce(created, ''), 10)                  as ngay_tao,
  round(sum(coalesce(unit_price, 0) * qty), 2)     as gia_bang_phoi_tinh_ra,
  case
    when count(variant_id) = 0                 then 'X CHUA CO PHOI trong bang gia'
    when sum(coalesce(unit_price,0) * qty) = 0 then 'X CO PHOI nhung gia = 0'
    else                                            '! TINH LAI DUOC'
  end                                              as ket_luan,
  count(*)                                         as so_item,
  string_agg(distinct
    coalesce(nullif(product_name,''), product_sku) || ' / ' ||
    coalesce(nullif(color,''),'?')  || ' / ' ||
    coalesce(nullif(size,''),'?'), '  |  ')        as phoi_mau_size
from matched
group by order_code, status, print_house, created
order by ket_luan, created desc nulls last;


-- ============================================================================
-- (2) ĐƠN ĐÃ GÁN NHÀ IN NHƯNG PHÔI CHƯA CÓ GIÁ CỦA ĐÚNG NHÀ IN ĐÓ
--     (vd gán "Flashship" mà dòng phôi chỉ điền giá AK2)
--     Gom theo DÒNG PHÔI để điền 1 lần chữa được nhiều đơn.
-- ============================================================================
with items as (
  select
    o."orderCode"      as order_code,
    o."printHouse"     as print_house,
    it->>'productName' as product_name,
    it->>'productSku'  as product_sku,
    it->>'color'       as color,
    it->>'size'        as size
  from "podOrders" o
  cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) it
  where coalesce(btrim(o."printHouse"), '') <> ''
    and o.status not in ('refund', 'cancelled')
),
named as (
  select i.*, coalesce(bp.name, i.product_sku) as sku_as_name
  from items i
  left join "baseProducts" bp
    on lower(btrim(bp.sku)) = lower(btrim(i.product_sku))
),
matched as (
  select
    n.*,
    v.id as variant_id,
    case
      when lower(n.print_house) like '%ak2%'   then coalesce(v."priceAK2", 0)
      when lower(n.print_house) like '%fash%'
        or lower(n.print_house) like '%flash%' then coalesce(v."priceFashship", 0)
      when lower(n.print_house) like '%3d%'    then coalesce(v."price3D", 0)
      else 0
    end as house_price
  from named n
  left join lateral (
    select *
    from "podVariants" v2
    where lower(btrim(v2.product)) in (
            lower(btrim(coalesce(n.product_name, ''))),
            lower(btrim(coalesce(n.sku_as_name,  ''))),
            lower(btrim(coalesce(n.product_sku,  '')))
          )
      and lower(btrim(coalesce(v2.size,  ''))) = lower(btrim(coalesce(n.size,  '')))
      and lower(btrim(coalesce(v2.color, ''))) = lower(btrim(coalesce(n.color, '')))
    limit 1
  ) v on true
)
select
  print_house                                    as nha_in,
  coalesce(nullif(product_name,''), product_sku) as phoi,
  nullif(color,'')                               as color,
  nullif(size,'')                                as size,
  case when variant_id is null
       then 'X phoi CHUA CO trong bang gia'
       else '! co phoi nhung TRONG gia nha in nay'
  end                                            as ket_luan,
  count(distinct order_code)                     as so_don_bi_anh_huong,
  string_agg(distinct order_code, ', ')          as danh_sach_don
from matched
where coalesce(house_price, 0) = 0
group by print_house, phoi, color, size, ket_luan
order by so_don_bi_anh_huong desc;


-- ============================================================================
-- (3) TRA NHANH 1 ĐƠN CỤ THỂ (đổi mã đơn ở dòng cuối)
-- ============================================================================
select
  o."orderCode", o.status, o.total, o."printHouse", o.created,
  jsonb_pretty(o.items) as items
from "podOrders" o
where o."orderCode" = '4149195582';
