export type PodOrderStatus =
  | "pending_payment"
  | "pending_approval"
  | "in_production"
  | "shipping"
  | "completed"
  | "cancelled"
  | "support"
  | "reship"
  | "refund";

export const POD_STATUS: Record<
  PodOrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending_payment: { label: "CHỜ THANH TOÁN", color: "#B7791F", bg: "#FEF9E7" },
  pending_approval: { label: "CHỜ DUYỆT", color: "#6B46C1", bg: "#F3EBFF" },
  in_production: { label: "ĐANG SẢN XUẤT", color: "#2563EB", bg: "#EBF2FF" },
  shipping: { label: "ĐANG GIAO HÀNG", color: "#0E7490", bg: "#E0F7FA" },
  completed: { label: "HOÀN THÀNH", color: "#15803D", bg: "#E8F7EC" },
  cancelled: { label: "ĐÃ HỦY", color: "#B91C1C", bg: "#FDECEC" },
  support: { label: "YÊU CẦU HỖ TRỢ", color: "#C2410C", bg: "#FFF1E7" },
  reship: { label: "ĐƠN RESHIP", color: "#4338CA", bg: "#EEF0FF" },
  refund: { label: "HOÀN TIỀN", color: "#BE123C", bg: "#FFE4E6" },
};

export const POD_STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending_payment", label: "Chờ thanh toán" },
  { key: "pending_approval", label: "Chờ duyệt" },
  { key: "in_production", label: "Đang sản xuất" },
  { key: "shipping", label: "Đang giao hàng" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
  { key: "support", label: "Yêu cầu Hỗ trợ" },
  { key: "reship", label: "Đơn Reship" },
  { key: "refund", label: "Hoàn tiền" },
];

export interface PodStore {
  id: string;
  name: string;
  systemCode: string;
  status: "active" | "locked";
  lockedBy?: "admin" | "seller" | null; // ai khóa shop
  logo?: string;
  taxCode?: string;
  userId?: string;
  created?: string;
  /** Phí do admin nhập cho từng shop (hiển thị trên Overview theo shop đang chọn) */
  designSupportFee?: number; // Hỗ trợ design ($)
  mgmtFee?: number; // Chi phí quản lý ($)
  discountAmount?: number; // Mức chiết khấu ($)
}

/**
 * Số liệu tài chính khách TỰ NHẬP cho 1 shop trong 1 kỳ (bảng "Theo shop").
 * Các cột còn lại được tính tự động từ đơn hàng / phí admin nhập.
 */
export interface StoreFinance {
  id: string; // "<storeId>__<period>"
  userId?: string;
  storeId: string;
  period: string; // 2026-08-13 | 2026-W33 | 2026-08 | 2026-Q3 | 2026
  revenue?: number; // Doanh thu (khách nhập)
  otherCost?: number; // Chi Phí Khác (khách nhập)
  extras?: Record<string, number>; // { [financeColumnId]: số tiền }
  updatedAt?: string;
}

/** Cột do khách tự Add vào bảng "Theo shop" (vd Lương) */
export interface FinanceColumn {
  id: string;
  userId?: string;
  name: string;
  /** true = chi phí (trừ vào lợi nhuận), false = thu (cộng vào lợi nhuận) */
  isCost: boolean;
  created?: string;
}

/** Sinh key kỳ để lưu số liệu tài chính theo từng kỳ đang chọn trên Overview */
export function financePeriodKey(
  period: "day" | "week" | "month" | "quarter" | "year",
  d: any // dayjs.Dayjs — mốc thời gian của kỳ
): string {
  if (period === "day") return d.format("YYYY-MM-DD");
  // Không dùng plugin weekOfYear: lấy ngày đầu tuần làm khoá
  if (period === "week") return `W${d.startOf("week").format("YYYY-MM-DD")}`;
  if (period === "month") return d.format("YYYY-MM");
  if (period === "quarter")
    return `${d.year()}-Q${Math.floor(d.month() / 3) + 1}`;
  return d.format("YYYY");
}

