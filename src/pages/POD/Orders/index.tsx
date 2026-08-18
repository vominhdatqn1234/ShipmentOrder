import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Pagination,
  Popconfirm,
  Progress,
  Select,
  Tooltip,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCopy,
  FiCreditCard,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiHelpCircle,
  FiList,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import OrdersPackingSlips from "./OrdersPackingSlips";
import {
  useDesigns,
  usePodImportQueue,
  usePodImportQueueMutations,
  usePodOrderMutations,
  usePodOrders,
  usePodVariants,
  useStores,
} from "../../../hooks/usePod";
import {
  POD_STATUS,
  POD_STATUS_TABS,
  PodOrder,
  PodOrderStatus,
  findVariant,
} from "../../../models/pod";
import { usePodStore } from "../../../store/usePodStore";
import { downloadCSV, parseCSV, parseVariations, toCSV } from "../../../utils/csvPod";
import { parseEtsyPackingSlipPdf } from "../../../utils/pdfPod";
import OrderItemEditor from "./OrderItemEditor";
import OrderModal from "./OrderModal";
import SheetImportModal from "./SheetImportModal";
import { useAccountGuard } from "../../../hooks/useAccountGuard";
import {
  PodOrderItem,
  SPECIAL_PRINT_AREA_FEE,
  FULL_PRINT_LABEL,
  SPECIAL_PRINT_AREA_LABEL,
  podItemTotal,
} from "../../../models/pod";

type ViewTab = "list" | "import" | "create";

/** Hướng dẫn kích thước file in — hover vào dấu ✳ ở cột VÙNG IN để xem */
const PRINT_AREA_GUIDE = (
  <div className="text-xs leading-6">
    <div>
      <b>Mặc định</b> 4500*5400 hoặc 4500*5100
    </div>
    <div>
      <b>Hoodie</b> 4500*3000 cho mặt trước
    </div>
    <div className="mt-1 font-bold">Vùng in lớn</div>
    <div>4800*6300px cho S-L</div>
    <div>6000*7500px cho XL-5XL</div>
  </div>
);

function StatusBadge({ status }: { status: PodOrderStatus }) {
  const st = POD_STATUS[status] || POD_STATUS.pending_payment;
  return (
    <span
      className="text-[10px] font-bold tracking-wider px-2 py-1 rounded whitespace-nowrap"
      style={{ color: st.color, background: st.bg }}
    >
      {st.label}
    </span>
  );
}

