import dayjs from "dayjs";
import { useMemo } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { usePodOrders, useStores } from "../../../hooks/usePod";
import { POD_STATUS, PodOrder } from "../../../models/pod";

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

  const { orders } = usePodOrders();
  const { stores } = useStores();

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
    const sortedList = [...list].sort(
      (a, b) => +new Date(b.created) - +new Date(a.created)
    );
    return { value, list: sortedList, shops, count: list.length };
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
              Danh sách đơn
            </h3>
            {orderData.list.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[640px]">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-100">
                      <th className="py-2 font-medium">Mã đơn</th>
                      <th className="py-2 font-medium">Ngày tạo</th>
                      <th className="py-2 font-medium">Shop</th>
                      <th className="py-2 font-medium">Trạng thái</th>
                      <th className="py-2 font-medium text-right">
                        {orderCfg.amountLabel}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.list.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2 font-medium text-[#171826]">
                          {o.orderCode}
                        </td>
                        <td className="py-2 text-gray-500">
                          {dayjs(o.created).format("DD/MM/YYYY")}
                        </td>
                        <td className="py-2 text-gray-500">
                          {o.storeName || "—"}
                        </td>
                        <td className="py-2">
                          <span
                            className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                            style={{
                              color: POD_STATUS[o.status]?.color || "#6B7280",
                              background: POD_STATUS[o.status]?.bg || "#F3F4F6",
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
    </div>
  );
}