export interface BaseProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  baseCost: number;
  inStock: boolean;
  image?: string;
  colors: string[];
  sizes: string[];
  created?: string;
}

export interface DesignExtraArea {
  name: string;
  url: string;
}

export interface Design {
  id: string;
  sku: string;
  frontUrl: string;
  backUrl: string;
  mockupUrl: string;
  extraAreas: DesignExtraArea[];
  testBg?: string;
  userId?: string;
  storeId?: string;
  created?: string;
}

/** Phụ phí vùng in đặc biệt ($/sản phẩm) — fallback khi chưa có bảng giá phôi */
export const SPECIAL_PRINT_AREA_FEE = 2;
export const SPECIAL_PRINT_AREA_LABEL = "Vùng in đặc biệt";
/** In Full — dùng chung mức phụ phí với vùng in đặc biệt */
export const FULL_PRINT_LABEL = "In Full";

/** Nhãn hiển thị của vùng in */
export function printAreaLabel(area?: string): string {
  if (area === "special") return SPECIAL_PRINT_AREA_LABEL;
  if (area === "full") return FULL_PRINT_LABEL;
  return "Mặc định";
}

/**
 * Tổng tiền 1 item = đơn giá × SL.
 * Đơn giá (item.price) được tính tự động từ bảng giá phôi POD (variantUnitPrice),
 * đã bao gồm phụ phí vùng in đặc biệt nếu có.
 */
export function podItemTotal(it: {
  price?: number;
  quantity?: number;
  printArea?: string;
}): number {
  return (it.price || 0) * (it.quantity || 1);
}

/** Biến thể phôi trong bảng giá POD (đồng bộ từ admin, collection "podVariants") */
export interface PodVariant {
  id: string;
  product: string;
  color?: string;
  size?: string;
  price?: number; // Giá
  shipPrice?: number; // Giá ship
  printOneSide?: number; // In 1 mặt
  printExtraArea?: number; // In vùng phụ
  priceAK2?: number;
  priceFashship?: number;
  price3D?: number;
  priceTeement?: number; // Giá Teement
  created?: string;
}

const _norm = (x?: string) => (x || "").trim().toLowerCase();

/** Các mã size thường gặp (để tách size bị dính trong color, vd "Gildan 2XL") */
export const KNOWN_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "2XL", "3XL", "4XL", "5XL", "6XL",
  "2X", "3X", "4X", "5X",
];

/**
 * Etsy đôi khi gộp size vào color (vd color = "Gildan 2XL", size = "").
 * Nếu size trống mà color kết thúc bằng 1 mã size đã biết → tách ra.
 * Chỉ tách khi color còn ít nhất 1 từ khác (không biến color thành rỗng).
 */
export function splitSizeFromColor(
  color?: string,
  size?: string
): { color: string; size: string } {
  let c = (color || "").trim();
  let s = (size || "").trim();
  if (!s && c) {
    const toks = c.split(/\s+/);
    const last = (toks[toks.length - 1] || "").toUpperCase();
    if (toks.length > 1 && KNOWN_SIZES.includes(last)) {
      s = toks.pop() as string;
      c = toks.join(" ");
    }
  }
  return { color: c, size: s };
}


/**
 * Tìm biến thể phôi khớp Sản phẩm + Size + Màu.
 * Ưu tiên khớp cả màu; nếu không có màu khớp thì lấy dòng cùng Sản phẩm + Size.
 * Nếu không có size khớp thì fallback theo Sản phẩm.
 */
