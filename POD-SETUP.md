# TeementPOD Seller Portal Clone — Hướng dẫn chạy

## Các bước (theo thứ tự)

### 1. Tạo schema cột riêng (MỚI NHẤT — không dùng jsonb)
[Supabase Dashboard](https://supabase.com/dashboard/project/czypkctnlwyormkwjwfl) → **SQL Editor** → dán **`supabase/schema_columns.sql`** → **Run**.

File này sẽ:
- **Migrate bảng `employee`** từ jsonb sang cột riêng (giữ nguyên tài khoản)
- ⚠️ Tạo lại 4 bảng `stores`, `baseProducts`, `designs`, `podOrders` với **mỗi field một cột thật** (name, sku, status, customerName, address1, total...) — data POD cũ dạng jsonb sẽ mất
- Riêng `items` của đơn hàng vẫn là jsonb (1 đơn nhiều món — chuẩn thiết kế)
- Chèn sẵn store **BESUN** + **25 phôi catalog**, reload schema cache

Cuối script có SELECT kiểm tra số dòng từng bảng.

> Các file `schema.sql`, `schema_pod.sql`, `reset_pod.sql` là phiên bản cũ (jsonb) — không dùng nữa.

### 2. (Tùy chọn) Seed đơn hàng mẫu từ CSV Etsy
```bash
node scripts/seed-pod-data.mjs
```
Thêm 132 đơn từ `data/etsy-orders-sample.csv` + designs theo SKU. Không chạy nếu muốn bắt đầu trống và tự Import CSV trong app (tab Đơn hàng → Import CSV).

### 3. Chạy app
```bash
npm start
```
Đăng nhập bằng tài khoản trong bảng `employee` (đã migrate từ Firebase).

## Chức năng đã clone

| Menu | Chức năng |
|---|---|
| Tổng quan | 5 stat cards, lọc Tháng/Quý/Năm, chart Doanh thu & Lượng đơn (apexcharts), donut tỷ trọng trạng thái |
| Danh mục phôi | Grid phôi + IN STOCK, tab danh mục, tìm SKU/tên, 4 kiểu sắp xếp, "Lên đơn →" mở modal tạo đơn với phôi chọn sẵn |
| Thiết kế của tôi | Bảng SKU: sửa link Front/Back/Mockup trực tiếp trên bảng, nền ướm thử (5 swatch), vùng in phụ, Nhập/Xuất CSV, thêm/xóa SKU, modal chi tiết |
| Đơn hàng | 9 tab trạng thái, tìm kiếm, lọc từ/đến ngày, xuất CSV, nút **Pay** (chuyển Chờ thanh toán → Chờ duyệt), đổi trạng thái, xóa; **Import CSV Etsy** (gộp items theo Order ID, parse Variations ra màu/size/personalization, preview trước khi import); **Tạo đơn lẻ / Sửa chi tiết** (khách hàng, địa chỉ, nhiều món, phôi/màu/size/SL/giá, SKU đồng bộ thư viện tự điền link ảnh, vùng in phụ, ghi chú gửi xưởng) |
| Quản lý Cửa hàng | Danh sách store, kết nối mới (tự sinh mã hệ thống), Thiết lập/Khóa/Xóa |
| Dịch vụ hỗ trợ | Trang dịch vụ design + Bảo mật & Chat với Admin |
| Layout | Sidebar đen-vàng TEEMENT.POD, chọn cửa hàng, header Tổng chi tiêu (tính từ đơn đã thanh toán) + menu user (hồ sơ/stores/dịch vụ/đăng xuất) |

## Kiến trúc

- Data model: 4 bảng jsonb, types tại `src/models/pod.ts`, hooks CRUD react-query tại `src/hooks/usePod.ts` (chạy trên compatibility layer `lib/db` → Supabase REST)
- Store selector: `src/store/usePodStore.ts` (zustand persist)
- CSV utils: `src/utils/csvPod.ts`
- Routes cũ (wedding studio) đã gỡ khỏi router, code cũ vẫn nằm trong `src/pages` — có thể xóa sau
