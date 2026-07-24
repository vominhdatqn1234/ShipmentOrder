-- =====================================================================
-- THÊM INDEX CẢI THIỆN TỐC ĐỘ REQUEST
-- Dựa trên các query thực tế của client + admin (ORDER BY created/name,
-- filter userId/storeId). Chỉ thêm index CÒN THIẾU; index đã có sẽ bỏ qua.
-- An toàn chạy nhiều lần (IF NOT EXISTS). Không xoá/đổi dữ liệu.
-- Chạy trong Supabase Dashboard > SQL Editor
-- =====================================================================

-- ---- Sắp xếp theo "created" (ORDER BY created DESC) ----
-- Các bảng này đều được query kèm ORDER BY created nhưng chưa có index created.
create index if not exists baseproducts_created_idx  on "baseProducts"  (created);
create index if not exists employee_created_idx      on "employee"      (created);
create index if not exists ledger_created_idx        on "ledgerEntries" (created);
create index if not exists designreq_created_idx     on "designRequests"(created);
create index if not exists trackings_created_idx     on "trackings"     (created);
create index if not exists printorders_created_idx   on "printOrders"   (created);

-- ---- Sắp xếp theo "name" (ORDER BY name ASC) ----
create index if not exists podcolors_name_idx        on "podColors"     (name);
create index if not exists printhouses_name_idx      on "printHouses"   (name);

-- ---- Index tổ hợp cho query hay dùng nhất ----
-- Client: podOrders WHERE userId = ? ORDER BY created DESC
create index if not exists podorders_user_created_idx
  on "podOrders" ("userId", created desc);
-- Client: podOrders WHERE userId = ? AND storeId = ?
create index if not exists podorders_user_store_idx
  on "podOrders" ("userId", "storeId");
-- Client: designs WHERE userId = ? AND storeId = ?
create index if not exists designs_user_store_idx
  on "designs" ("userId", "storeId");

-- ---- Cập nhật thống kê để planner chọn index mới ----
analyze "baseProducts";
analyze "employee";
analyze "ledgerEntries";
analyze "designRequests";
analyze "trackings";
analyze "printOrders";
analyze "podColors";
analyze "printHouses";
analyze "podOrders";
analyze "designs";

-- ---- Kiểm tra: liệt kê toàn bộ index hiện có của các bảng chính ----
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'podOrders','stores','designs','baseProducts','employee',
    'ledgerEntries','designRequests','trackings','printOrders',
    'podColors','printHouses','podVariants','printHouseSkus'
  )
order by tablename, indexname;
