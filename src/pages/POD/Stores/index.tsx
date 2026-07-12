import { Button, Input, Modal, Popconfirm, message } from "antd";
import { useState } from "react";
import UploadImgButton from "../../../components/UploadImgButton";
import { useStoreMutations, useStores } from "../../../hooks/usePod";
import { PodStore } from "../../../models/pod";

function genCode() {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  return (
    "01" +
    Array.from({ length: 24 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("")
  );
}

export default function Stores() {
  const { stores } = useStores();
  const { add, update, remove } = useStoreMutations();
  const [editing, setEditing] = useState<PodStore | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [taxCode, setTaxCode] = useState("");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setLogo("");
    setTaxCode("");
    setModalOpen(true);
  };
  const openEdit = (s: PodStore) => {
    setEditing(s);
    setName(s.name);
    setLogo(s.logo || "");
    setTaxCode(s.taxCode || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return message.error("Vui lòng nhập tên hiển thị");
    const payload = {
      name: name.trim(),
      logo: logo.trim(),
      taxCode: taxCode.trim(),
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
      message.success("Đã lưu thiết lập cửa hàng");
    } else {
      await add.mutateAsync({
        ...payload,
        systemCode: genCode(),
        status: "active",
        created: new Date().toISOString(),
      } as any);
      message.success("Đã kết nối store mới");
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171826] m-0">
            Quản lý Cửa hàng (Stores)
          </h1>
          <p className="text-gray-500 m-0 mt-1">
            Quản lý danh sách, trạng thái và cài đặt của các điểm bán hàng.
          </p>
        </div>
        <Button
          type="primary"
          className="bg-[#C6A15B] border-0 font-bold h-[42px]"
          onClick={openCreate}
        >
          + Kết nối Store mới
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[11px] tracking-widest text-gray-500 border-b border-gray-100">
              <th className="p-4">LOGO</th>
              <th className="p-4">TÊN CỬA HÀNG</th>
              <th className="p-4">MÃ HỆ THỐNG (ID)</th>
              <th className="p-4">TRẠNG THÁI</th>
              <th className="p-4 text-right">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-gray-50">
                <td className="p-4">
                  {s.logo ? (
                    <img
                      src={s.logo}
                      alt={s.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center font-bold">
                      {s.name?.charAt(0)}
                    </div>
                  )}
                </td>
                <td className="p-4 font-extrabold text-[#171826]">{s.name}</td>
                <td className="p-4 text-gray-400 font-mono text-xs">
                  {s.systemCode}
                </td>
                <td className="p-4">
                  <span
                    className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded ${
                      s.status === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {s.status === "active" ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KHÓA"}
                  </span>
                </td>
                <td className="p-4 text-right space-x-3 whitespace-nowrap">
                  <button
                    onClick={() => openEdit(s)}
                    className="text-[#2563EB] bg-transparent border-0 cursor-pointer font-medium"
                  >
                    Thiết lập
                  </button>
                  <Popconfirm
                    title={
                      s.status === "active"
                        ? `Khóa cửa hàng "${s.name}"?`
                        : `Mở khóa cửa hàng "${s.name}"?`
                    }
                    description={
                      s.status === "active"
                        ? "Cửa hàng bị khóa sẽ ngừng hoạt động cho đến khi mở lại."
                        : "Cửa hàng sẽ hoạt động trở lại."
                    }
                    okText={s.status === "active" ? "Khóa" : "Mở khóa"}
                    cancelText="Hủy"
                    okButtonProps={
                      s.status === "active" ? { danger: true } : undefined
                    }
                    onConfirm={() =>
                      update.mutate({
                        id: s.id,
                        status: s.status === "active" ? "locked" : "active",
                      } as any)
                    }
                  >
                    <button className="text-amber-600 bg-transparent border-0 cursor-pointer font-medium">
                      {s.status === "active" ? "Khóa" : "Mở khóa"}
                    </button>
                  </Popconfirm>
                  <Popconfirm
                    title={`Xóa cửa hàng "${s.name}"?`}
                    description="Hành động này không thể hoàn tác."
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => remove.mutate(s.id)}
                  >
                    <button className="text-red-500 bg-transparent border-0 cursor-pointer font-medium">
                      Xóa
                    </button>
                  </Popconfirm>
                </td>
              </tr>
            ))}
            {!stores.length && (
              <tr>
                <td colSpan={5} className="p-16 text-center text-gray-400">
                  Chưa có cửa hàng — bấm "Kết nối Store mới"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        width={560}
        title={
          <span className="text-xl font-extrabold text-[#171826]">
            {editing ? "Thiết lập Cửa hàng" : "Kết nối Store mới"}
          </span>
        }
        onCancel={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end items-center gap-6 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="text-gray-500 text-base font-bold bg-transparent border-0 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <Button
              type="primary"
              loading={add.isLoading || update.isLoading}
              onClick={handleSave}
              className="bg-[#C6A15B] border-0 h-[48px] px-7 rounded-xl font-bold text-base"
            >
              Lưu thiết lập
            </Button>
          </div>
        }
      >
        <div className="space-y-5 pt-2">
          <div>
            <div className="text-[12px] font-bold tracking-widest text-gray-500 mb-2">
              TÊN HIỂN THỊ <span className="text-red-500">*</span>
            </div>
            <input
              className="w-full h-[52px] rounded-xl border border-gray-200 px-4 text-[15px] outline-none placeholder:text-gray-300 box-border focus:border-[#C6A15B]"
              placeholder="Tên cửa hàng"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[12px] font-bold tracking-widest text-gray-500 mb-2">
              LINK LOGO (URL)
            </div>
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 h-[52px] rounded-xl border border-gray-200 px-4 text-[15px] outline-none placeholder:text-gray-300 box-border focus:border-[#C6A15B]"
                placeholder="https://... (nhập link hoặc bấm Upload)"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
              />
              <UploadImgButton onUploaded={setLogo} />
              {logo.trim() && (
                <img
                  src={logo}
                  alt="logo"
                  referrerPolicy="no-referrer"
                  className="w-[52px] h-[52px] rounded-xl object-cover border border-gray-200 shrink-0"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              )}
            </div>
            <div className="text-gray-400 text-[13px] mt-1.5">
              Dùng để in lên packing slip (hóa đơn vận chuyển) nếu có.
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold tracking-widest text-gray-500 mb-2">
              MÃ SỐ THUẾ / IOSS / VAT
            </div>
            <input
              className="w-full h-[52px] rounded-xl border border-gray-200 px-4 text-[15px] outline-none placeholder:text-gray-300 box-border focus:border-[#C6A15B]"
              placeholder="Vd: IM2760000742"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
