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
  FiTrash2,
  FiTruck,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import {
  useDesigns,
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
import { useAccountGuard } from "../../../hooks/useAccountGuard";
import {
  PodOrderItem,
  SPECIAL_PRINT_AREA_FEE,
  SPECIAL_PRINT_AREA_LABEL,
  podItemTotal,
} from "../../../models/pod";

type ViewTab = "list" | "import" | "create";

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
  const [view, setView] = useState<ViewTab>("list");
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editing, setEditing] = useState<PodOrder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [presetSku, setPresetSku] = useState<string | undefined>();
  const [importPreview, setImportPreview] = useState<any[]>([]);
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

  const handleImportPdf = async (file: File) => {
    if (!canCreate) return message.warning(createBlockMsg);
    const store = stores.find((s) => s.id === selectedStoreId);
    try {
      const preview = await parseEtsyPackingSlipPdf(file, {
        storeId: selectedStoreId,
        store,
        designs,
        variants,
      });
      if (!preview.length) {
        message.error("Không tìm thấy đơn Etsy hợp lệ trong file PDF này");
        return;
      }
      setImportPreview(preview);
      setPreviewPage(1);
      message.info(`Đọc được ${preview.length} đơn từ ${file.name} — kiểm tra rồi bấm Đồng bộ lên Web`);
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

  const filtered = useMemo(() => {
    // Có từ khóa -> tìm trên đơn của tất cả cửa hàng; không thì chỉ store đang chọn
    const source = search.trim() ? allOrders : orders;
    return source.filter((o) => {
      if (statusTab !== "all" && o.status !== statusTab) return false;
      if (
        search &&
        !o.orderCode?.toLowerCase().includes(search.toLowerCase()) &&
        !o.customerName?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (fromDate && dayjs(o.created).isBefore(dayjs(fromDate), "day"))
        return false;
      if (toDate && dayjs(o.created).isAfter(dayjs(toDate), "day"))
        return false;
      return true;
    });
  }, [orders, allOrders, statusTab, search, fromDate, toDate]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );
  useEffect(() => {
    setPage(1);
  }, [statusTab, search, fromDate, toDate]);

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
          dayjs(o.created).format("MM/DD/YYYY"),
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

  /* ---------- Import CSV Etsy ---------- */
  const handleImportFile = async (file: File) => {
    if (!canCreate) return message.warning(createBlockMsg);
    const rows = parseCSV(await file.text());
    const byOrder = new Map<string, any[]>();
    rows.forEach((r) => {
      const oid = r["Order ID"];
      if (!oid) return;
      if (!byOrder.has(oid)) byOrder.set(oid, []);
      byOrder.get(oid)!.push(r);
    });
    const store = stores.find((s) => s.id === selectedStoreId);
    const toISO = (d: string) => {
      const m = (d || "").match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
      if (!m) return new Date().toISOString();
      const y = m[3].length === 2 ? `20${m[3]}` : m[3];
      return new Date(`${y}-${m[1]}-${m[2]}T00:00:00Z`).toISOString();
    };
    const preview = Array.from(byOrder.entries()).map(([oid, items]) => {
      const f = items[0];
      return {
        id: `etsy-${oid}`,
        data: {
          orderCode: oid,
          storeId: selectedStoreId,
          storeName: store?.name || "",
          status: "pending_payment",
          tracking: "",
          source: "etsy",
          customerName: f["Ship Name"] || f["Buyer"],
          customerEmail: "",
          customerPhone: "",
          address1: f["Ship Address1"],
          address2: f["Ship Address2"],
          city: f["Ship City"],
          state: f["Ship State"],
          zip: f["Ship Zipcode"],
          country: f["Ship Country"] || "United States",
          items: items.map((it: any) => {
            const v = parseVariations(it["Variations"]);
            const csvSku = (it["SKU"] || "").trim();
            // Tự đồng bộ link thiết kế từ thư viện nếu SKU đã có sẵn
            const design = designs.find(
              (d) => d.sku.toLowerCase() === csvSku.toLowerCase()
            );
            return {
              productName: it["Item Name"],
              productSku: csvSku,
              sku: csvSku,
              color: v.color,
              size: v.size,
              personalization: v.personalization,
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
          total: items.reduce(
            (s: number, it: any) => s + (parseFloat(it["Item Total"]) || 0),
            0
          ),
          created: toISO(f["Sale Date"]),
        },
      };
    });
    setImportPreview(preview);
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
    if (!canCreate) return message.warning(createBlockMsg);
    if (!(await ensureAccount())) return;
    setSyncProgress({ done: 0, total: importPreview.length });
    try {
      await addMany.mutateAsync({
        list: importPreview,
        onProgress: (done, total) => setSyncProgress({ done, total }),
      });
      message.success(`Đã đồng bộ ${importPreview.length} đơn hàng lên web`);
      setImportPreview([]);
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
            if (!canCreate) return message.warning(createBlockMsg);
            setView("import");
          }}
          disabled={!canCreate}
          title={!canCreate ? createBlockMsg : undefined}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border-0 ${
            !canCreate
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
            <Input
              prefix={<FiSearch className="text-gray-400" />}
              placeholder="Tìm đơn..."
              className="w-[260px] h-[42px] rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
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
            <Button
              icon={<FiDownload />}
              className="bg-emerald-500 text-white border-0 font-bold"
              onClick={handleExport}
            >
              Xuất file CSV
            </Button>
            <div className="ml-auto text-sm text-gray-500">
              Tổng kết quả:{" "}
              <span className="bg-[#171826] text-white rounded px-2 py-0.5 font-bold">
                {filtered.length}
              </span>
            </div>
          </div>

          {/* Thanh chọn nhiều */}
          {selectedIds.length > 0 && (
            <div className="bg-[#FBF6EC] border border-[#EADFC8] rounded-2xl px-4 py-3 flex items-center gap-4 flex-wrap">
              <span className="text-sm text-gray-600">
                Đã chọn{" "}
                <b className="text-[#171826]">{selectedIds.length}</b> đơn hàng
              </span>
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
                  <th className="p-3">VÙNG IN</th>
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
                              value={it.printArea === "special" ? "special" : ""}
                              onChange={(v) =>
                                patchOrderItem(o, idx, { printArea: v })
                              }
                              options={[
                                { value: "", label: "Mặc định" },
                                {
                                  value: "special",
                                  label: `${SPECIAL_PRINT_AREA_LABEL} (+$${specialFee(
                                    it
                                  )})`,
                                },
                              ]}
                            />
                            {it.printArea === "special" && (
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
                      {dayjs(o.created).format("DD/MM/YYYY")}
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
              type="primary"
              disabled={!importPreview.length}
              loading={addMany.isLoading}
              onClick={confirmImport}
              className={`h-[46px] px-6 rounded-xl font-bold border-0 ${
                importPreview.length ? "bg-[#C6A15B]" : ""
              }`}
            >
              {syncProgress
                ? `Đang đồng bộ ${syncProgress.done}/${syncProgress.total}...`
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
                bấm "Đồng bộ lên Web".
              </div>
            )
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
                    {dayjs(row.data.created).format("DD/MM/YYYY")}
                  </td>
                  <td className="p-3 font-bold text-[#171826]">
                    {row.data.customerName}
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
    </div>
  );
}
