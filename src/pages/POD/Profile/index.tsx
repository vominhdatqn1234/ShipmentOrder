import { Button, Input, Popconfirm, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCreditCard,
  FiDollarSign,
  FiLock,
  FiUser,
} from "react-icons/fi";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "lib/db";
import { firestore } from "lib/firebase";
import { useUser } from "../../../store/useUser";
import { usePodOrders, useStores } from "../../../hooks/usePod";
import { useLocalStorage } from "../../../hooks/useLocalStorage";

const PAID_STATUSES = [
  "pending_approval",
  "in_production",
  "shipping",
  "completed",
  "reship",
  "support",
];

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

const empRef = collection(firestore, "employee");

export default function Profile() {
  const { user, setUser } = useUser();
  const { orders } = usePodOrders();
  const { stores } = useStores();
  const [, setToken] = useLocalStorage("token", null);

  // Lịch sử gạch nợ của seller này
  const [ledger, setLedger] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    getDocs(query(collection(firestore, "ledgerEntries"), where("sellerId", "==", user.id)))
      .then((snap: any) => {
        const rows: any[] = [];
        snap?.forEach((d: any) => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (a.created < b.created ? 1 : -1));
        setLedger(rows);
      })
      .catch(() => setLedger([]));
  }, [user?.id]);

  // Form thông tin cá nhân
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email] = useState(user?.email || "");
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);

  // Thống kê tài chính
  const paidOrders = useMemo(
    () => orders.filter((o) => PAID_STATUSES.includes(o.status)),
    [orders]
  );
  const totalSpend = useMemo(
    () => paidOrders.reduce((s, o) => s + (o.total || 0), 0),
    [paidOrders]
  );
  const totalPaid = useMemo(
    () => ledger.reduce((s, e) => s + (e.amount || 0), 0),
    [ledger]
  );
  const debt = Math.max(0, totalSpend - totalPaid);

  // Phân rã theo shop (trong tháng hiện tại)
  const shopStats = useMemo(() => {
    const now = dayjs();
    return stores.map((st) => {
      const monthOrders = paidOrders.filter(
        (o) => o.storeId === st.id && dayjs(o.created).isSame(now, "month")
      );
      const allOrders = paidOrders.filter((o) => o.storeId === st.id);
      const spendMonth = monthOrders.reduce((s, o) => s + (o.total || 0), 0);
      const spendAll = allOrders.reduce((s, o) => s + (o.total || 0), 0);
      const matched = ledger
        .filter((e) => e.storeId === st.id)
        .reduce((s, e) => s + (e.amount || 0), 0);
      return {
        store: st,
        orders: monthOrders.length,
        spendMonth,
        debt: Math.max(0, spendAll - matched),
      };
    });
  }, [stores, paidOrders, ledger]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!firstName.trim() || !lastName.trim())
      return message.error("Vui lòng nhập Họ và Tên");

    const updates: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
    };

    const wantChangePass = curPass || newPass || confirmPass;
    if (wantChangePass) {
      if (!curPass) return message.error("Nhập mật khẩu hiện tại để đổi");
      if (newPass.length < 5)
        return message.error("Mật khẩu mới tối thiểu 5 kí tự");
      if (newPass !== confirmPass)
        return message.error("Xác nhận mật khẩu mới không khớp");
      const snap = await getDocs(
        query(
          empRef,
          where("email", "==", email),
          where("password", "==", curPass),
          limit(1)
        )
      );
      if ((snap as any).empty)
        return message.error("Mật khẩu hiện tại không đúng");
      updates.password = newPass;
    }

    try {
      setSaving(true);
      await updateDoc(doc(empRef, user.id), updates);
      setUser({ ...user, ...updates, password: null });
      setCurPass("");
      setNewPass("");
      setConfirmPass("");
      message.success("Đã lưu tất cả thay đổi");
    } catch (e: any) {
      message.error(`Lưu thất bại: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user?.id) return;
    try {
      await updateDoc(doc(empRef, user.id), { disabled: true } as any);
      setToken(null);
      window.location.href = "/auth/login";
    } catch (e: any) {
      message.error(`Không thể vô hiệu hóa: ${e?.message || e}`);
    }
  };

  const Field = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1.5">{label}</div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-[#171826] m-0">
          Quản lý hồ sơ tài khoản
        </h1>
        <p className="text-gray-500 mt-1 mb-0">
          Cập nhật thông tin định danh và theo dõi sức khỏe tài chính.
        </p>
      </div>

      {/* Thẻ tài chính */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FiDollarSign /> Tổng chi tiêu sản xuất
          </div>
          <div className="text-2xl font-extrabold text-[#171826] mt-2">
            {money(totalSpend)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Tính trên {paidOrders.length} đơn hàng thành công
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FiAlertTriangle /> Công nợ tích lũy
          </div>
          <div
            className={`text-2xl font-extrabold mt-2 ${
              debt > 0.005 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {money(debt)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Số tiền cần thanh toán cho xưởng
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FiCreditCard /> Tổng đã thanh toán
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {money(totalPaid)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Lịch sử tín dụng và thanh toán
          </div>
        </div>
      </div>

      {/* Phân rã theo shop */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-[#171826] text-base mt-0 mb-1">
          Phân rã chi tiêu &amp; Công nợ theo Shop
        </h3>
        <p className="text-gray-400 text-sm mt-0 mb-4">
          Theo dõi nhanh chi phí sản xuất tích lũy và trạng thái dư nợ phát sinh
          của từng chi nhánh.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium w-1/4">Cửa hàng</th>
                <th className="py-2 font-medium text-center w-1/4">
                  Đơn trong tháng
                </th>
                <th className="py-2 font-medium text-center w-1/4">
                  Chi tiêu trong tháng
                </th>
                <th className="py-2 font-medium text-right w-1/4">
                  Dư nợ hiện tại
                </th>
              </tr>
            </thead>
            <tbody>
              {shopStats.map((s) => (
                <tr key={s.store.id} className="border-b border-gray-50">
                  <td className="py-2.5 font-medium">🏪 {s.store.name}</td>
                  <td className="py-2.5 text-center">{s.orders} đơn</td>
                  <td className="py-2.5 text-center">{money(s.spendMonth)}</td>
                  <td className="py-2.5 text-right">
                    {s.debt > 0.005 ? (
                      <span className="bg-red-50 text-red-600 font-bold rounded px-2 py-0.5">
                        {money(s.debt)}
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 font-bold rounded px-2 py-0.5">
                        Sạch nợ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!shopStats.length && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    Bạn chưa có cửa hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lịch sử thanh toán */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-[#171826] text-base mt-0 mb-1">
          Lịch sử thanh toán &amp; Khớp nợ
        </h3>
        <p className="text-gray-400 text-sm mt-0 mb-4">
          Các lần chốt kỳ và gạch nợ được Admin xưởng ghi nhận.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium w-1/4">Kỳ thanh toán</th>
                <th className="py-2 font-medium w-1/4">Ngày ghi nhận</th>
                <th className="py-2 font-medium text-center w-1/4">
                  Đơn thành công
                </th>
                <th className="py-2 font-medium text-right w-1/4">
                  Số tiền đã trả
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-2.5">
                    <span className="bg-gray-100 rounded px-2 py-0.5 text-xs">
                      {e.period || "—"}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {e.created ? dayjs(e.created).format("DD/MM/YYYY") : "—"}
                  </td>
                  <td className="py-2.5 text-center">{e.orderCount || 0} đơn</td>
                  <td className="py-2.5 text-right text-emerald-600 font-bold">
                    {money(e.amount)}
                  </td>
                </tr>
              ))}
              {!ledger.length && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    Chưa có dữ liệu lịch sử thanh toán nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thông tin cá nhân + đổi mật khẩu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="flex items-center gap-2 font-bold text-[#171826] text-base mt-0 mb-4">
            <FiUser /> Thông tin cá nhân
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Họ">
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nguyễn"
                />
              </Field>
              <Field label="Tên">
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Văn A"
                />
              </Field>
            </div>
            <Field label="Số điện thoại liên hệ">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
              />
            </Field>
            <Field label="Tên đăng nhập hệ thống">
              <Input value={email} disabled />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="flex items-center gap-2 font-bold text-[#171826] text-base mt-0 mb-4">
            <FiLock /> Đổi mật khẩu bảo mật
          </h3>
          <div className="space-y-3">
            <Field label="Mật khẩu hiện tại">
              <Input.Password
                value={curPass}
                onChange={(e) => setCurPass(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Mật khẩu mới">
              <Input.Password
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Tối thiểu 5 kí tự"
              />
            </Field>
            <Field label="Xác nhận mật khẩu mới">
              <Input.Password
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </Field>
            <div className="text-xs text-gray-400">
              Bỏ trống 3 ô này nếu bạn không muốn đổi mật khẩu.
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          loading={saving}
          onClick={handleSave}
          className="bg-[#171826] rounded-xl px-8 font-semibold"
        >
          Lưu tất cả thay đổi
        </Button>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <h3 className="flex items-center gap-2 font-bold text-red-600 text-base mt-0 mb-1">
          <FiAlertTriangle /> Vùng nguy hiểm (Danger Zone)
        </h3>
        <p className="text-red-500/80 text-sm mt-0 mb-4">
          Khi bạn yêu cầu vô hiệu hóa tài khoản, toàn bộ cửa hàng, dữ liệu đơn và
          cổng import CSV của bạn sẽ bị tạm ngưng hoạt động ngay lập tức.
        </p>
        <Popconfirm
          title="Vô hiệu hóa tài khoản?"
          description="Bạn sẽ bị đăng xuất và tài khoản tạm ngưng hoạt động."
          okText="Vô hiệu hóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={handleDeactivate}
        >
          <Button danger>Đóng &amp; vô hiệu hóa tài khoản</Button>
        </Popconfirm>
      </div>
    </div>
  );
}