export default function Orders() {
  const location = useLocation();
  const { orders, isLoading } = usePodOrders();
  // Khi search: tìm trên tất cả đơn của mọi cửa hàng của seller
  const { orders: allOrders } = usePodOrders({ allStores: true });
  const { add, update, remove, addMany, removeMany } = usePodOrderMutations();
  const { batches: importBatches } = usePodImportQueue();
  const { submit: submitImport, remove: removeImportBatch } =
    usePodImportQueueMutations();
  const { stores } = useStores();
  const { designs } = useDesigns();
  const { variants } = usePodVariants();
  const { selectedStoreId } = usePodStore();
  // Phụ phí vùng in đặc biệt lấy theo bảng giá phôi POD (In vùng phụ)
  const specialFee = (it: PodOrderItem) =>
    findVariant(variants, it.productSku, it.size, it.color)?.printExtraArea ??
    SPECIAL_PRINT_AREA_FEE;
  const { ensureAccount } = useAccountGuard();
  // Chặn tạo đơn/import khi chưa có shop hoặc shop đang bị khóa
  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const shopLocked = selectedStore?.status === "locked";
  const createBlockMsg = !stores.length
    ? "Bạn chưa có shop nào — hãy tạo/kết nối shop trước"
    : shopLocked
    ? "Cửa hàng đang bị khóa — không thể tạo đơn/import. Vui lòng liên hệ admin."
    : "";
  const canCreate = !createBlockMsg;
  /**
   * IMPORT (CSV / PDF / Google Sheets) vẫn cho chạy KHI CHƯA CÓ SHOP —
   * đơn sẽ mang storeId rỗng và tên shop "Chưa có shop", gán shop sau.
   * Chỉ chặn khi cửa hàng đang chọn bị KHÓA.
   */
  const importBlockMsg = shopLocked
    ? "Cửa hàng đang bị khóa — không thể import. Vui lòng liên hệ admin."
    : "";
  const canImport = !importBlockMsg;
  const NO_STORE_NAME = "Chưa có shop";
  /** Tên shop ghi vào đơn import (chưa có shop thì ghi "Chưa có shop") */
  const importStoreName = selectedStore?.name || NO_STORE_NAME;
  const [view, setView] = useState<ViewTab>("list");
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [trackFilter, setTrackFilter] = useState<"all" | "has" | "none">("all");
  // Lọc theo cửa hàng: shop đang chọn | mọi shop | đơn CHƯA GÁN SHOP
  const [shopFilter, setShopFilter] = useState<"current" | "all" | "none">(
    "current"
  );
  const [editing, setEditing] = useState<PodOrder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [presetSku, setPresetSku] = useState<string | undefined>();
  const [importPreview, setImportPreview] = useState<any[]>([]);
  // Nguồn của danh sách preview: PDF phải qua hàng đợi admin duyệt; CSV giữ luồng cũ.
  const [importSource, setImportSource] = useState<"pdf" | "csv" | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewSelectedIds, setPreviewSelectedIds] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Modal import đơn từ link Google Sheets (ghép cột + sửa trực tiếp)
  const [sheetOpen, setSheetOpen] = useState(false);

  /** Gửi lô đơn đọc từ Google Sheets vào hàng đợi chờ admin duyệt */
  const submitSheetOrders = async (
    list: { id?: string; data: any }[],
    sourceName: string
  ) => {
    const store = stores.find((s) => s.id === selectedStoreId);
    try {
      await submitImport.mutateAsync({
        fileName: sourceName,
        source: "sheet",
        storeId: selectedStoreId,
        storeName: store?.name || NO_STORE_NAME,
        list,
      });
      message.success(
        `Đã gửi ${list.length} đơn vào hàng đợi — chờ admin duyệt trước khi lên hệ thống`
      );
      setSheetOpen(false);
    } catch (e) {
      message.error("Không gửi được lô đơn vào hàng đợi. Vui lòng thử lại.");
    }
  };

  const handleImportPdf = async (file: File) => {
    if (!canImport) return message.warning(importBlockMsg);
    const store = stores.find((s) => s.id === selectedStoreId);
    try {
      const preview = await parseEtsyPackingSlipPdf(file, {
        storeId: selectedStoreId,
        store,
        designs,
        variants,
      });
      // Chưa có shop -> ghi tên shop mặc định để dễ nhận biết, gán shop sau
      preview.forEach((p: any) => {
        if (!p.data.storeName) p.data.storeName = NO_STORE_NAME;
      });
      if (!preview.length) {
        message.error("Không tìm thấy đơn Etsy hợp lệ trong file PDF này");
        return;
      }
      setImportPreview(preview);
      setImportSource("pdf");
      setImportFileName(file.name);
      setPreviewPage(1);
      message.info(`Đọc được ${preview.length} đơn từ ${file.name} — kiểm tra rồi bấm Gửi admin duyệt`);
    } catch (error) {
      console.error("PDF import error", error);
      message.error("Không thể đọc file PDF. Vui lòng dùng packing slip PDF xuất từ Etsy.");
    }
  };

  // Sửa 1 item trong đơn ngay trên bảng (inline editor)
  const patchOrderItem = (
    o: PodOrder,
    idx: number,
    patch: Partial<PodOrderItem>
  ) => {
    // Đơn đã thanh toán -> seller không được sửa item nữa
    if (o.status !== "pending_payment") return;
    const items = (o.items || []).map((it, i) =>
      i === idx ? { ...it, ...patch } : it
    );
    // Tổng gồm cả phụ phí vùng in đặc biệt (+$2/sp)
    const total = items.reduce((s, i) => s + podItemTotal(i), 0);
    update.mutate({ id: o.id, items, total } as any);
  };

  // Từ Catalog bấm "Lên đơn" -> mở modal tạo đơn với phôi chọn sẵn
  useEffect(() => {
    const sku = (location.state as any)?.createWithSku;
    if (sku) {
      setPresetSku(sku);
      setCreateOpen(true);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // Từ trang chi tiết Tổng quan bấm 1 đơn -> tìm sẵn mã đơn đó
  useEffect(() => {
    const code = (location.state as any)?.focusOrderCode;
    if (code) {
      setStatusTab("all");
      setSearch(String(code));
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // ---- Tìm kiếm nhanh: gom mọi thông tin của đơn thành 1 chuỗi để dò ----
  // Nhiều từ khoá cách nhau bởi dấu cách = phải khớp TẤT CẢ (AND).
  const searchIndex = useMemo(() => {
    const m = new Map<string, string>();
    const build = (o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return [
        o.orderCode,
        o.storeName,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.tracking,
        o.note,
        POD_STATUS[o.status as PodOrderStatus]?.label,
        o.address1,
        o.address2,
        o.city,
        o.state,
        o.zip,
        o.country,
        o.created ? dayjs(o.created).format("DD/MM/YYYY") : "",
        ...items.flatMap((it: any) => [
          it?.productName,
          it?.productSku,
          it?.sku,
          it?.color,
          it?.size,
          it?.origType,
          it?.origColor,
          it?.origSize,
          it?.origTitle,
          it?.personalization,
          it?.note,
          it?.transactionId,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    };
    [...orders, ...allOrders].forEach((o: any) => {
      if (!m.has(o.id)) m.set(o.id, build(o));
    });
    return m;
  }, [orders, allOrders]);

  const searchTerms = useMemo(
    () =>
      search
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [search]
  );

  /** Số đơn chưa gán shop (import khi chưa có / chưa chọn cửa hàng) */
  const noShopCount = useMemo(
    () => allOrders.filter((o) => !String(o.storeId || "").trim()).length,
    [allOrders]
  );

  const filtered = useMemo(() => {
    // Có từ khóa hoặc lọc ngoài shop hiện tại -> tìm trên đơn của MỌI cửa hàng
    const source =
      search.trim() || shopFilter !== "current" ? allOrders : orders;
    return source.filter((o) => {
      // Đơn chưa gán shop: storeId rỗng (import khi chưa có/chưa chọn cửa hàng)
      const noShop = !String(o.storeId || "").trim();
      if (shopFilter === "none" && !noShop) return false;
      if (statusTab !== "all" && o.status !== statusTab) return false;
      if (searchTerms.length) {
        const hay = searchIndex.get(o.id) || "";
        if (!searchTerms.every((t) => hay.includes(t))) return false;
      }
      if (fromDate && dayjs(o.created).isBefore(dayjs(fromDate), "day"))
        return false;
      if (toDate && dayjs(o.created).isAfter(dayjs(toDate), "day"))
        return false;
      if (trackFilter === "has" && !(o.tracking || "").trim()) return false;
      if (trackFilter === "none" && (o.tracking || "").trim()) return false;
      return true;
    });
  }, [
    orders,
    allOrders,
    statusTab,
    search,
    searchTerms,
    searchIndex,
    fromDate,
    toDate,
    trackFilter,
    shopFilter,
  ]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );
  useEffect(() => {
    setPage(1);
  }, [statusTab, search, fromDate, toDate, trackFilter, shopFilter]);

  // Bỏ selection của các đơn không còn tồn tại
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => orders.some((o) => o.id === id))
    );
  }, [orders]);

  useEffect(() => {
    setPreviewSelectedIds((prev) =>
      prev.filter((id) => importPreview.some((r) => r.id === id))
    );
  }, [importPreview]);

  const pageIds = paged.map((o) => o.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const togglePage = (checked: boolean) =>
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...pageIds]))
        : prev.filter((id) => !pageIds.includes(id))
    );
  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );

  // Trong số đơn đã chọn, chỉ đơn CHƯA thanh toán hoặc ĐÃ HỦY mới xóa được
  const DELETABLE_STATUSES = ["pending_payment", "cancelled"];
  const deletableSelectedIds = selectedIds.filter((id) => {
    const o = allOrders.find((x) => x.id === id);
    return o && DELETABLE_STATUSES.includes(o.status);
  });

  // Chỉ hoàn tiền được đơn đã bấm Pay (có datePaid) và chưa ở tab Hoàn tiền/Đã hủy
  const refundableSelectedIds = selectedIds.filter((id) => {
    const o = allOrders.find((x) => x.id === id);
    return (
      o &&
      !!o.datePaid &&
      !["refund", "cancelled", "pending_payment"].includes(o.status)
    );
  });

  // Chỉ thanh toán được đơn CHƯA thanh toán (status chờ thanh toán & chưa có datePaid)
  const payableSelectedIds = selectedIds.filter((id) => {
    const o = allOrders.find((x) => x.id === id);
    return o && o.status === "pending_payment" && !o.datePaid;
  });

  // Đơn đã chọn mà CHƯA có shop -> cho gán vào cửa hàng đang chọn
  const noShopSelectedIds = selectedIds.filter((id) => {
    const o = allOrders.find((x) => x.id === id);
    return o && !String(o.storeId || "").trim();
  });

  /** Gán các đơn chưa có shop vào cửa hàng đang chọn */
  const handleAssignShop = async () => {
    if (!selectedStore) return message.warning("Chưa chọn cửa hàng");
    for (const id of noShopSelectedIds) {
      await update.mutateAsync({
        id,
        storeId: selectedStore.id,
        storeName: selectedStore.name,
      } as any);
    }
    message.success(
      `Đã gán ${noShopSelectedIds.length} đơn vào shop ${selectedStore.name}`
    );
    setSelectedIds([]);
  };

  // Copy đơn = tạo 1 đơn MỚI dựa trên toàn bộ data của đơn gốc.
  // Đơn mới LUÔN về 0đ (giá từng sản phẩm = 0, tổng = 0) — khách chỉ trả khi tự bấm Pay.
  // - Copy thường: trạng thái Chờ thanh toán, mã <mã gốc>-C1, -C2...
  // - Hỗ trợ ship lại: trạng thái Đơn Reship, mã <mã gốc>-RS1, -RS2...
  const duplicateOrder = async (
    o: PodOrder,
    opts: { status?: PodOrderStatus; prefix?: string } = {}
  ) => {
    const { status = "pending_payment", prefix = "C" } = opts;
    const copies = allOrders.filter((x) =>
      x.orderCode?.startsWith(`${o.orderCode}-${prefix}`)
    ).length;
    const { id, ...rest } = o as any;
    // Đơn copy/ship lại về 0đ: reset giá từng item và tổng đơn
    const items = (o.items || []).map((it) => ({
      ...it,
      price: 0,
      itemTotal: 0,
    }));
    const data = {
      ...rest,
      items,
      total: 0,
      orderCode: `${o.orderCode}-${prefix}${copies + 1}`,
      status,
      created: new Date().toISOString(),
      datePaid: null,
      dateShipped: null,
      tracking: "",
      printHouse: "",
    };
    await add.mutateAsync(data);
    return data.orderCode as string;
  };

  const handleDuplicate = async (o: PodOrder) => {
    const code = await duplicateOrder(o);
    message.success(`Đã tạo đơn mới ${code} (0đ) từ đơn ${o.orderCode}`);
  };

  // Copy tất cả đơn đã chọn -> mỗi đơn 1 bản mới (0đ)
  const handleCopySelected = async () => {
    let count = 0;
    for (const id of selectedIds) {
      const o = allOrders.find((x) => x.id === id);
      if (!o) continue;
      await duplicateOrder(o);
      count++;
    }
    message.success(`Đã tạo ${count} đơn mới (0đ) từ ${count} đơn đã chọn`);
    setSelectedIds([]);
  };

  // Hỗ trợ ship lại = tạo 1 đơn Reship MỚI về 0đ từ đơn gốc
  const handleReship = async (o: PodOrder) => {
    const code = await duplicateOrder(o, { status: "reship", prefix: "RS" });
    message.success(`Đã tạo đơn ship lại ${code} (0đ) từ đơn ${o.orderCode}`);
  };

  const handleReshipSelected = async () => {
    let count = 0;
    for (const id of selectedIds) {
      const o = allOrders.find((x) => x.id === id);
      if (!o) continue;
      await duplicateOrder(o, { status: "reship", prefix: "RS" });
      count++;
    }
    message.success(`Đã tạo ${count} đơn ship lại (0đ) từ ${count} đơn đã chọn`);
    setSelectedIds([]);
  };

  // Khách bấm Hoàn tiền -> đơn chuyển sang tab Hoàn tiền để cuối tháng trừ lại.
  // Lưu prevStatus để admin có thể trả đơn về đúng trạng thái cũ.
  const handleRefund = async (o: PodOrder) => {
    await update.mutateAsync({
      id: o.id,
      status: "refund",
      prevStatus: o.status,
      // Giá hiển thị về 0đ nhưng lưu lại số tiền đã hoàn để thống kê refund
      refundedAmount: o.total || 0,
      refundedAt: new Date().toISOString(),
    } as any);
    message.success(
      `Đã chuyển đơn ${o.orderCode} sang Hoàn tiền (hoàn $${(o.total || 0).toFixed(2)})`
    );
  };

  // Hoàn tiền hàng loạt — chỉ áp dụng cho các đơn đã bấm Pay
  const handleRefundSelected = async () => {
    let count = 0;
    for (const id of refundableSelectedIds) {
      const o = allOrders.find((x) => x.id === id);
      if (!o) continue;
      await update.mutateAsync({
        id: o.id,
        status: "refund",
        prevStatus: o.status,
        refundedAmount: o.total || 0,
        refundedAt: new Date().toISOString(),
      } as any);
      count++;
    }
    message.success(`Đã chuyển ${count} đơn sang Hoàn tiền`);
    setSelectedIds([]);
  };

  // Giá hiển thị: khách chưa bấm Pay (chưa có datePaid) -> 0đ;
  // đơn đã hoàn tiền -> 0đ (số tiền đã hoàn lưu ở refundedAmount để thống kê);
  // còn lại đã thanh toán mới hiện số tiền thật của đơn.
  const displayTotal = (o: PodOrder) =>
    o.status === "refund" ? 0 : o.datePaid ? o.total || 0 : 0;

  const handleBulkDelete = async () => {
    // Chỉ xóa được đơn chưa thanh toán — đơn đã pay bị bỏ qua
    const deletable = deletableSelectedIds;
    const skipped = selectedIds.length - deletable.length;
    if (!deletable.length) {
      message.warning(
        "Chỉ xóa được đơn Chưa thanh toán hoặc Đã hủy"
      );
      return;
    }
    setDeleteProgress({ done: 0, total: deletable.length });
    try {
      await removeMany.mutateAsync({
        ids: deletable,
        onProgress: (done, total) => setDeleteProgress({ done, total }),
      });
      message.success(`Đã xóa ${deletable.length} đơn hàng`);
      if (skipped)
        message.info(
          `Bỏ qua ${skipped} đơn đang xử lý (chỉ xóa được đơn Chưa thanh toán/Đã hủy)`
        );
      setSelectedIds([]);
    } finally {
      setDeleteProgress(null);
    }
  };

  const handleExport = () => {
    downloadCSV(
      "orders.csv",
      toCSV(
        ["Order ID", "Date", "Status", "Tracking", "Customer", "Address", "City", "State", "Zip", "Country", "Items", "Total"],
        filtered.map((o) => [
          o.orderCode,
          o.created ? dayjs(o.created).format("MM/DD/YYYY") : "",
          POD_STATUS[o.status]?.label || o.status,
          o.tracking || "",
          o.customerName || "",
          o.address1 || "",
          o.city || "",
          o.state || "",
          o.zip || "",
          o.country || "",
          (o.items || [])
            .map((i) => `${i.quantity}x ${i.productSku} ${i.size}`)
            .join(" | "),
          (o.total || 0).toFixed(2),
        ])
      )
    );
  };

  // Xuất PDF: in phiếu packing slip từng đơn theo bộ lọc hiện tại (Save as PDF)
  const printRef = useRef<HTMLDivElement>(null);
  const handleExportPDF = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `orders-${dayjs().format("YYYYMMDD-HHmm")}`,
  });

  // Seller gửi yêu cầu hỗ trợ -> đơn chuyển trạng thái "support" để admin xử lý.
  // Lưu prevStatus để admin "Hủy yêu cầu hỗ trợ" trả đơn về đúng trạng thái cũ.
  const handleSupport = async (o: PodOrder) => {
    await update.mutateAsync({
      id: o.id,
      status: "support",
      prevStatus: o.status,
    } as any);
    message.success(`Đã gửi yêu cầu hỗ trợ cho đơn ${o.orderCode}`);
  };

  const handlePay = async (o: PodOrder) => {
    await update.mutateAsync({
      id: o.id,
      status: "pending_approval",
      datePaid: new Date().toISOString(),
    } as any);
    message.success(`Đã thanh toán đơn ${o.orderCode} — chuyển sang Chờ duyệt`);
  };

  // Thanh toán hàng loạt — chỉ áp dụng cho đơn CHƯA thanh toán
  const handlePaySelected = async () => {
    if (!payableSelectedIds.length) {
      message.warning("Chỉ thanh toán được đơn Chờ thanh toán");
      return;
    }
    let count = 0;
    for (const id of payableSelectedIds) {
      const o = allOrders.find((x) => x.id === id);
      if (!o) continue;
      await update.mutateAsync({
        id: o.id,
        status: "pending_approval",
        datePaid: new Date().toISOString(),
      } as any);
      count++;
    }
    message.success(`Đã thanh toán ${count} đơn — chuyển sang Chờ duyệt`);
    setSelectedIds([]);
  };

  /* ---------- Import CSV Etsy ---------- */
  const handleImportFile = async (file: File) => {
    if (!canImport) return message.warning(importBlockMsg);
    const rows = parseCSV(await file.text());
    const byOrder = new Map<string, any[]>();
    rows.forEach((r) => {
      const oid = r["Order ID"];
      if (!oid) return;
      if (!byOrder.has(oid)) byOrder.set(oid, []);
      byOrder.get(oid)!.push(r);
    });
    const store = stores.find((s) => s.id === selectedStoreId);
    // Ngày kiểu M/D/YY hoặc M/D/YYYY -> ISO (chấp nhận cả 1 chữ số).
    const toISO = (d: string) => {
      const m = (d || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (!m) return "";
      const y = m[3].length === 2 ? `20${m[3]}` : m[3];
      const pad = (x: string) => x.padStart(2, "0");
      return new Date(`${y}-${pad(m[1])}-${pad(m[2])}T00:00:00Z`).toISOString();
    };
    const preview = Array.from(byOrder.entries()).map(([oid, items]) => {
      // Lấy giá trị field đơn từ dòng ĐẦU TIÊN có dữ liệu (đơn nhiều dòng /
      // Etsy để trống ở một số dòng). Tránh vớ phải dòng trống.
      const pick = (key: string) =>
        (items.find((r: any) => (r[key] || "").trim())?.[key] || "").trim();
      // Ngày lên đơn: ưu tiên Sale Date, thiếu thì lấy Date Paid.
      // Ngày lên đơn: ưu tiên Sale Date -> Date Paid -> Date Shipped (một số đơn
      // trong file chỉ còn Date Shipped). Không có gì thì để TRỐNG ("—").
      const created =
        toISO(pick("Sale Date")) ||
        toISO(pick("Date Paid")) ||
        toISO(pick("Date Shipped")) ||
        "";
      return {
        id: `etsy-${oid}`,
        data: {
          orderCode: oid,
          storeId: selectedStoreId,
          storeName: store?.name || NO_STORE_NAME,
          status: "pending_payment",
          tracking: "",
          source: "etsy",
          // Tên khách: ưu tiên Buyer ĐẦY ĐỦ (kèm username như trong file),
          // thiếu thì lấy Ship Name. Không có thì để trống (UI hiện "--").
          customerName: pick("Buyer") || pick("Ship Name"),
          customerEmail: "",
          customerPhone: "",
          address1: pick("Ship Address1"),
          address2: pick("Ship Address2"),
          city: pick("Ship City"),
          state: pick("Ship State"),
          zip: pick("Ship Zipcode"),
          country: pick("Ship Country") || "United States",
          items: items.map((it: any) => {
            const v = parseVariations(it["Variations"]);
            const csvSku = (it["SKU"] || "").trim();
            // Type/Màu lấy TỪ VARIATIONS (Styles/Colors), không lấy từ cột SKU.
            // Không có trong Variations thì để trống.
            const typeVal = v.style;
            // Tự đồng bộ link thiết kế từ thư viện nếu SKU (thiết kế) khớp
            const design = designs.find(
              (d) => d.sku.toLowerCase() === csvSku.toLowerCase()
            );
            return {
              productName: it["Item Name"] || typeVal || "",
              productSku: typeVal,
              sku: csvSku,
              color: v.color,
              size: v.size,
              personalization: v.personalization,
              // Bản gốc khách up (ô vàng) — set sẵn để không bị suy ra từ SKU
              origTitle: it["Item Name"] || typeVal || "",
              origType: typeVal,
              origColor: v.color,
              origSize: v.size,
              quantity: parseInt(it["Quantity"]) || 1,
              price: parseFloat(it["Price"]) || 0,
              frontUrl: design?.frontUrl || "",
              backUrl: design?.backUrl || "",
              mockupUrl: design?.mockupUrl || "",
              extraAreas: design?.extraAreas || [],
              note: "",
            };
          }),
          note: "",
          // Tin nhắn khách để TRỐNG, nhân viên tự nhập tay (không lấy Personalization)
          csCustomerMsg: "",
          total: items.reduce(
            (s: number, it: any) => s + (parseFloat(it["Item Total"]) || 0),
            0
          ),
          created,
        },
      };
    });
    setImportPreview(preview);
    setImportSource("csv");
    setImportFileName(file.name);
    setPreviewPage(1);
    message.info(
      `Đọc được ${preview.length} đơn (${rows.length} items) — kiểm tra rồi bấm Xác nhận import`
    );
  };

  // Sửa item ngay trong preview import (chưa ghi DB, chỉ sửa state)
  const patchPreviewItem = (
    rowId: string,
    idx: number,
    patch: Partial<PodOrderItem>
  ) => {
    setImportPreview((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const items = r.data.items.map((it: any, i: number) =>
          i === idx ? { ...it, ...patch } : it
        );
        const total = items.reduce(
          (s: number, i: any) => s + podItemTotal(i),
          0
        );
        return { ...r, data: { ...r.data, items, total } };
      })
    );
  };

  // Chọn nhiều ở bảng preview Import CSV để bỏ đơn không muốn trước khi đồng bộ
  const previewPageRows = importPreview.slice(
    (previewPage - 1) * previewPageSize,
    previewPage * previewPageSize
  );
  const previewPageIds = previewPageRows.map((r) => r.id);
  const allPreviewPageSelected =
    previewPageIds.length > 0 &&
    previewPageIds.every((id) => previewSelectedIds.includes(id));
  const togglePreviewPage = (checked: boolean) =>
    setPreviewSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...previewPageIds]))
        : prev.filter((id) => !previewPageIds.includes(id))
    );
  const togglePreviewOne = (id: string, checked: boolean) =>
    setPreviewSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  const removeSelectedPreview = () => {
    const count = previewSelectedIds.length;
    setImportPreview((prev) =>
      prev.filter((r) => !previewSelectedIds.includes(r.id))
    );
    setPreviewSelectedIds([]);
    message.success(`Đã bỏ ${count} đơn khỏi danh sách import`);
  };

  const confirmImport = async () => {
    if (!canImport) return message.warning(importBlockMsg);
    if (!(await ensureAccount())) return;

    // Đơn từ PDF: KHÔNG ghi thẳng lên hệ thống. Gửi cả lô vào hàng đợi,
    // admin duyệt xong mới đồng bộ sang podOrders.
    if (importSource === "pdf") {
      const store = stores.find((s) => s.id === selectedStoreId);
      try {
        await submitImport.mutateAsync({
          fileName: importFileName,
          source: "pdf",
          storeId: selectedStoreId,
          storeName: store?.name || NO_STORE_NAME,
          list: importPreview,
        });
        message.success(
          `Đã gửi ${importPreview.length} đơn vào hàng đợi — chờ admin duyệt trước khi lên hệ thống`
        );
        setImportPreview([]);
        setImportSource(null);
        setImportFileName("");
      } catch (e) {
        message.error("Không gửi được lô đơn vào hàng đợi. Vui lòng thử lại.");
      }
      return;
    }

    // CSV: giữ luồng đồng bộ trực tiếp như cũ.
    setSyncProgress({ done: 0, total: importPreview.length });
    try {
      const res = await addMany.mutateAsync({
        list: importPreview,
        onProgress: (done, total) => setSyncProgress({ done, total }),
      });
      const okCount = importPreview.length - (res?.failed || 0);
      if (res?.failed) {
        message.warning(
          `Đã đồng bộ ${okCount}/${importPreview.length} đơn — ${res.failed} đơn lỗi dữ liệu bị bỏ qua`
        );
      } else {
        message.success(`Đã đồng bộ ${importPreview.length} đơn hàng lên web`);
      }
      setImportPreview([]);
      setImportSource(null);
      setImportFileName("");
      setView("list");
    } finally {
      setSyncProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 3 tab chính */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 inline-flex gap-1">
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm cursor-pointer border-0 ${
            view === "list"
              ? "bg-[#171826] text-white font-bold"
              : "bg-transparent text-gray-500"
          }`}
        >
          <FiList /> Quản lý đơn
        </button>
        <button
          onClick={() => {
            if (!canImport) return message.warning(importBlockMsg);
            setView("import");
          }}
          disabled={!canImport}
          title={!canImport ? importBlockMsg : undefined}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border-0 ${
            !canImport
              ? "cursor-not-allowed bg-transparent text-gray-300"
              : view === "import"
              ? "cursor-pointer bg-[#171826] text-white font-bold"
              : "cursor-pointer bg-transparent text-gray-500"
          }`}
        >
          <FiFileText /> Import đơn
        </button>
        <button
          onClick={() => {
            if (!canCreate) return message.warning(createBlockMsg);
            setPresetSku(undefined);
            setCreateOpen(true);
          }}
          disabled={!canCreate}
          title={!canCreate ? createBlockMsg : undefined}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border-0 font-medium ${
            canCreate
              ? "cursor-pointer bg-transparent text-[#2563EB]"
              : "cursor-not-allowed bg-transparent text-gray-300"
          }`}
        >
          <FiPlus /> Tạo đơn lẻ
        </button>
      </div>

      {view === "list" && (
        <>
          {/* Tabs trạng thái */}
          <div className="flex gap-2 flex-wrap">
            {POD_STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={`px-4 py-2 rounded-full text-sm cursor-pointer border ${
                  statusTab === t.key
                    ? "bg-[#171826] text-white font-bold border-[#171826]"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Bộ lọc */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
            <Tooltip
              title={
                <div className="text-xs">
                  Tìm trong: mã đơn, tên/email/SĐT khách, tracking, shop, SKU
                  &amp; tên phôi, màu, size, personalization, địa chỉ, ngày
                  (DD/MM/YYYY), trạng thái, ghi chú.
                  <br />
                  Gõ nhiều từ cách nhau bởi dấu cách để lọc chồng nhau — ví dụ{" "}
                  <b>gildan black</b>.
                </div>
              }
            >
              <Input
                prefix={<FiSearch className="text-gray-400" />}
                placeholder="Mã đơn, khách, tracking, SKU, màu, địa chỉ..."
                className="w-[320px] h-[42px] rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </Tooltip>
            <DatePicker.RangePicker
              className="h-[42px] rounded-lg"
              format="DD/MM/YYYY"
              allowEmpty={[true, true]}
              placeholder={["Từ ngày", "Đến ngày"]}
              value={[
                fromDate ? dayjs(fromDate) : null,
                toDate ? dayjs(toDate) : null,
              ]}
              onChange={(range) => {
                setFromDate(range?.[0] ? range[0].format("YYYY-MM-DD") : "");
                setToDate(range?.[1] ? range[1].format("YYYY-MM-DD") : "");
              }}
            />
            <Select
              className="h-[42px] w-[210px]"
              value={shopFilter}
              onChange={(v) => setShopFilter(v)}
              options={[
                { value: "current", label: "Shop đang chọn" },
                { value: "all", label: "Tất cả shop" },
                {
                  value: "none",
                  label: `Chưa có shop${
                    noShopCount ? ` (${noShopCount})` : ""
                  }`,
                },
              ]}
            />
            <Select
              className="h-[42px] w-[180px]"
              value={trackFilter}
              onChange={(v) => setTrackFilter(v)}
              options={[
                { value: "all", label: "Tất cả tracking" },
                { value: "has", label: "Đã có tracking" },
                { value: "none", label: "Chưa có tracking" },
              ]}
            />
            <Button
              icon={<FiDownload />}
              className="bg-emerald-500 text-white border-0 font-bold"
              onClick={handleExport}
            >
              Xuất file CSV
            </Button>
            <Button
              icon={<FiFileText />}
              onClick={() => {
                if (!filtered.length)
                  return message.warning("Không có đơn nào để xuất");
                handleExportPDF?.();
              }}
            >
              Xuất file PDF
            </Button>
            <div className="ml-auto text-sm text-gray-500">
              Tổng kết quả:{" "}
              <span className="bg-[#171826] text-white rounded px-2 py-0.5 font-bold">
                {filtered.length}
              </span>
            </div>
          </div>

          {/* Vùng in ẩn cho Xuất PDF (react-to-print clone nội dung này) */}
          <div style={{ display: "none" }}>
            <OrdersPackingSlips ref={printRef} orders={filtered} />
          </div>

          {/* Thanh chọn nhiều */}
          {selectedIds.length > 0 && (
            <div className="bg-[#FBF6EC] border border-[#EADFC8] rounded-2xl px-4 py-3 flex items-center gap-4 flex-wrap">
              <span className="text-sm text-gray-600">
                Đã chọn{" "}
                <b className="text-[#171826]">{selectedIds.length}</b> đơn hàng
              </span>
              {/* Gán shop cho các đơn đang chưa có shop */}
              {noShopSelectedIds.length > 0 && selectedStore && (
                <Popconfirm
                  title={`Gán ${noShopSelectedIds.length} đơn vào shop "${selectedStore.name}"?`}
                  description="Chỉ áp dụng cho các đơn đang chưa có shop."
                  okText="Gán shop"
                  cancelText="Hủy"
                  onConfirm={handleAssignShop}
                >
                  <Button
                    icon={<FiShoppingBag />}
                    loading={update.isLoading}
                    className="border-[#EADFC8] text-[#B79351] font-medium"
                  >
                    Gán vào {selectedStore.name} ({noShopSelectedIds.length})
                  </Button>
                </Popconfirm>
              )}
              {/* Chỉ hiện nút thanh toán khi trong số đã chọn có đơn CHƯA thanh toán */}
              {payableSelectedIds.length > 0 && (
                <Popconfirm
                  title={`Thanh toán ${payableSelectedIds.length} đơn đã chọn?`}
                  description="Chỉ đơn Chờ thanh toán mới được thanh toán. Các đơn sẽ chuyển sang Chờ duyệt."
                  okText="Thanh toán"
                  cancelText="Hủy"
                  onConfirm={handlePaySelected}
                >
                  <Button
                    icon={<FiCreditCard />}
                    loading={update.isLoading}
                    className="border-[#BBF7D0] text-[#15803D] font-medium"
                  >
                    Thanh toán ({payableSelectedIds.length})
                  </Button>
                </Popconfirm>
              )}
              <Popconfirm
                title={`Copy ${selectedIds.length} đơn đã chọn?`}
                description="Mỗi đơn sẽ được tạo 1 đơn MỚI (Chờ thanh toán) với cùng sản phẩm, thiết kế, khách hàng."
                okText="Tạo đơn mới"
                cancelText="Hủy"
                onConfirm={handleCopySelected}
              >
                <Button
                  icon={<FiCopy />}
                  loading={add.isLoading}
                  className="border-[#EADFC8] text-[#B79351] font-medium"
                >
                  Copy đơn ({selectedIds.length})
                </Button>
              </Popconfirm>
              <Popconfirm
                title={`Hỗ trợ ship lại ${selectedIds.length} đơn đã chọn?`}
                description="Mỗi đơn sẽ được tạo 1 đơn Reship MỚI về 0đ với cùng sản phẩm, thiết kế, khách hàng."
                okText="Tạo đơn ship lại"
                cancelText="Hủy"
                onConfirm={handleReshipSelected}
              >
                <Button
                  icon={<FiTruck />}
                  loading={add.isLoading}
                  className="border-[#C7D2FE] text-[#4338CA] font-medium"
                >
                  Hỗ trợ ship lại ({selectedIds.length})
                </Button>
              </Popconfirm>
              {/* Chỉ hiện nút hoàn tiền khi trong số đã chọn có đơn ĐÃ thanh toán */}
              {refundableSelectedIds.length > 0 && (
                <Popconfirm
                  title={`Hoàn tiền ${refundableSelectedIds.length} đơn đã chọn?`}
                  description="Đơn chưa thanh toán sẽ được bỏ qua. Các đơn sẽ chuyển sang tab Hoàn tiền để cuối tháng trừ lại."
                  okText="Hoàn tiền"
                  cancelText="Hủy"
                  onConfirm={handleRefundSelected}
                >
                  <Button
                    icon={<FiRotateCcw />}
                    loading={update.isLoading}
                    className="border-[#FBCFE8] text-[#BE123C] font-medium"
                  >
                    Hoàn tiền ({refundableSelectedIds.length})
                  </Button>
                </Popconfirm>
              )}
              {/* Chỉ hiện nút xóa khi trong số đã chọn có đơn CHƯA thanh toán */}
              {deletableSelectedIds.length > 0 && (
                <Popconfirm
                  title={`Xóa ${deletableSelectedIds.length} đơn chưa thanh toán đã chọn?`}
                  description="Đơn đã thanh toán sẽ được bỏ qua. Hành động này không thể hoàn tác."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleBulkDelete}
                  disabled={!!deleteProgress}
                >
                  <Button danger loading={removeMany.isLoading}>
                    {deleteProgress
                      ? `Đang xóa ${deleteProgress.done}/${deleteProgress.total}...`
                      : `Xóa đã chọn (${deletableSelectedIds.length})`}
                  </Button>
                </Popconfirm>
              )}
              {deleteProgress ? (
                <div className="flex items-center gap-2 min-w-[160px]">
                  <div className="flex-1 h-1.5 bg-[#F3D9D9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DC2626] transition-all duration-200"
                      style={{
                        width: `${Math.round(
                          (deleteProgress.done / deleteProgress.total) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#DC2626] font-semibold shrink-0">
                    {deleteProgress.done}/{deleteProgress.total}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-gray-400 text-sm bg-transparent border-0 cursor-pointer ml-auto"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
          )}

          {/* Bảng đơn */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1050px]">
              <thead>
                <tr className="text-left text-[11px] tracking-widest text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={
                        !allPageSelected &&
                        pageIds.some((id) => selectedIds.includes(id))
                      }
                      onChange={(e) => togglePage(e.target.checked)}
                    />
                  </th>
                  <th className="p-3">MÃ ĐƠN</th>
                  <th className="p-3">CHI TIẾT SẢN PHẨM & THIẾT KẾ</th>
                  <th className="p-3">
                    <span className="inline-flex items-center gap-1">
                      VÙNG IN
                      <Tooltip title={PRINT_AREA_GUIDE} placement="bottom">
                        <span className="text-[#DC2626] font-bold cursor-help text-[13px] leading-none">
                          ✳
                        </span>
                      </Tooltip>
                    </span>
                  </th>
                  <th className="p-3">TRẠNG THÁI</th>
                  <th className="p-3">NGÀY LÊN ĐƠN</th>
                  <th className="p-3">TRACKING</th>
                  <th className="p-3">GIÁ</th>
                  <th className="p-3">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => (
                  <tr
                    key={o.id}
                    className={`border-b border-gray-50 align-top transition-colors ${
                      selectedIds.includes(o.id)
                        ? "bg-[#FBF6EC]"
                        : "hover:bg-gray-50/40"
                    }`}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.includes(o.id)}
                        onChange={(e) => toggleOne(o.id, e.target.checked)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#171826]">
                          {o.orderCode}
                        </span>
                        <Popconfirm
                          title={`Copy đơn ${o.orderCode}?`}
                          description="Tạo 1 đơn MỚI (Chờ thanh toán) với cùng sản phẩm, thiết kế, khách hàng."
                          okText="Tạo đơn mới"
                          cancelText="Hủy"
                          onConfirm={() => handleDuplicate(o)}
                        >
                          <Tooltip title="Copy đơn — tạo đơn mới từ data đơn này">
                            <button className="w-6 h-6 rounded-md border border-gray-200 bg-white text-gray-400 inline-flex items-center justify-center cursor-pointer hover:text-[#B79351] hover:border-[#EADFC8] shrink-0">
                              <FiCopy size={12} />
                            </button>
                          </Tooltip>
                        </Popconfirm>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 rounded px-1.5 py-0.5 text-gray-500 mt-1">
                        🏪 {o.storeName || "—"}
                      </span>
                      <div className="text-xs text-gray-500 font-semibold mt-1">
                        Khách: {o.customerName || "—"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div
                        className={
                          o.status !== "pending_payment"
                            ? "space-y-2 pointer-events-none opacity-75 select-none"
                            : "space-y-2"
                        }
                        title={
                          o.status !== "pending_payment"
                            ? "Đơn đã thanh toán — không thể chỉnh sửa"
                            : undefined
                        }
                      >
                        {(o.items || []).map((_, idx) => (
                          <OrderItemEditor
                            key={idx}
                            order={o}
                            index={idx}
                            onPatchItem={(patch) =>
                              patchOrderItem(o, idx, patch)
                            }
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {/* Vùng in cho từng sản phẩm — đặc biệt +$2/sp */}
                      <div
                        className={
                          o.status !== "pending_payment"
                            ? "space-y-2 pointer-events-none opacity-75"
                            : "space-y-2"
                        }
                      >
                        {(o.items || []).map((it, idx) => (
                          <div key={idx}>
                            {(o.items?.length || 0) > 1 && (
                              <div className="text-[9px] font-bold text-gray-400 mb-0.5">
                                SP{idx + 1}
                              </div>
                            )}
                            <Select
                              size="small"
                              className="w-[150px]"
                              value={it.printArea || ""}
                              onChange={(v) =>
                                patchOrderItem(o, idx, { printArea: v })
                              }
                              options={[
                                { value: "", label: "Mặc định" },
                                {
                                  value: "special",
                                  label: SPECIAL_PRINT_AREA_LABEL,
                                },
                                { value: "full", label: FULL_PRINT_LABEL },
                              ]}
                            />
                            {(it.printArea === "special" ||
                              it.printArea === "full") && (
                              <div className="text-orange-600 text-[11px] font-bold mt-0.5">
                                +${(specialFee(it) * (it.quantity || 1)).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))}
                        {!o.items?.length && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {o.created ? dayjs(o.created).format("DD/MM/YYYY") : "—"}
                    </td>
                    <td className="p-3">
                      {o.tracking ? (
                        <span className="text-[#2563EB]">{o.tracking}</span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa có</span>
                      )}
                    </td>
                    <td className="p-3 font-extrabold text-[#171826] whitespace-nowrap">
                      ${displayTotal(o).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5">
                          {o.status === "pending_payment" ? (
                            <Tooltip title="Sửa chi tiết đơn (khách hàng, địa chỉ giao hàng, ghi chú...)">
                              <button
                                onClick={() => setEditing(o)}
                                className="w-8 h-8 rounded-lg border border-[#EADFC8] bg-[#FBF6EC] text-[#B79351] flex items-center justify-center cursor-pointer hover:bg-[#C6A15B] hover:text-white transition-colors"
                              >
                                <FiEdit3 size={14} />
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Đơn đã thanh toán — không thể chỉnh sửa/xóa">
                              <button className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-300 flex items-center justify-center cursor-not-allowed">
                                <FiEdit3 size={14} />
                              </button>
                            </Tooltip>
                          )}
                          {o.status === "pending_payment" && (
                            <Popconfirm
                              title={`Thanh toán đơn ${o.orderCode}?`}
                              description={`Số tiền: $${(o.total || 0).toFixed(2)} — đơn sẽ chuyển sang Chờ duyệt.`}
                              okText="Pay"
                              cancelText="Hủy"
                              onConfirm={() => handlePay(o)}
                            >
                              <Tooltip title="Thanh toán đơn hàng">
                                <button className="w-8 h-8 rounded-lg border-0 bg-[#171826] text-white flex items-center justify-center cursor-pointer hover:bg-black transition-colors">
                                  <FiCreditCard size={14} />
                                </button>
                              </Tooltip>
                            </Popconfirm>
                          )}
                          {["pending_payment", "cancelled"].includes(
                            o.status
                          ) && (
                            <Popconfirm
                              title={`Xóa đơn ${o.orderCode}?`}
                              description="Hành động này không thể hoàn tác."
                              okText="Xóa"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => remove.mutate(o.id)}
                            >
                              <Tooltip title="Xóa đơn hàng">
                                <button className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white transition-colors">
                                  <FiTrash2 size={14} />
                                </button>
                              </Tooltip>
                            </Popconfirm>
                          )}
                          {!["pending_payment", "cancelled", "support"].includes(
                            o.status
                          ) && (
                            <Popconfirm
                              title={`Yêu cầu hỗ trợ cho đơn ${o.orderCode}?`}
                              description="Đơn sẽ chuyển sang trạng thái Yêu cầu Hỗ trợ để admin xử lý."
                              okText="Gửi yêu cầu"
                              cancelText="Hủy"
                              onConfirm={() => handleSupport(o)}
                            >
                              <Tooltip title="Yêu cầu hỗ trợ cho đơn này">
                                <button className="w-8 h-8 rounded-lg border border-orange-200 bg-orange-50 text-orange-500 flex items-center justify-center cursor-pointer hover:bg-orange-500 hover:text-white transition-colors">
                                  <FiHelpCircle size={14} />
                                </button>
                              </Tooltip>
                            </Popconfirm>
                          )}
                          {!["pending_payment", "cancelled", "reship", "refund"].includes(
                            o.status
                          ) && (
                            <Popconfirm
                              title={`Hỗ trợ ship lại đơn ${o.orderCode}?`}
                              description="Tạo 1 đơn Reship MỚI về 0đ với cùng sản phẩm, thiết kế, khách hàng."
                              okText="Tạo đơn ship lại"
                              cancelText="Hủy"
                              onConfirm={() => handleReship(o)}
                            >
                              <Tooltip title="Hỗ trợ ship lại — tạo đơn reship 0đ">
                                <button className="w-8 h-8 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-500 flex items-center justify-center cursor-pointer hover:bg-indigo-500 hover:text-white transition-colors">
                                  <FiTruck size={14} />
                                </button>
                              </Tooltip>
                            </Popconfirm>
                          )}
                          {!["pending_payment", "cancelled", "refund"].includes(
                            o.status
                          ) && (
                            <Popconfirm
                              title={`Chuyển đơn ${o.orderCode} sang Hoàn tiền?`}
                              description="Đơn sẽ chuyển sang tab Hoàn tiền để cuối tháng trừ lại."
                              okText="Hoàn tiền"
                              cancelText="Hủy"
                              onConfirm={() => handleRefund(o)}
                            >
                              <Tooltip title="Hoàn tiền / hoàn trả đơn này">
                                <button className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 flex items-center justify-center cursor-pointer hover:bg-rose-500 hover:text-white transition-colors">
                                  <FiRotateCcw size={14} />
                                </button>
                              </Tooltip>
                            </Popconfirm>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={9} className="p-16 text-center text-gray-400">
                      {isLoading ? "Đang tải..." : "Không có đơn hàng nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div className="flex items-center justify-end p-4 border-t border-gray-100">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={filtered.length}
                  showSizeChanger
                  pageSizeOptions={[10, 20, 50, 100, 200, 1000]}
                  showTotal={(t) => `${t} đơn`}
                  onChange={(p, ps) => {
                    setPage(ps !== pageSize ? 1 : p);
                    setPageSize(ps);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {view === "import" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fileRef.current?.click()}
              className="h-[46px] px-5 rounded-xl border-2 border-dashed border-gray-300 bg-white text-[#171826] font-bold text-sm cursor-pointer hover:border-[#C6A15B] hover:text-[#C6A15B] transition-colors"
            >
              Chọn file CSV hoặc PDF
            </button>
            <Button
              disabled={!canImport}
              onClick={() => {
                if (!canImport) return message.warning(importBlockMsg);
                setSheetOpen(true);
              }}
              className="h-[46px] px-5 rounded-xl font-bold border-2 border-[#0E9F6E] text-[#0E9F6E]"
            >
              Import từ link Google Sheets
            </Button>
            <Button
              type="primary"
              disabled={!importPreview.length}
              loading={addMany.isLoading || submitImport.isLoading}
              onClick={confirmImport}
              className={`h-[46px] px-6 rounded-xl font-bold border-0 ${
                importPreview.length ? "bg-[#C6A15B]" : ""
              }`}
            >
              {syncProgress
                ? `Đang đồng bộ ${syncProgress.done}/${syncProgress.total}...`
                : importSource === "pdf"
                ? "Gửi admin duyệt"
                : "Đồng bộ lên Web"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.pdf,application/pdf,text/csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
                    handleImportPdf(f);
                  } else {
                    handleImportFile(f);
                  }
                }
                e.target.value = "";
              }}
            />
            <span className="text-gray-400 text-sm">
              Hỗ trợ CSV export Etsy hoặc packing slip PDF Etsy (Order #, Ship to,
              SKU, Quantity, Styles - Colors, Size, Personalization).
            </span>
          </div>

          {/* Chưa có shop vẫn import được — đơn ghi tạm "Chưa có shop" */}
          {!selectedStore && (
            <div className="bg-[#FEF9E7] border border-[#F5E1A4] rounded-2xl px-5 py-3 text-sm text-[#8A6D1F]">
              Bạn chưa chọn / chưa có cửa hàng — vẫn import bình thường, đơn sẽ
              ghi tạm shop là <b>“{NO_STORE_NAME}”</b>, gán shop sau khi bạn tạo
              hoặc kết nối cửa hàng.
            </div>
          )}

          {syncProgress ? (
            <div className="bg-[#FBF6EC] border border-[#EADFC8] rounded-2xl px-5 py-4">
              <div className="flex items-center justify-between font-bold text-[#B79351] mb-2">
                <span>
                  ⏳ Đang đồng bộ lên web... {syncProgress.done}/
                  {syncProgress.total} đơn
                </span>
                <span>
                  {Math.round((syncProgress.done / syncProgress.total) * 100)}%
                </span>
              </div>
              <Progress
                percent={Math.round(
                  (syncProgress.done / syncProgress.total) * 100
                )}
                showInfo={false}
                strokeColor="#C6A15B"
                status="active"
              />
              <div className="text-xs text-gray-400 mt-1">
                Vui lòng không đóng trang trong lúc đồng bộ
              </div>
            </div>
          ) : (
            importPreview.length > 0 && (
              <div className="bg-[#EFF4FF] border border-[#D6E4FF] text-[#2563EB] rounded-2xl px-5 py-4 font-bold">
                Đã chuẩn bị {importPreview.length} đơn hàng. Kiểm tra bên dưới rồi
                bấm{" "}
                {importSource === "pdf"
                  ? '"Gửi admin duyệt". Đơn từ PDF sẽ vào hàng đợi và chỉ lên hệ thống sau khi admin duyệt.'
                  : '"Đồng bộ lên Web".'}
              </div>
            )
          )}

          {/* Lô PDF đã gửi — theo dõi trạng thái duyệt của admin */}
          {importBatches.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
              <div className="font-bold text-[#171826] text-sm mb-1">
                Lô đơn PDF đã gửi
              </div>
              {importBatches.slice(0, 8).map((b) => {
                const st =
                  b.status === "approved"
                    ? { label: "ĐÃ DUYỆT", color: "#15803D", bg: "#E8F7EC" }
                    : b.status === "rejected"
                    ? { label: "BỊ TỪ CHỐI", color: "#B91C1C", bg: "#FDECEC" }
                    : { label: "CHỜ DUYỆT", color: "#6B46C1", bg: "#F3EBFF" };
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 flex-wrap text-sm border-b border-gray-50 last:border-0 py-1.5"
                  >
                    <span
                      className="text-[10px] font-bold tracking-wider px-2 py-1 rounded whitespace-nowrap"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                    <span className="font-semibold text-[#171826]">
                      {b.fileName || "PDF"}
                    </span>
                    <span className="text-gray-400">{b.count} đơn</span>
                    {b.status === "rejected" && b.rejectedReason && (
                      <span className="text-red-500">— {b.rejectedReason}</span>
                    )}
                    <span className="text-gray-300 ml-auto">
                      {b.created ? dayjs(b.created).format("DD/MM HH:mm") : ""}
                    </span>
                    {b.status === "pending" && (
                      <Popconfirm
                        title="Rút lô đơn này khỏi hàng đợi?"
                        okText="Rút"
                        cancelText="Hủy"
                        onConfirm={() => removeImportBatch.mutate(b.id)}
                      >
                        <button className="text-xs text-gray-400 hover:text-red-500 border-0 bg-transparent cursor-pointer">
                          Rút lại
                        </button>
                      </Popconfirm>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 overflow-x-auto">
          {previewSelectedIds.length > 0 && (
            <div className="bg-[#FBF6EC] border border-[#EADFC8] rounded-2xl px-4 py-3 flex items-center gap-4 flex-wrap">
              <span className="text-sm text-gray-600">
                Đã chọn{" "}
                <b className="text-[#171826]">{previewSelectedIds.length}</b> đơn
              </span>
              <Popconfirm
                title={`Bỏ ${previewSelectedIds.length} đơn khỏi danh sách import?`}
                description="Các đơn này sẽ không được đồng bộ lên web."
                okText="Bỏ khỏi danh sách"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={removeSelectedPreview}
              >
                <Button danger>
                  Xóa khỏi danh sách import ({previewSelectedIds.length})
                </Button>
              </Popconfirm>
              <button
                onClick={() => setPreviewSelectedIds([])}
                className="text-gray-400 text-sm bg-transparent border-0 cursor-pointer ml-auto"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          )}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] tracking-widest text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={allPreviewPageSelected}
                    indeterminate={
                      !allPreviewPageSelected &&
                      previewPageIds.some((id) =>
                        previewSelectedIds.includes(id)
                      )
                    }
                    onChange={(e) => togglePreviewPage(e.target.checked)}
                  />
                </th>
                <th className="p-3">MÃ ĐƠN</th>
                <th className="p-3">NGÀY LÊN ĐƠN</th>
                <th className="p-3">KHÁCH HÀNG</th>
                <th className="p-3">CHI TIẾT SẢN PHẨM</th>
                <th className="p-3">GIÁ</th>
              </tr>
            </thead>
            <tbody>
              {previewPageRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="p-3 align-top">
                    <Checkbox
                      checked={previewSelectedIds.includes(row.id)}
                      onChange={(e) =>
                        togglePreviewOne(row.id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="p-3 font-bold">{row.data.orderCode}</td>
                  <td className="p-3">
                    {row.data.created
                      ? dayjs(row.data.created).format("DD/MM/YYYY")
                      : "—"}
                  </td>
                  <td className="p-3 font-bold text-[#171826]">
                    {row.data.customerName || (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="space-y-2">
                      {row.data.items.map((_: any, idx: number) => (
                        <OrderItemEditor
                          key={idx}
                          order={row.data}
                          index={idx}
                          onPatchItem={(patch) =>
                            patchPreviewItem(row.id, idx, patch)
                          }
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-bold">
                    ${row.data.total.toFixed(2)}
                  </td>
                </tr>
              ))}
              {!importPreview.length && (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-400">
                    Chọn file CSV hoặc PDF để xem trước dữ liệu import
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {importPreview.length > 0 && (
            <div className="flex items-center justify-end pt-4 border-t border-gray-100">
              <Pagination
                current={previewPage}
                pageSize={previewPageSize}
                total={importPreview.length}
                showSizeChanger
                pageSizeOptions={[10, 20, 50, 100]}
                showTotal={(t) => `${t} đơn chờ đồng bộ`}
                onChange={(p, ps) => {
                  setPreviewPage(ps !== previewPageSize ? 1 : p);
                  setPreviewPageSize(ps);
                }}
              />
            </div>
          )}
          </div>
        </div>
      )}

      {/* Modal tạo đơn */}
      <OrderModal
        open={createOpen}
        presetSku={presetSku}
        onClose={() => setCreateOpen(false)}
      />
      {/* Modal sửa đơn */}
      <OrderModal
        open={!!editing}
        initial={editing}
        onClose={() => setEditing(null)}
      />
      {/* Import đơn từ link Google Sheets */}
      <SheetImportModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        storeId={selectedStoreId}
        storeName={importStoreName}
        designs={designs}
        variants={variants}
        submitting={submitImport.isLoading}
        onSubmit={submitSheetOrders}
      />
    </div>
  );
}
