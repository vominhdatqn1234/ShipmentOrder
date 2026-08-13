import { Popconfirm, message } from "antd";
import { useMemo, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useFinanceColumns, useStoreFinance } from "../../../hooks/usePod";
import { PodStore } from "../../../models/pod";

/**
 * Bảng tài chính theo shop (thay cho bảng "Theo shop" cũ).
 *
 *  Cột                | Nguồn
 *  -------------------|--------------------------------------------------
 *  Doanh thu          | KHÁCH TỰ NHẬP            → storeFinance.revenue
 *  Chi Phí Full       | tự tính: tổng tiền đơn fulfill trong kỳ
 *  Chi Phí Khác       | KHÁCH TỰ NHẬP            → storeFinance.otherCost
 *  Hỗ trợ Design      | ADMIN nhập               → stores.designSupportFee
 *  Hỗ Trợ Ship Lại    | tự tính: tổng tiền đơn Reship trong kỳ
 *  <cột tự Add>       | KHÁCH TỰ NHẬP            → storeFinance.extras
 *  Lợi Nhuận          | Doanh thu − Chi Phí Full − Chi Phí Khác
 *                     |   (− cột Add là chi phí, + cột Add là thu)
 *  Tỷ suất LN %       | Lợi Nhuận / Doanh thu
 *  Chiết Khấu         | ADMIN nhập               → stores.discountAmount
 *  Refund             | tự tính: tổng đã hoàn của đơn khách bấm refund
 */

/** Ô nhập tiền: giữ state cục bộ khi gõ, chỉ lưu khi blur/Enter */
function MoneyInput({
  value,
  onSave,
}: {
  value: number;
  onSave: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value ? String(value) : "");
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft.replace(/[^0-9.-]/g, "")) || 0;
    setDraft(null);
    if (n !== value) onSave(n);
  };
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
        $
      </span>
      <input
        value={shown}
        placeholder="0"
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(null);
        }}
        className="w-[104px] pl-5 pr-2 py-1.5 text-right rounded-lg border border-gray-200 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#EFF4FF]"
      />
    </div>
  );
}

