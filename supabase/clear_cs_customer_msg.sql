-- =====================================================================
-- Xoá TRỐNG toàn bộ "Tin nhắn khách" (csCustomerMsg) đã lưu từ các lần import
-- trước (khi còn tự lấy từ Personalization). Sau này nhân viên tự nhập tay.
-- Chạy 1 lần trong Supabase Dashboard > SQL Editor.
-- =====================================================================
update "podOrders"
set "csCustomerMsg" = ''
where coalesce("csCustomerMsg", '') <> '';