export function findVariant(
  variants: PodVariant[],
  product?: string,
  size?: string,
  color?: string
): PodVariant | undefined {
  const p = _norm(product);
  if (!p) return undefined;
  const prod = variants.filter((v) => _norm(v.product) === p);
  if (!prod.length) return undefined;
  const s = _norm(size);
  const bySize = s ? prod.filter((v) => _norm(v.size) === s) : prod;
  const pool = bySize.length ? bySize : prod;
  const c = _norm(color);
  if (!c) return pool[0];
  // Mỗi màu là 1 tên đầy đủ (vd "Sport Grey", "Dark Heather") — khớp nguyên chuỗi
  return pool.find((v) => _norm(v.color) === c) || pool[0];
}

/**
 * Đơn giá 1 item theo bảng giá phôi POD:
 * - Chỉ in 1 mặt (không có link BACK/MOCKUP) → Giá Teement.
 * - Có link BACK hoặc MOCKUP (in 2 mặt) → Giá + Giá ship + In 1 mặt.
 * - Vùng in đặc biệt / In Full → cộng thêm In vùng phụ (cùng mức phí).
 * Không tìm được biến thể → giữ nguyên giá hiện tại của item (không ghi đè).
 */
export function variantUnitPrice(
  v: PodVariant | undefined,
  item: {
    price?: number;
    backUrl?: string;
    mockupUrl?: string;
    printArea?: string;
    extraAreas?: { name: string; url: string }[];
  }
): number {
  if (!v) return item.price || 0;
  const twoSide = !!((item.backUrl || "").trim() || (item.mockupUrl || "").trim());
  let price = twoSide
    ? (v.price || 0) + (v.shipPrice || 0) + (v.printOneSide || 0)
    : v.priceTeement || 0;
  // Vùng in đặc biệt / In Full / có vùng in phụ (form đơn) → + In vùng phụ
  const hasExtra =
    item.printArea === "special" ||
    item.printArea === "full" ||
    (item.extraAreas?.length || 0) > 0;
  if (hasExtra) price += v.printExtraArea || 0;
  return price;
}

export interface PodOrderItem {
  productName: string;
  productSku: string;
  sku: string;
  color: string;
  size: string;
  personalization?: string;
  /**
   * Bản GỐC khách up lên (Etsy) — luôn giữ nguyên, không đổi khi seller chọn lại
   * phôi Fulfill. Hiển thị ở ô vàng. Các field productSku/color/size bên dưới là
   * phôi Fulfill (mặc định = bản gốc, seller có thể đổi).
   */
  origTitle?: string;
  origType?: string;
  origColor?: string;
  origSize?: string;
  /** Vùng in: "" = Mặc định, "special" = Vùng in đặc biệt 16*21 (+$2/sp) */
  printArea?: string;
  quantity: number;
  price: number;
  itemTotal?: number;
  transactionId?: string;
  frontUrl: string;
  backUrl: string;
  mockupUrl: string;
  extraAreas: DesignExtraArea[];
  note?: string;
}

export interface PodOrder {
  id: string;
  orderCode: string;
  storeId: string;
  storeName?: string;
  status: PodOrderStatus;
  tracking?: string;
  source?: "etsy" | "manual" | "csv";
  userId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  items: PodOrderItem[];
  note?: string;
  total: number;
  created: string;
  /** Hạn giao Etsy (Scheduled to ship by), dùng để ưu tiên fulfil đơn gấp */
  shipBy?: string | null;
  datePaid?: string | null;
  dateShipped?: string | null;
  /** Trạng thái trước khi gửi Yêu cầu Hỗ trợ (để admin hủy yêu cầu trả về đúng chỗ) */
  prevStatus?: string | null;
  /** Số tiền đã hoàn cho đơn (lưu lại để thống kê refund) — đơn refund hiển thị giá 0đ */
  refundedAmount?: number | null;
  /** Thời điểm hoàn tiền (để thống kê theo tháng) */
  refundedAt?: string | null;
  /** Tin nhắn khách (lấy từ Personalization của Etsy) — dùng cho CS bên admin */
  csCustomerMsg?: string;
}

export const GOLD = "#C6A15B";
export const SIDEBAR_BG = "#171826";
