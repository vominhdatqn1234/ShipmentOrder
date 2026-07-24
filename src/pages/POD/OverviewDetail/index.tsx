import { Input, Modal, Pagination } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { FiArrowLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { usePodOrders, useStores } from "../../../hooks/usePod";
import {
  POD_STATUS,
  PodOrder,
  PodOrderItem,
  splitSizeFromColor,
} from "../../../models/pod";

type Period = "day" | "week" | "month" | "quarter" | "year";

const usd = (n: number, dp = 2) =>
  `$${(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })}`;

// Cấu hình từng metric: nhãn + loại (theo đơn / theo phí shop)
const ORDER_METRICS: Record<
  string,
  {
    title: string;
    // Lọc đơn liên quan tới metric
    filter: (o: PodOrder) => boolean;
    // Số tiền của 1 đơn đóng góp vào metric (dùng cho cột & tổng)
    amount: (o: PodOrder) => number;
    // Cách tính giá trị tổng hiển thị
    kind: "sum" | "count" | "avg";
    amountLabel: string;
  }
> = {
  spend: {
    title: "Tổng Chi Tiêu",
    filter: (o) => !["pending_payment", "cancelled"].includes(o.status),
    amount: (o) => o.total || 0,
    kind: "sum",
    amountLabel: "Giá trị",
  },
  orders: {
    title: "Đơn Hàng Mới",
    filter: () => true,
    amount: (o) => o.total || 0,
    kind: "count",
    amountLabel: "Giá trị",
  },
  avg: {
    title: "Giá Trị Đơn Trung Bình",
    filter: (o) => o.status === "completed",
    amount: (o) => o.total || 0,
    kind: "avg",
    amountLabel: "Giá trị",
  },
  refund: {
    title: "Hoàn Tiền",
    filter: (o) => (o.refundedAmount || 0) > 0,
    amount: (o) => o.refundedAmount || 0,
    kind: "sum",
    amountLabel: "Đã hoàn",
  },
};

const FEE_METRICS: Record<
  string,
  { title: string; field: "designSupportFee" | "mgmtFee" | "discountAmount" }
> = {
  design: { title: "Hỗ Trợ Design", field: "designSupportFee" },
  mgmt: { title: "Chi Phí Quản Lý", field: "mgmtFee" },
  discount: { title: "Mức Chiết Khấu", field: "discountAmount" },
};

const PERIOD_LABEL: Record<Period, string> = {
  day: "Ngày",
  week: "Tuần",
  month: "Tháng này",
  quarter: "Quý này",
  year: "Năm nay",
};

export default function OverviewDetail() {
  const { metric = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const period = (params.get("period") as Period) || "month";
  const scope = params.get("scope") || "shop";

  const { orders } = usePodOrders({ allStores: scope === "all" });
  const { stores } = useStores();
  // Nhóm shop đang mở (mặc định thu gọn cho gọn)
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const toggleGroup = (name: string) =>
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  // Trang & từ khóa tìm của từng nhóm shop
  const [groupPage, setGroupPage] = useState<Record<string, number>>({});
  const [groupSearch, setGroupSearch] = useState<Record<string, string>>({});
  const GROUP_PAGE_SIZE = 10;
  // Đơn đang xem chi tiết (modal)
  const [detailOrder, setDetailOrder] = useState<PodOrder | null>(null);

  const inPeriod = (o: PodOrder) => {
    const d = dayjs(o.created);
    const ref = dayjs();
    if (period === "day") return d.isSame(ref, "day");
    if (period === "week") return d.startOf("week").isSame(ref.startOf("week"));
    if (period === "month") return d.isSame(ref, "month");
    if (period === "year") return d.isSame(ref, "year");
    return (
      d.isSame(ref, "year") &&
      Math.floor(d.month() / 3) === Math.floor(ref.month() / 3)
    );
  };

  const orderCfg = ORDER_METRICS[metric];
  const feeCfg = FEE_METRICS[metric];

  // ----- Metric theo đơn -----
  const orderData = useMemo(() => {
    if (!orderCfg) return null;
    const list = orders.filter((o) => inPeriod(o) && orderCfg.filter(o));
    const totalAmount = list.reduce((s, o) => s + orderCfg.amount(o), 0);
    const value =
      orderCfg.kind === "count"
        ? String(list.length)
        : orderCfg.kind === "avg"
        ? usd(list.length ? totalAmount / list.length : 0)
        : usd(totalAmount);

    const shopMap = new Map<
      string,
      { name: string; count: number; amount: number }
    >();
    list.forEach((o) => {
      const key = o.storeId || o.storeName || "—";
      const row = shopMap.get(key) || {
        name: o.storeName || o.storeId || "Không rõ shop",
        count: 0,
        amount: 0,
      };
      row.count += 1;
      row.amount += orderCfg.amount(o);
      shopMap.set(key, row);
    });
    const shops = Array.from(shopMap.values()).sort(
      (a, b) => b.amount - a.amount
    );

    // Nhóm danh sách đơn theo shop (mỗi shop 1 group, đơn mới nhất trước)
    const groupMap = new Map<
      string,
      { name: string; count: number; amount: number; orders: PodOrder[] }
    >();
    list.forEach((o) => {
      const key = o.storeId || o.storeName || "—";
      const g = groupMap.get(key) || {
        name: o.storeName || o.storeId || "Không rõ shop",
        count: 0,
        amount: 0,
        orders: [],
      };
      g.count += 1;
      g.amount += orderCfg.amount(o);
      g.orders.push(o);
      groupMap.set(key, g);
    });
    const groups = Array.from(groupMap.values())
      .map((g) => ({
        ...g,
        orders: g.orders.sort(
          (a, b) => +new Date(b.created) - +new Date(a.created)
        ),
      }))
      .sort((a, b) => b.amount - a.amount);

    return { value, groups, shops, count: list.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, metric, period]);

  // ----- Metric theo phí shop -----
  const feeData = useMemo(() => {
    if (!feeCfg) return null;
    const rows = stores
      .map((s) => ({ name: s.name, value: (s[feeCfg.field] as number) || 0 }))
      .sort((a, b) => b.value - a.value);
    const total = rows.reduce((s, r) => s + r.value, 0);
    return { rows, total };
  }, [stores, feeCfg]);

  const title = orderCfg?.title || feeCfg?.title || "Chi tiết";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-500 hover:text-[#171826]"
        >
          <FiArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#171826] m-0">{title}</h1>
          <p className="text-gray-500 m-0 mt-1">
            Chi tiết theo kỳ: {PERIOD_LABEL[period]}
          </p>
        </div>
      </div>

      {!orderCfg && !feeCfg && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          Không tìm thấy chỉ số phù hợp.
        </div>
      )}

      {/* Metric theo đơn */}
      {orderCfg && orderData && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-gray-500 text-sm font-medium">{title}</div>
            <div className="text-4xl font-extrabold text-[#171826] mt-1">
              {orderData.value}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {orderData.count} đơn liên quan
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-[#171826] text-lg mt-0 mb-4">
              Theo shop
            </h3>
            {orderData.shops.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-100">
                      <th className="py-2 font-medium">Shop</th>
                      <th className="py-2 font-medium text-right">Số đơn</th>
                      <th className="py-2 font-medium text-right">
                        {orderCfg.amountLabel}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.shops.map((r) => (
                      <tr
                        key={r.name}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2 font-medium text-[#171826]">
                          {r.name}
                        </td>
                        <td className="py-2 text-right">{r.count}</td>
                        <td className="py-2 text-right">{usd(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                Không có dữ liệu
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-[#171826] text-lg mt-0 mb-4">
              Danh sách đơn (nhóm theo shop)
            </h3>
            {orderData.groups.length ? (
              <div className="space-y-5">
                {orderData.groups.map((g) => {
                  // 1 shop thì luôn mở; nhiều shop mặc định thu gọn
                  const open =
                    orderData.groups.length === 1 ||
                    openGroups.includes(g.name);
                  const page = groupPage[g.name] || 1;
                  const kw = (groupSearch[g.name] || "").trim().toLowerCase();
                  const gOrders = kw
                    ? g.orders.filter(
                        (o) =>
                          o.orderCode?.toLowerCase().includes(kw) ||
                          o.customerName?.toLowerCase().includes(kw)
                      )
                    : g.orders;
                  const pageOrders = gOrders.slice(
                    (page - 1) * GROUP_PAGE_SIZE,
                    page * GROUP_PAGE_SIZE
                  );
                  return (
                  <div key={g.name}>
                    {/* Tiêu đề nhóm shop — bấm để đóng/mở */}
                    <button
                      onClick={() => toggleGroup(g.name)}
                      className="w-full flex items-center justify-between bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-gray-100 rounded-lg px-3 py-2 mb-2 cursor-pointer text-left"
                    >
                      <span className="font-bold text-[#171826] flex items-center gap-2">
                        {open ? <FiChevronUp /> : <FiChevronDown />}
                        🏪 {g.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {g.count} đơn · {usd(g.amount)}
                      </span>
                    </button>
                    {open && (
                    <>
                    <Input.Search
                      allowClear
                      size="small"
                      placeholder="Tìm mã đơn hoặc tên khách trong shop này..."
                      className="mb-2 max-w-[360px]"
                      value={groupSearch[g.name] || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGroupSearch((prev) => ({ ...prev, [g.name]: v }));
                        setGroupPage((prev) => ({ ...prev, [g.name]: 1 }));
                      }}
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse min-w-[560px]">
                        <thead>
                          <tr className="text-gray-500 text-left border-b border-gray-100">
                            <th className="py-2 font-medium">Mã đơn</th>
                            <th className="py-2 font-medium">Ngày tạo</th>
                            <th className="py-2 font-medium">Trạng thái</th>
                            <th className="py-2 font-medium text-right">
                              {orderCfg.amountLabel}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageOrders.map((o) => (
                            <tr
                              key={o.id}
                              onClick={() => setDetailOrder(o)}
                              className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-[#F8FAFC]"
                            >
                              <td className="py-2 font-medium text-[#2563EB] underline">
                                {o.orderCode}
                              </td>
                              <td className="py-2 text-gray-500">
                                {dayjs(o.created).format("DD/MM/YYYY")}
                              </td>
                              <td className="py-2">
                                <span
                                  className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                                  style={{
                                    color:
                                      POD_STATUS[o.status]?.color || "#6B7280",
                                    background:
                                      POD_STATUS[o.status]?.bg || "#F3F4F6",
                                  }}
                                >
                                  {POD_STATUS[o.status]?.label || o.status}
                                </span>
                              </td>
                              <td className="py-2 text-right font-medium">
                                {usd(orderCfg.amount(o))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {gOrders.length > GROUP_PAGE_SIZE && (
                      <div className="flex justify-end mt-2">
                        <Pagination
                          size="small"
                          current={page}
                          pageSize={GROUP_PAGE_SIZE}
                          total={gOrders.length}
                          showSizeChanger={false}
                          onChange={(p) =>
                            setGroupPage((prev) => ({ ...prev, [g.name]: p }))
                          }
                        />
                      </div>
                    )}
                    {!gOrders.length && (
                      <div className="py-4 text-center text-gray-400 text-sm">
                        Không tìm thấy đơn khớp từ khóa
                      </div>
                    )}
                    </>
                    )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                Chưa có đơn nào trong kỳ này
              </div>
            )}
          </div>
        </>
      )}

      {/* Metric theo phí shop (admin cấu hình) */}
      {feeCfg && feeData && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-gray-500 text-sm font-medium">
              Tổng {title} (tất cả shop)
            </div>
            <div className="text-4xl font-extrabold text-[#171826] mt-1">
              {usd(feeData.total)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Giá trị do admin cấu hình cho từng shop
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-[#171826] text-lg mt-0 mb-4">
              Theo shop
            </h3>
            {feeData.rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-100">
                      <th className="py-2 font-medium">Shop</th>
                      <th className="py-2 font-medium text-right">{title}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.rows.map((r) => (
                      <tr
                        key={r.name}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2 font-medium text-[#171826]">
                          {r.name}
                        </td>
                        <td className="py-2 text-right">{usd(r.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                Chưa có shop nào
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal chi tiết đơn */}
      <Modal
        open={!!detailOrder}
        onCancel={() => setDetailOrder(null)}
        footer={null}
        width={720}
        title={
          detailOrder ? (
            <div className="flex items-center gap-3">
              <span>Đơn #{detailOrder.orderCode}</span>
              <span
                className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                style={{
                  color: POD_STATUS[detailOrder.status]?.color || "#6B7280",
                  background: POD_STATUS[detailOrder.status]?.bg || "#F3F4F6",
                }}
              >
                {POD_STATUS[detailOrder.status]?.label || detailOrder.status}
              </span>
            </div>
          ) : null
        }
      >
        {detailOrder && (
          <div className="space-y-4">
            {/* Thông tin đơn + khách */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs font-medium mb-1">
                  THÔNG TIN ĐƠN
                </div>
                <div>Shop: {detailOrder.storeName || "—"}</div>
                <div>
                  Ngày tạo: {dayjs(detailOrder.created).format("DD/MM/YYYY")}
                </div>
                {detailOrder.datePaid && (
                  <div>
                    Thanh toán:{" "}
                    {dayjs(detailOrder.datePaid).format("DD/MM/YYYY")}
                  </div>
                )}
                {detailOrder.tracking && (
                  <div>Tracking: {detailOrder.tracking}</div>
                )}
              </div>
              <div>
                <div className="text-gray-400 text-xs font-medium mb-1">
                  KHÁCH HÀNG
                </div>
                <div className="font-medium text-[#171826]">
                  {detailOrder.customerName || "—"}
                </div>
                <div className="text-gray-500">
                  {[detailOrder.address1, detailOrder.address2]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                <div className="text-gray-500">
                  {[detailOrder.city, detailOrder.state, detailOrder.zip]
                    .filter(Boolean)
                    .join(", ")}
                  {detailOrder.country ? ` · ${detailOrder.country}` : ""}
                </div>
                <div className="text-gray-500">
                  {[
                    detailOrder.customerPhone && `ĐT: ${detailOrder.customerPhone}`,
                    detailOrder.customerEmail &&
                      `Email: ${detailOrder.customerEmail}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            </div>

            {/* Sản phẩm */}
            <div>
              <div className="text-gray-400 text-xs font-medium mb-1">
                SẢN PHẨM
              </div>
              <div className="space-y-2">
                {(detailOrder.items || []).map((it, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-50 border border-amber-200 text-amber-700 rounded px-2 py-0.5 text-xs font-semibold">
                        {origLabel(it) || "—"}
                      </span>
                      <span className="text-gray-500">
                        {it.quantity || 1}x {it.productSku || "—"}
                        {[it.color, it.size].filter(Boolean).length
                          ? ` (${[it.color, it.size].filter(Boolean).join(" - ")})`
                          : ""}
                      </span>
                    </div>
                    {(it.frontUrl || it.backUrl || it.mockupUrl) && (
                      <div className="mt-1 text-[11px] text-gray-400 break-all">
                        {[
                          it.frontUrl && `FRONT: ${it.frontUrl}`,
                          it.backUrl && `BACK: ${it.backUrl}`,
                          it.mockupUrl && `MOCKUP: ${it.mockupUrl}`,
                        ]
                          .filter(Boolean)
                          .map((line, k) => (
                            <div key={k}>{line}</div>
                          ))}
                      </div>
                    )}
                    {it.personalization && (
                      <div className="mt-1 text-xs text-gray-500">
                        Personalization: {it.personalization}
                      </div>
                    )}
                    {it.note && (
                      <div className="mt-1 text-xs text-gray-500">
                        Ghi chú: {it.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {detailOrder.note && (
              <div className="text-sm">
                <b>Ghi chú đơn:</b> {detailOrder.note}
              </div>
            )}

            <div className="text-right font-bold text-[#171826]">
              Tổng: {usd(detailOrder.total || 0)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/** Bản gốc khách up: Type · Color · Size (tách size nếu dính trong color) */
function origLabel(it: PodOrderItem): string {
  const type = it.origType ?? it.productSku ?? "";
  const { color, size } = splitSizeFromColor(
    it.origColor ?? it.color,
    it.origSize ?? it.size
  );
  return [
    type && `Type: ${type}`,
    color && `Color: ${color}`,
    size && `Size: ${size}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