export default function ShopFinanceTable({
  stores,
  orders,
  periodKey,
  periodLabel,
  period,
  scope,
}: {
  /** Các shop hiển thị (theo phạm vi Shop này / Tất cả shop) */
  stores: PodStore[];
  /** Đơn hàng đã lọc theo kỳ + phạm vi */
  orders: any[];
  /** Khoá kỳ để lưu số liệu, vd "2026-08" */
  periodKey: string;
  periodLabel: string;
  /** Kỳ & phạm vi đang chọn — dùng để mở trang chi tiết đơn */
  period: string;
  scope: string;
}) {
  const navigate = useNavigate();
  const { financeRows, save } = useStoreFinance(periodKey);
  const { columns, add, remove } = useFinanceColumns();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsCost, setNewIsCost] = useState(true);

  const usd = (n: number, dp = 2) =>
    `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    })}`;

  const rows = useMemo(() => {
    return stores.map((st) => {
      const mine = orders.filter((o: any) => o.storeId === st.id);
      // Chi Phí Full: tiền fulfill đã phát sinh (bỏ đơn chờ thanh toán / đã huỷ)
      const fullCost = mine
        .filter((o: any) => !["pending_payment", "cancelled"].includes(o.status))
        .reduce((s: number, o: any) => s + (o.total || 0), 0);
      // Hỗ Trợ Ship Lại: các đơn ship lại khách đã yêu cầu
      const reship = mine
        .filter((o: any) => o.status === "reship")
        .reduce((s: number, o: any) => s + (o.total || 0), 0);
      // Refund: admin hoàn theo các đơn khách bấm refund
      const refund = mine.reduce(
        (s: number, o: any) => s + (o.refundedAmount || 0),
        0
      );
      const fin = financeRows.find((f) => f.storeId === st.id);
      const revenue = fin?.revenue || 0;
      const otherCost = fin?.otherCost || 0;
      const extras = fin?.extras || {};
      const extraDelta = columns.reduce(
        (s, c) => s + (c.isCost ? -1 : 1) * (Number(extras[c.id]) || 0),
        0
      );
      const profit = revenue - fullCost - otherCost + extraDelta;
      return {
        store: st,
        revenue,
        fullCost,
        otherCost,
        design: st.designSupportFee || 0,
        reship,
        extras,
        profit,
        margin: revenue ? (profit / revenue) * 100 : 0,
        discount: st.discountAmount || 0,
        refund,
        orderCount: mine.length,
      };
    });
  }, [stores, orders, financeRows, columns]);

  const sum = (pick: (r: (typeof rows)[number]) => number) =>
    rows.reduce((s, r) => s + pick(r), 0);
  const totalRevenue = sum((r) => r.revenue);
  const totalProfit = sum((r) => r.profit);

  const th = "py-2 px-3 font-medium whitespace-nowrap";
  const td = "py-2 px-3 whitespace-nowrap";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="font-bold text-[#171826] text-lg mt-0 mb-1">
            Theo shop
          </h3>
          <p className="text-gray-400 text-sm m-0">
            {periodLabel} · Ô nền trắng là số bạn tự nhập, ô xám do hệ thống /
            admin tính.
          </p>
        </div>
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#171826] cursor-pointer hover:border-[#C7D7FE]"
          >
            <FiPlus /> Thêm cột
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên cột (vd Lương)"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#3B82F6]"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newIsCost}
                onChange={(e) => setNewIsCost(e.target.checked)}
              />
              Là chi phí (trừ vào lợi nhuận)
            </label>
            <button
              disabled={!newName.trim() || add.isLoading}
              onClick={() =>
                add.mutate(
                  { name: newName.trim(), isCost: newIsCost },
                  {
                    onSuccess: () => {
                      setNewName("");
                      setNewIsCost(true);
                      setAdding(false);
                    },
                  }
                )
              }
              className="px-3 py-2 rounded-lg border-0 bg-[#171826] text-white text-sm font-bold cursor-pointer disabled:opacity-40"
            >
              Lưu
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm cursor-pointer"
            >
              Huỷ
            </button>
          </div>
        )}
      </div>

      {stores.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-100 bg-gray-50/60">
                <th className={`${th} sticky left-0 bg-gray-50`}>Shop</th>
                <th className={`${th} text-right`}>Doanh thu</th>
                <th className={`${th} text-right`}>Chi Phí Full</th>
                <th className={`${th} text-right`}>Chi Phí Khác</th>
                <th className={`${th} text-right`}>Hỗ trợ Design</th>
                <th className={`${th} text-right`}>Hỗ Trợ Ship Lại</th>
                {columns.map((c) => (
                  <th key={c.id} className={`${th} text-right`}>
                    <span className="inline-flex items-center gap-1">
                      {c.name}
                      <span
                        className={`text-[10px] font-semibold px-1 rounded ${
                          c.isCost
                            ? "bg-[#FDECEC] text-[#B91C1C]"
                            : "bg-[#E8F7EC] text-[#15803D]"
                        }`}
                      >
                        {c.isCost ? "−" : "+"}
                      </span>
                      <Popconfirm
                        title={`Xoá cột "${c.name}"?`}
                        description="Số liệu đã nhập ở cột này sẽ không còn hiển thị."
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        placement="bottomRight"
                        onConfirm={() =>
                          remove.mutate(c.id, {
                            onSuccess: () => {
                              message.success("Đã xoá cột");
                            },
                          })
                        }
                      >
                        <FiX
                          title="Xoá cột"
                          className="cursor-pointer text-gray-400 hover:text-[#B91C1C]"
                        />
                      </Popconfirm>
                    </span>
                  </th>
                ))}
                <th className={`${th} text-right`}>Lợi Nhuận</th>
                <th className={`${th} text-right`}>Tỷ suất LN %</th>
                <th className={`${th} text-right`}>Chiết Khấu</th>
                <th className={`${th} text-right`}>Refund</th>
                <th className={`${th} text-right`}>Số đơn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.store.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td
                    className={`${td} sticky left-0 bg-white font-medium text-[#171826]`}
                  >
                    {r.store.name}
                  </td>
                  <td className={`${td} text-right`}>
                    <MoneyInput
                      value={r.revenue}
                      onSave={(v) =>
                        save.mutate({ storeId: r.store.id, revenue: v })
                      }
                    />
                  </td>
                  <td className={`${td} text-right text-gray-600`}>
                    {usd(r.fullCost)}
                  </td>
                  <td className={`${td} text-right`}>
                    <MoneyInput
                      value={r.otherCost}
                      onSave={(v) =>
                        save.mutate({ storeId: r.store.id, otherCost: v })
                      }
                    />
                  </td>
                  <td className={`${td} text-right text-gray-600`}>
                    {usd(r.design)}
                  </td>
                  <td className={`${td} text-right text-gray-600`}>
                    {usd(r.reship)}
                  </td>
                  {columns.map((c) => (
                    <td key={c.id} className={`${td} text-right`}>
                      <MoneyInput
                        value={Number(r.extras[c.id]) || 0}
                        onSave={(v) =>
                          save.mutate({
                            storeId: r.store.id,
                            extras: { ...r.extras, [c.id]: v },
                          })
                        }
                      />
                    </td>
                  ))}
                  <td
                    className={`${td} text-right font-bold`}
                    style={{ color: r.profit >= 0 ? "#15803D" : "#B91C1C" }}
                  >
                    {usd(r.profit)}
                  </td>
                  <td
                    className={`${td} text-right font-medium`}
                    style={{ color: r.margin >= 0 ? "#15803D" : "#B91C1C" }}
                  >
                    {r.revenue ? `${r.margin.toFixed(1)}%` : "—"}
                  </td>
                  <td className={`${td} text-right text-gray-600`}>
                    {usd(r.discount)}
                  </td>
                  <td className={`${td} text-right text-gray-600`}>
                    {usd(r.refund)}
                  </td>
                  <td className={`${td} text-right`}>
                    {r.orderCount ? (
                      <button
                        title="Xem chi tiết các đơn của shop này"
                        onClick={() =>
                          navigate(
                            `/dashboard/detail/orders?period=${period}&scope=${scope}&storeId=${encodeURIComponent(
                              r.store.id
                            )}`
                          )
                        }
                        className="bg-transparent border-0 p-0 font-medium text-[#2563EB] underline cursor-pointer hover:text-[#1D4ED8]"
                      >
                        {r.orderCount}
                      </button>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-bold text-[#171826]">
                <td className={`${td} sticky left-0 bg-white`}>Tổng</td>
                <td className={`${td} text-right`}>{usd(totalRevenue)}</td>
                <td className={`${td} text-right`}>{usd(sum((r) => r.fullCost))}</td>
                <td className={`${td} text-right`}>
                  {usd(sum((r) => r.otherCost))}
                </td>
                <td className={`${td} text-right`}>{usd(sum((r) => r.design))}</td>
                <td className={`${td} text-right`}>{usd(sum((r) => r.reship))}</td>
                {columns.map((c) => (
                  <td key={c.id} className={`${td} text-right`}>
                    {usd(sum((r) => Number(r.extras[c.id]) || 0))}
                  </td>
                ))}
                <td
                  className={`${td} text-right`}
                  style={{ color: totalProfit >= 0 ? "#15803D" : "#B91C1C" }}
                >
                  {usd(totalProfit)}
                </td>
                <td className={`${td} text-right`}>
                  {totalRevenue
                    ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%`
                    : "—"}
                </td>
                <td className={`${td} text-right`}>
                  {usd(sum((r) => r.discount))}
                </td>
                <td className={`${td} text-right`}>{usd(sum((r) => r.refund))}</td>
                <td className={`${td} text-right`}>
                  {sum((r) => r.orderCount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-400">Chưa có shop nào</div>
      )}

      <p className="text-xs text-gray-400 mt-3 mb-0">
        Lợi Nhuận = Doanh thu − Chi Phí Full − Chi Phí Khác (± các cột bạn tự
        thêm). Hỗ trợ Design và Chiết Khấu do admin nhập; Hỗ Trợ Ship Lại và
        Refund tính từ đơn Reship / đơn đã hoàn tiền trong kỳ.
      </p>
    </div>
  );
}
