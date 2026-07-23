import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import {
  FiDollarSign,
  FiShoppingCart,
  FiTag,
  FiHeart,
  FiStar,
  FiRotateCcw,
  FiBriefcase,
} from "react-icons/fi";
import { usePodOrders, useStores } from "../../../hooks/usePod";
import { usePodStore } from "../../../store/usePodStore";
import { POD_STATUS, PodOrderStatus } from "../../../models/pod";

type Period = "day" | "week" | "month" | "quarter" | "year";

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng này" },
  { key: "quarter", label: "Quý này" },
  { key: "year", label: "Năm nay" },
];

function StatCard({
  title,
  value,
  sub,
  subColor,
  icon,
  onClick,
}: {
  title: string;
  value: string;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-2 ${
        onClick
          ? "cursor-pointer transition-all hover:border-[#C7D7FE] hover:shadow-md"
          : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="text-gray-500 text-sm font-medium">{title}</div>
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#EFF4FF] text-[#3B82F6]">
          {icon}
        </span>
      </div>
      <div className="text-3xl font-extrabold text-[#171826] -mt-4">
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: subColor || "#16A34A" }}>
        {sub}
      </div>
    </div>
  );
}

export default function Overview() {
  const { orders } = usePodOrders();
  const { stores } = useStores();
  const { selectedStoreId } = usePodStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("month");
  const goDetail = (metric: string) =>
    navigate(`/dashboard/detail/${metric}?period=${period}`);

  // 3 phí do admin nhập cho shop đang chọn (fallback: shop đầu tiên)
  const activeStore =
    stores.find((s) => s.id === selectedStoreId) || stores[0];
  const designSupportFee = activeStore?.designSupportFee || 0;
  const managementFee = activeStore?.mgmtFee || 0;
  const discountAmount = activeStore?.discountAmount || 0;

  // Đơn thuộc 1 kỳ, tính theo mốc thời gian `ref` (để so kỳ này với kỳ trước)
  const inPeriod = (o: any, ref: dayjs.Dayjs) => {
    const d = dayjs(o.created);
    if (period === "day") return d.isSame(ref, "day");
    if (period === "week")
      return d.startOf("week").isSame(ref.startOf("week"));
    if (period === "month") return d.isSame(ref, "month");
    if (period === "year") return d.isSame(ref, "year");
    return (
      d.isSame(ref, "year") &&
      Math.floor(d.month() / 3) === Math.floor(ref.month() / 3)
    );
  };

  const { filtered, prev } = useMemo(() => {
    const now = dayjs();
    const prevRef =
      period === "day"
        ? now.subtract(1, "day")
        : period === "week"
        ? now.subtract(1, "week")
        : period === "month"
        ? now.subtract(1, "month")
        : period === "year"
        ? now.subtract(1, "year")
        : now.subtract(3, "month");
    return {
      filtered: orders.filter((o) => inPeriod(o, now)),
      prev: orders.filter((o) => inPeriod(o, prevRef)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, period]);

  // Gộp cách tính chỉ số cho cả kỳ này và kỳ trước
  const metrics = (list: any[]) => {
    const spend = list
      .filter((o) => !["pending_payment", "cancelled"].includes(o.status))
      .reduce((s, o) => s + (o.total || 0), 0);
    const count = list.length;
    // Tổng tiền đã hoàn trong kỳ
    const refund = list.reduce((s, o) => s + (o.refundedAmount || 0), 0);
    // Giá trị đơn trung bình: chỉ tính trên đơn ĐÃ HOÀN THÀNH
    const completed = list.filter((o) => o.status === "completed");
    const completedSpend = completed.reduce((s, o) => s + (o.total || 0), 0);
    return {
      spend,
      count,
      avg: completed.length ? completedSpend / completed.length : 0,
      refund,
    };
  };
  const cur = metrics(filtered);
  const before = metrics(prev);
  const {
    spend: totalSpend,
    count: newOrders,
    avg: avgOrder,
    refund,
  } = cur;

  // Breakdown theo shop (chỉ kỳ này): tổng chi tiêu + số đơn từng shop
  const shopRows = useMemo(() => {
    const map = new Map<string, { name: string; spend: number; count: number }>();
    filtered.forEach((o: any) => {
      const key = o.storeId || o.storeName || "—";
      const name = o.storeName || o.storeId || "Không rõ shop";
      const row = map.get(key) || { name, spend: 0, count: 0 };
      row.count += 1;
      if (!["pending_payment", "cancelled"].includes(o.status)) {
        row.spend += o.total || 0;
      }
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
  }, [filtered]);

  // % thay đổi thật so với kỳ trước → chuỗi + màu
  const delta = (c: number, p: number) => {
    if (p === 0)
      return c > 0
        ? { text: "↗ Mới so với kỳ trước", color: "#16A34A" }
        : { text: "→ 0% so với kỳ trước", color: "#6B7280" };
    const pct = ((c - p) / p) * 100;
    const up = pct >= 0;
    return {
      text: `${up ? "↗ +" : "↘ "}${pct.toFixed(1)}% so với kỳ trước`,
      color: up ? "#16A34A" : "#DC2626",
    };
  };
  const usd = (n: number, dp = 0) =>
    `$${n.toLocaleString("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    })}`;

  // Chart doanh thu & lượng đơn — mốc thời gian đổi theo kỳ đang chọn
  // Tháng → 4 tuần, Quý → 3 tháng, Năm → 12 tháng
  const { chartLabels, series } = useMemo(() => {
    const now = dayjs();
    let buckets: { label: string; match: (d: dayjs.Dayjs) => boolean }[];

    if (period === "day") {
      // 6 khung 4 giờ trong ngày
      buckets = [0, 1, 2, 3, 4, 5].map((i) => ({
        label: `${String(i * 4).padStart(2, "0")}h`,
        match: (d) => Math.floor(d.hour() / 4) === i,
      }));
    } else if (period === "week") {
      // 7 ngày trong tuần (Thứ 2 → Chủ nhật)
      const WD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      buckets = WD.map((label, i) => ({
        label,
        match: (d) => (d.day() + 6) % 7 === i,
      }));
    } else if (period === "month") {
      buckets = [0, 1, 2, 3].map((w) => ({
        label: `Tuần ${w + 1}`,
        match: (d) => Math.min(3, Math.floor((d.date() - 1) / 7)) === w,
      }));
    } else if (period === "quarter") {
      const startMonth = Math.floor(now.month() / 3) * 3;
      buckets = [0, 1, 2].map((i) => ({
        label: `Th ${startMonth + i + 1}`,
        match: (d) => d.month() === startMonth + i,
      }));
    } else {
      buckets = Array.from({ length: 12 }, (_, m) => ({
        label: `Th ${m + 1}`,
        match: (d) => d.month() === m,
      }));
    }

    const rows = buckets.map((b) => {
      const inBucket = filtered.filter((o) => b.match(dayjs(o.created)));
      return {
        orders: inBucket.length,
        revenue: inBucket.reduce((s, o) => s + (o.total || 0), 0),
      };
    });
    return {
      chartLabels: buckets.map((b) => b.label),
      series: rows,
    };
  }, [filtered, period]);
  const weeks = series;

  // Pie trạng thái
  const statusCount = new Map<PodOrderStatus, number>();
  filtered.forEach((o) =>
    statusCount.set(o.status, (statusCount.get(o.status) || 0) + 1)
  );
  const statusKeys = Array.from(statusCount.keys());
  const pieLabels = statusKeys.map((k) => POD_STATUS[k]?.label || k);
  const pieColors = statusKeys.map((k) => POD_STATUS[k]?.color || "#999");
  const pieSeries = statusKeys.map((k) => statusCount.get(k) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171826] m-0">
            Tổng quan cửa hàng
          </h1>
          <p className="text-gray-500 m-0 mt-1">
            Theo dõi hiệu suất kinh doanh và trạng thái đơn hàng của bạn.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-1 flex">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm cursor-pointer border-0 ${
                period === p.key
                  ? "bg-[#171826] text-white font-bold"
                  : "bg-transparent text-gray-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Chi Tiêu"
          value={usd(totalSpend, 2)}
          sub={delta(totalSpend, before.spend).text}
          subColor={delta(totalSpend, before.spend).color}
          icon={<FiDollarSign />}
          onClick={() => goDetail("spend")}
        />
        <StatCard
          title="Đơn Hàng Mới"
          value={String(newOrders)}
          sub={delta(newOrders, before.count).text}
          subColor={delta(newOrders, before.count).color}
          icon={<FiShoppingCart />}
          onClick={() => goDetail("orders")}
        />
        <StatCard
          title="Giá Trị Đơn Trung Bình"
          value={usd(avgOrder, 2)}
          sub={delta(avgOrder, before.avg).text}
          subColor={delta(avgOrder, before.avg).color}
          icon={<FiTag />}
          onClick={() => goDetail("avg")}
        />
        <StatCard
          title="Hoàn Tiền"
          value={usd(refund, 2)}
          sub={delta(refund, before.refund).text}
          subColor={delta(refund, before.refund).color}
          icon={<FiRotateCcw />}
          onClick={() => goDetail("refund")}
        />
        <StatCard
          title="Hỗ Trợ Design"
          value={usd(designSupportFee, 2)}
          sub={activeStore ? `Shop ${activeStore.name}` : "Chưa chọn shop"}
          subColor="#6B7280"
          icon={<FiHeart />}
          onClick={() => goDetail("design")}
        />
        <StatCard
          title="Chi Phí Quản Lý"
          value={usd(managementFee, 2)}
          sub={activeStore ? `Shop ${activeStore.name}` : "Chưa chọn shop"}
          subColor="#6B7280"
          icon={<FiBriefcase />}
          onClick={() => goDetail("mgmt")}
        />
        <StatCard
          title="Mức Chiết Khấu"
          value={usd(discountAmount, 2)}
          sub={activeStore ? `Shop ${activeStore.name}` : "Chưa chọn shop"}
          subColor="#6B7280"
          icon={<FiStar />}
          onClick={() => goDetail("discount")}
        />
      </div>

      {/* Breakdown theo shop */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-[#171826] text-lg mt-0 mb-4">
          Theo shop
        </h3>
        {shopRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-100">
                  <th className="py-2 font-medium">Shop</th>
                  <th className="py-2 font-medium text-right">Tổng chi tiêu</th>
                  <th className="py-2 font-medium text-right">Số đơn</th>
                </tr>
              </thead>
              <tbody>
                {shopRows.map((r) => (
                  <tr
                    key={r.name}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2 font-medium text-[#171826]">{r.name}</td>
                    <td className="py-2 text-right">{usd(r.spend, 2)}</td>
                    <td className="py-2 text-right">{r.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 font-bold text-[#171826]">
                  <td className="py-2">Tổng</td>
                  <td className="py-2 text-right">{usd(totalSpend, 2)}</td>
                  <td className="py-2 text-right">{newOrders}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            Chưa có đơn hàng nào
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#171826] text-lg m-0">
                Biến động Doanh Thu & Lượng Đơn
              </h3>
              <p className="text-gray-400 text-sm m-0 mt-1">
                {period === "day"
                  ? "Theo giờ trong ngày"
                  : period === "week"
                  ? "Theo ngày trong tuần"
                  : period === "month"
                  ? "Theo tuần trong tháng"
                  : period === "quarter"
                  ? "Theo tháng trong quý"
                  : "Theo tháng trong năm"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-[#171826]">
                {usd(totalSpend, 2)}
              </div>
              <div className="text-xs text-gray-400">Tổng doanh thu</div>
            </div>
          </div>
          <Chart
            type="area"
            height={320}
            series={[
              { name: "Doanh thu", type: "area", data: weeks.map((w) => w.revenue) },
              { name: "Lượng đơn", type: "line", data: weeks.map((w) => w.orders) },
            ]}
            options={{
              chart: {
                toolbar: { show: false },
                fontFamily: "inherit",
                dropShadow: {
                  enabled: true,
                  top: 6,
                  left: 0,
                  blur: 8,
                  color: "#3B82F6",
                  opacity: 0.12,
                },
              },
              colors: ["#3B82F6", "#22C55E"],
              stroke: { curve: "smooth", width: [3, 3] },
              fill: {
                type: ["gradient", "solid"],
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.35,
                  opacityTo: 0.02,
                  stops: [0, 90, 100],
                },
              },
              markers: {
                size: 0,
                strokeWidth: 3,
                strokeColors: "#fff",
                hover: { size: 6 },
              },
              dataLabels: { enabled: false },
              xaxis: {
                categories: chartLabels,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: "#9CA3AF" } },
              },
              yaxis: [
                {
                  labels: {
                    formatter: (v: number) => `$${Math.round(v)}`,
                    style: { colors: "#9CA3AF" },
                  },
                },
                {
                  opposite: true,
                  labels: {
                    formatter: (v: number) => `${Math.round(v)}`,
                    style: { colors: "#9CA3AF" },
                  },
                },
              ],
              legend: {
                position: "top",
                horizontalAlign: "left",
                markers: { radius: 12 },
                fontWeight: 600,
              },
              grid: {
                borderColor: "#F1F1F4",
                strokeDashArray: 4,
                xaxis: { lines: { show: false } },
                padding: { left: 8, right: 8 },
              },
              tooltip: {
                shared: true,
                intersect: false,
                y: {
                  formatter: (v: number, opts: any) =>
                    opts?.seriesIndex === 0 ? usd(v, 2) : `${v} đơn`,
                },
              },
            }}
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-[#171826] text-lg mt-0 mb-4">
            Tỷ trọng trạng thái đơn hàng
          </h3>
          {pieSeries.length ? (
            <Chart
              type="donut"
              height={320}
              series={pieSeries}
              options={{
                chart: { fontFamily: "inherit" },
                labels: pieLabels,
                colors: pieColors,
                stroke: { width: 2, colors: ["#fff"] },
                legend: {
                  position: "bottom",
                  fontSize: "13px",
                  markers: { radius: 12 },
                  itemMargin: { horizontal: 8, vertical: 4 },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => `${Math.round(val)}%`,
                  style: { fontSize: "12px", fontWeight: 700 },
                  dropShadow: { enabled: false },
                },
                plotOptions: {
                  pie: {
                    donut: {
                      size: "70%",
                      labels: {
                        show: true,
                        value: {
                          fontSize: "26px",
                          fontWeight: 800,
                          color: "#171826",
                        },
                        total: {
                          show: true,
                          label: "Tổng đơn",
                          fontSize: "13px",
                          color: "#9CA3AF",
                          formatter: () =>
                            String(pieSeries.reduce((a, b) => a + b, 0)),
                        },
                      },
                    },
                  },
                },
                tooltip: { y: { formatter: (v: number) => `${v} đơn` } },
              }}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Chưa có đơn hàng nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
