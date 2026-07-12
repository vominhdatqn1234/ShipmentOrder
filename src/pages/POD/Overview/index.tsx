import dayjs from "dayjs";
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  FiDollarSign,
  FiShoppingCart,
  FiTag,
  FiHeart,
  FiStar,
} from "react-icons/fi";
import { usePodOrders } from "../../../hooks/usePod";
import { POD_STATUS, PodOrderStatus } from "../../../models/pod";

type Period = "month" | "quarter" | "year";

const PERIODS: { key: Period; label: string }[] = [
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
}: {
  title: string;
  value: string;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-2">
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
  const [period, setPeriod] = useState<Period>("month");

  // Đơn thuộc 1 kỳ, tính theo mốc thời gian `ref` (để so kỳ này với kỳ trước)
  const inPeriod = (o: any, ref: dayjs.Dayjs) => {
    const d = dayjs(o.created);
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
      period === "month"
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
    return {
      spend,
      count,
      avg: count ? spend / count : 0,
      supported: list.filter((o) => ["support", "reship"].includes(o.status))
        .length,
    };
  };
  const cur = metrics(filtered);
  const before = metrics(prev);
  const { spend: totalSpend, count: newOrders, avg: avgOrder, supported } = cur;

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

  // Chart doanh thu & lượng đơn theo 4 tuần
  const weeks = [0, 1, 2, 3].map((w) => {
    const inWeek = filtered.filter((o) => {
      const day = dayjs(o.created).date();
      return Math.min(3, Math.floor((day - 1) / 7)) === w;
    });
    return {
      orders: inWeek.length,
      revenue: inWeek.reduce((s, o) => s + (o.total || 0), 0),
    };
  });

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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Tổng Chi Tiêu"
          value={usd(totalSpend)}
          sub={delta(totalSpend, before.spend).text}
          subColor={delta(totalSpend, before.spend).color}
          icon={<FiDollarSign />}
        />
        <StatCard
          title="Đơn Hàng Mới"
          value={String(newOrders)}
          sub={delta(newOrders, before.count).text}
          subColor={delta(newOrders, before.count).color}
          icon={<FiShoppingCart />}
        />
        <StatCard
          title="Giá Trị Đơn Trung Bình"
          value={usd(avgOrder, 2)}
          sub={delta(avgOrder, before.avg).text}
          subColor={delta(avgOrder, before.avg).color}
          icon={<FiTag />}
        />
        <StatCard
          title="Đơn Hàng Được Hỗ Trợ"
          value={`${supported} đơn`}
          sub={delta(supported, before.supported).text}
          subColor={delta(supported, before.supported).color}
          icon={<FiHeart />}
        />
        <StatCard
          title="Mức Chiết Khấu"
          value="0%"
          sub="↗ Hạng thành viên tiêu chuẩn"
          subColor="#6B7280"
          icon={<FiStar />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-[#171826] text-lg mt-0 mb-4">
            Biến động Doanh Thu & Lượng Đơn
          </h3>
          <Chart
            type="line"
            height={320}
            series={[
              { name: "orders", data: weeks.map((w) => w.orders) },
              { name: "revenue", data: weeks.map((w) => w.revenue) },
            ]}
            options={{
              chart: { toolbar: { show: false } },
              colors: ["#22C55E", "#3B82F6"],
              stroke: { curve: "smooth", width: 3 },
              markers: { size: 5 },
              xaxis: {
                categories: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
              },
              yaxis: [
                {
                  labels: { formatter: (v: number) => `$${Math.round(v)}` },
                },
                { opposite: true },
              ],
              legend: { position: "top" },
              grid: { borderColor: "#F1F1F4", strokeDashArray: 4 },
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
                labels: pieLabels,
                colors: pieColors,
                legend: { position: "bottom" },
                dataLabels: { enabled: true },
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
