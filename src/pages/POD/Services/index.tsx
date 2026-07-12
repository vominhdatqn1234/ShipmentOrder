import { Button, message } from "antd";
import { FiImage, FiShield } from "react-icons/fi";

const TAGS = [
  "Custom Design",
  "Trending",
  "Illustration",
  "Typography",
  "Chuẩn in ấn",
];

export default function Services() {
  const contact = () =>
    message.info("Liên hệ Telegram +84 943 024 337 hoặc WhatsApp +84 852 763 445");

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-start justify-between flex-wrap gap-4 relative overflow-hidden">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold text-[#171826] m-0">
            Dịch Vụ Mở Rộng &amp; Hỗ Trợ Seller
          </h1>
          <p className="text-gray-500 mt-3 mb-0 leading-relaxed">
            Ngoài hệ thống in ấn Fulfillment mạnh mẽ,{" "}
            <b className="text-[#171826]">TeementPOD</b> còn cung cấp hệ sinh
            thái dịch vụ đa dạng để giúp bạn dễ dàng mở rộng và scale quy mô
            kinh doanh POD trên toàn cầu.
          </p>
        </div>
        <Button
          className="bg-[#C6A15B] text-white border-0 font-bold h-[44px] px-5"
          onClick={contact}
        >
          💬 Liên hệ tư vấn ngay
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col relative">
          <span className="absolute top-4 right-4 text-[11px] font-bold text-red-500 bg-red-50 rounded-full px-2 py-1">
            🔥 HOT
          </span>
          <span className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl text-gray-600">
            <FiImage />
          </span>
          <h3 className="text-xl font-extrabold text-[#171826] mt-4 mb-2">
            Tạo Design Theo Yêu Cầu
          </h3>
          <p className="text-gray-500 leading-relaxed flex-1">
            Biến ý tưởng win của bạn thành tác phẩm thực tế! Đội ngũ thiết kế
            chuyên nghiệp sẽ cung cấp các mẫu design độc quyền 100%, độ phân
            giải cao và tối ưu hoàn hảo cho mọi phôi (áo thun, cốc, poster...).
            Giao file PNG/SVG tách nền, hỗ trợ tinh chỉnh bố cục đến khi bạn
            hoàn toàn ưng ý.
          </p>
          <div className="flex gap-2 flex-wrap border-t border-gray-100 pt-4 mt-4">
            {TAGS.map((t) => (
              <span
                key={t}
                className="text-[11px] bg-gray-100 text-gray-500 rounded px-2 py-1"
              >
                {t}
              </span>
            ))}
          </div>
          <Button
            className="mt-4 bg-[#C6A15B] text-white border-0 font-bold h-[42px]"
            onClick={contact}
          >
            Tiến hành →
          </Button>
        </div>
      </div>

      <div className="bg-[#171826] rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="w-11 h-11 rounded-full border border-[#C6A15B] text-[#C6A15B] flex items-center justify-center text-lg">
            <FiShield />
          </span>
          <div>
            <div className="text-white font-bold text-lg">Bảo mật &amp; Uy tín</div>
            <div className="text-gray-400 text-sm">
              Giao dịch an toàn, thông tin tài khoản được bảo mật tuyệt đối.
            </div>
          </div>
        </div>
        <Button className="h-[44px] font-bold px-5" onClick={contact}>
          Chat với Admin
        </Button>
      </div>
    </div>
  );
}
