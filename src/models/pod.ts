export type PodOrderStatus =
  | "pending_payment"
  | "pending_approval"
  | "in_production"
  | "shipping"
  | "completed"
  | "cancelled"
  | "support"
  | "reship";

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

export interface PodOrderItem {
  productName: string;
  productSku: string;
  sku: string;
  color: string;
  size: string;
  personalization?: string;
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
  datePaid?: string | null;
  dateShipped?: string | null;
}

export const GOLD = "#C6A15B";
export const SIDEBAR_BG = "#171826";
