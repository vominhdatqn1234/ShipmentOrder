import { Button, Input, InputNumber, Modal, message } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  useLedger,
  useLedgerMutations,
  useOrders,
  useSellers,
  useStores,
} from "../../hooks/useAdmin";
import { PAID_STATUSES, Seller, Store } from "../../models/admin";

function money(n: number) {
  return `$${(n || 0).toFixed(2)}`;
}

function genTxnId() {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  return (
    "01" +
    Array.from({ length: 24 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("")
  );
}

interface StoreStat {
  store: Store;
  successOrders: number;
  revenue: number;
  matched: number;
  debt: number;
}

export default function Finance() {
  const { sellers } = useSellers();
  const { stores } = useStores();
  const { orders } = useOrders();
  const { entries } = useLedger();
  const { add: addLedger } = useLedgerMutations();
  const [tab, setTab] = useState<"breakdown" | "history">("breakdown");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [clearing, setClearing] = useState<{
    seller: Seller;
    stat: StoreStat;
  } | null>(null);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  // Thống kê theo seller -> store
  const sellerStats = useMemo(() => {
    return sellers
      .filter((s) => s.permission !== "Admin")
      .map((seller) => {
        const sellerStores = stores.filter((st) => st.userId === seller.id);
        const storeStats: StoreStat[] = sellerStores.map((store) => {
          const storeOrders = orders.filter(
            (o) => o.storeId === store.id && PAID_STATUSES.includes(o.status)
          );
          const revenue = storeOrders.reduce((s, o) => s + (o.total || 0), 0);
          const matched = entries
            .filter((e) => e.storeId === store.id)
            .reduce((s, e) => s + (e.amount || 0), 0);
          return {
            store,
            successOrders: storeOrders.length,
            revenue,
            matched,
            debt: Math.max(0, revenue - matched),
          };
        });
        const orderCount = orders.filter((o) => o.userId === seller.id).length;
        const revenue = storeStats.reduce((s, x) => s + x.revenue, 0);
        const paid = storeStats.reduce((s, x) => s + x.matched, 0);
        return {
          seller,
          storeStats,
          storeCount: sellerStores.length,
          orderCount,
          revenue,
          paid,
          debt: Math.max(0, revenue - paid),
        };
      });
  }, [sellers, stores, orders, entries]);

  const handleClear = async () => {
    if (!clearing) return;
    if (amount <= 0) return message.error("Số tiền thu phải lớn hơn 0");
    await addLedger.mutateAsync({
      txnId: genTxnId(),
      sellerId: clearing.seller.id,
      sellerName: clearing.seller.name || clearing.seller.email,
      storeId: clearing.stat.store.id,
      storeName: clearing.stat.store.name,
      period: `Tháng ${dayjs().month() + 1}/${dayjs().year()}`,
      orderCount: clearing.stat.successOrders,
      amount,
      note: note || "Admin ghi nhận thanh toán thủ công",
      created: new Date().toISOString(),
    } as any);
    message.success(
      `Đã gạch nợ ${money(amount)} cho shop ${clearing.stat.store.name}`
    );
    setClearing(null);
    setNote("");
  };

  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold text-gray-900 m-0">
        Hệ thống Sổ cái & Quản lý Công nợ
      </h1>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        Theo dõi chi phí sản xuất tích lũy và duyệt gạch nợ minh bạch theo từng
        đối tác Seller và Shop vệ tinh.
      </p>

      {/* Tabs */}
      <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setTab("breakdown")}
          className={`px-4 py-2 rounded-md text-sm cursor-pointer border-0 ${
            tab === "breakdown"
              ? "bg-[#171826] text-white font-medium"
              : "bg-transparent text-gray-500"
          }`}
        >
          Phân rã theo Seller & Shop
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-md text-sm cursor-pointer border-0 ${
            tab === "history"
              ? "bg-[#171826] text-white font-medium"
              : "bg-transparent text-gray-500"
          }`}
        >
          Lịch sử duyệt gạch nợ toàn cục
        </button>
      </div>

      {tab === "breakdown" && (
        <div className="space-y-3">
          {sellerStats.map(
            ({ seller, storeStats, storeCount, orderCount, revenue, paid, debt }) => {
              const open = expanded.includes(seller.id);
              return (
                <div
                  key={seller.id}
                  className="border border-gray-200 rounded-xl bg-white"
                >
                  <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
                    <span className="w-10 h-10 rounded-full bg-[#171826] text-white font-bold flex items-center justify-center shrink-0">
                      {(seller.name || seller.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-[180px]">
                      <div className="font-semibold text-gray-900">
                        {seller.name || seller.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        Sở hữu {storeCount} cửa hàng · {orderCount} đơn hàng
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-8 flex-wrap">
                      <div className="text-right">
                        <div className="text-[10px] tracking-widest text-gray-400 font-medium">
                          DOANH THU PHÔI
                        </div>
                        <div className="font-semibold text-gray-900">
                          {money(revenue)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] tracking-widest text-gray-400 font-medium">
                          ĐÃ THANH TOÁN
                        </div>
                        <div className="font-semibold text-emerald-600">
                          {money(paid)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] tracking-widest text-gray-400 font-medium">
                          DƯ NỢ
                        </div>
                        {debt > 0.005 ? (
                          <span className="inline-block bg-red-50 text-red-600 font-bold text-sm rounded px-2 py-0.5">
                            {money(debt)}
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-600 font-bold text-sm rounded px-2 py-0.5">
                            Đủ
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setExpanded((prev) =>
                            open
                              ? prev.filter((x) => x !== seller.id)
                              : [...prev, seller.id]
                          )
                        }
                        className="text-[#2563EB] text-sm bg-transparent border-0 cursor-pointer flex items-center gap-1 border-l border-gray-200 pl-4"
                      >
                        {open ? (
                          <>
                            Thu gọn <FiChevronUp />
                          </>
                        ) : (
                          <>
                            Xem chi tiết vệ tinh <FiChevronDown />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-gray-100 px-5 py-3">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="py-2 font-medium">
                              Cửa hàng trực thuộc
                            </th>
                            <th className="py-2 font-medium text-center">
                              Đơn thành công
                            </th>
                            <th className="py-2 font-medium text-right">
                              Đã khớp nợ
                            </th>
                            <th className="py-2 font-medium text-right">
                              Nợ hiện tại
                            </th>
                            <th className="py-2 font-medium text-right">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {storeStats.map((st) => (
                            <tr
                              key={st.store.id}
                              className="border-t border-gray-50"
                            >
                              <td className="py-2.5">🏪 {st.store.name}</td>
                              <td className="py-2.5 text-center">
                                {st.successOrders} đơn
                              </td>
                              <td className="py-2.5 text-right text-emerald-600 font-medium">
                                {money(st.matched)}
                              </td>
                              <td className="py-2.5 text-right">
                                {st.debt > 0.005 ? (
                                  <span className="bg-red-50 text-red-600 font-bold rounded px-2 py-0.5">
                                    {money(st.debt)}
                                  </span>
                                ) : (
                                  <span className="bg-emerald-50 text-emerald-600 font-bold rounded px-2 py-0.5">
                                    Sạch nợ
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 text-right">
                                <Button
                                  size="small"
                                  disabled={st.debt <= 0.005}
                                  onClick={() => {
                                    setClearing({ seller, stat: st });
                                    setAmount(
                                      Math.round(st.debt * 100) / 100
                                    );
                                  }}
                                >
                                  Gạch nợ
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {!storeStats.length && (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-4 text-center text-gray-400"
                              >
                                Seller chưa có cửa hàng nào
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            }
          )}
          {!sellerStats.length && (
            <div className="border border-gray-200 rounded-xl p-12 text-center text-gray-400">
              Chưa có seller nào
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="p-3 font-medium">Mã Khớp Lệnh (Txn ID)</th>
                <th className="p-3 font-medium">Cửa hàng (Shop)</th>
                <th className="p-3 font-medium">Kỳ hạch toán</th>
                <th className="p-3 font-medium text-center">Số đơn chốt sổ</th>
                <th className="p-3 font-medium text-right">Số tiền thu</th>
                <th className="p-3 font-medium">Ghi chú nghiệp vụ</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="p-3 font-mono text-xs text-gray-400">
                    {e.txnId || e.id}
                  </td>
                  <td className="p-3 font-medium">🏪 {e.storeName}</td>
                  <td className="p-3">
                    <span className="bg-gray-100 rounded px-2 py-0.5 text-xs">
                      {e.period}
                    </span>
                  </td>
                  <td className="p-3 text-center">{e.orderCount} đơn</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">
                    {money(e.amount)}
                  </td>
                  <td className="p-3 text-gray-400 italic max-w-[300px] truncate">
                    {e.note}
                  </td>
                </tr>
              ))}
              {!entries.length && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    Chưa có giao dịch gạch nợ nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal gạch nợ */}
      <Modal
        open={!!clearing}
        title={`Gạch nợ — 🏪 ${clearing?.stat.store.name || ""}`}
        okText="Xác nhận gạch nợ"
        cancelText="Hủy"
        confirmLoading={addLedger.isLoading}
        onOk={handleClear}
        onCancel={() => setClearing(null)}
      >
        <div className="space-y-4 pt-2">
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Seller: <b>{clearing?.seller.name || clearing?.seller.email}</b> ·
            Nợ hiện tại:{" "}
            <b className="text-red-500">{money(clearing?.stat.debt || 0)}</b> ·{" "}
            {clearing?.stat.successOrders} đơn thành công
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">
              Số tiền thu ($)
            </div>
            <InputNumber
              className="w-full"
              min={0}
              value={amount}
              onChange={(v) => setAmount(v || 0)}
            />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">
              Ghi chú nghiệp vụ
            </div>
            <Input.TextArea
              rows={2}
              placeholder="Admin ghi nhận thanh toán thủ công..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
