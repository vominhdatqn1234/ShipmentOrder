import { Button, Input, InputNumber, Modal, Select, message } from "antd";
import { produce } from "immer";
import { useEffect, useState } from "react";
import {
  useBaseProducts,
  useDesigns,
  usePodOrderMutations,
  useStores,
} from "../../../hooks/usePod";
import { POD_STATUS, PodOrder, PodOrderItem } from "../../../models/pod";
import { useAccountGuard } from "../../../hooks/useAccountGuard";
import { usePodStore } from "../../../store/usePodStore";
import { toDirectImageUrl } from "../../../utils/imageUrl";
import UploadImgButton from "../../../components/UploadImgButton";

const EMPTY_ITEM: PodOrderItem = {
  productName: "",
  productSku: "",
  sku: "",
  color: "",
  size: "",
  quantity: 1,
  price: 0,
  frontUrl: "",
  backUrl: "",
  mockupUrl: "",
  extraAreas: [],
  note: "",
};

const emptyOrder = (): Partial<PodOrder> => ({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  items: [{ ...EMPTY_ITEM }],
  note: "",
  status: "pending_payment",
  source: "manual",
});

function ImgLinkInput({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-white flex-1 min-w-[180px]">
      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
        {value ? (
          <img
            key={value}
            src={toDirectImageUrl(value)}
            alt={label}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <span className="text-[8px] text-gray-400">Trống</span>
        )}
      </div>
      <div className="flex-1">
        <div className="text-[9px] font-bold tracking-wider" style={{ color }}>
          LINK {label}
        </div>
        <input
          className="border-0 outline-none text-xs w-full text-gray-600"
          placeholder={`Dán link ảnh ${label.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <UploadImgButton size="small" onUploaded={onChange} />
    </div>
  );
}

export default function OrderModal({
  open,
  initial,
  presetSku,
  onClose,
}: {
  open: boolean;
  initial?: PodOrder | null;
  presetSku?: string;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const { products } = useBaseProducts();
  const { designs } = useDesigns();
  const { stores } = useStores();
  const { selectedStoreId } = usePodStore();
  const { add, update } = usePodOrderMutations();
  const { ensureAccount } = useAccountGuard();
  const [order, setOrder] = useState<Partial<PodOrder>>(emptyOrder());

  useEffect(() => {
    if (!open) return;
    if (initial) setOrder(JSON.parse(JSON.stringify(initial)));
    else {
      const o = emptyOrder();
      if (presetSku && o.items) o.items[0].productSku = presetSku;
      setOrder(o);
    }
  }, [open, initial, presetSku]);

  // Bọc recipe để immer bỏ qua giá trị trả về của fn (tránh lỗi
  // "returned a new value and modified its draft" khi fn là biểu thức gán)
  const set = (fn: (draft: any) => void) =>
    setOrder((prev) =>
      produce(prev, (d) => {
        fn(d);
      })
    );

  const applyDesignSku = (idx: number, sku: string) => {
    set((d) => {
      d.items[idx].sku = sku;
      const design = designs.find(
        (x) => x.sku.toLowerCase() === sku.toLowerCase()
      );
      if (design) {
        d.items[idx].frontUrl = design.frontUrl;
        d.items[idx].backUrl = design.backUrl;
        d.items[idx].mockupUrl = design.mockupUrl;
        d.items[idx].extraAreas = design.extraAreas || [];
      }
    });
  };

  const handleSubmit = async () => {
    if (!order.customerName?.trim())
      return message.error("Vui lòng nhập tên khách hàng");
    if (!order.address1 || !order.city || !order.state || !order.zip)
      return message.error("Vui lòng nhập đủ địa chỉ giao hàng");
    if (!order.items?.length || order.items.some((i) => !i.productSku))
      return message.error("Vui lòng chọn loại sản phẩm (phôi) cho mỗi món");

    // Tài khoản bị admin xóa/vô hiệu hóa -> tự đăng xuất, không cho tạo đơn
    if (!(await ensureAccount())) return;

    const store = stores.find((s) => s.id === selectedStoreId);
    const total = (order.items || []).reduce(
      (s, i) => s + (i.price || 0) * (i.quantity || 1),
      0
    );
    const payload: any = {
      ...order,
      total,
      storeId: selectedStoreId,
      storeName: store?.name || "",
    };
    if (isEdit && initial) {
      await update.mutateAsync({ id: initial.id, ...payload });
      message.success("Đã lưu thay đổi đơn hàng");
    } else {
      payload.orderCode = String(Math.floor(4e9 + Math.random() * 1e9));
      payload.created = new Date().toISOString();
      await add.mutateAsync(payload);
      message.success("Đã tạo đơn hàng mới");
    }
    onClose();
  };

  const st = initial ? POD_STATUS[initial.status] : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={980}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>{isEdit ? "Hủy bỏ" : "Hủy"}</Button>
          <Button
            type="primary"
            loading={add.isLoading || update.isLoading}
            onClick={handleSubmit}
            className={isEdit ? "bg-[#C6A15B]" : ""}
          >
            {isEdit ? "Lưu thay đổi" : "Xác nhận lên đơn"}
          </Button>
        </div>
      }
      title={
        <div className="flex items-center gap-3">
          <span>{isEdit ? "Cập nhật đơn hàng" : "Tạo đơn hàng mới"}</span>
          {st && (
            <span
              className="text-[10px] font-bold tracking-wider px-2 py-1 rounded"
              style={{ color: st.color, background: st.bg }}
            >
              {st.label}
            </span>
          )}
          {isEdit && (
            <span className="text-xs text-gray-400 font-normal">
              Mã hệ thống:{" "}
              <b className="text-[#171826]">{initial?.orderCode}</b>
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
        {/* Khách hàng + giao hàng */}
        <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-xl p-4">
          <div className="space-y-3">
            <div className="text-xs font-bold tracking-widest text-gray-600">
              ● THÔNG TIN LIÊN HỆ
            </div>
            <Input
              placeholder="Họ và tên khách hàng *"
              value={order.customerName}
              onChange={(e) => set((d) => (d.customerName = e.target.value))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Email"
                value={order.customerEmail}
                onChange={(e) =>
                  set((d) => (d.customerEmail = e.target.value))
                }
              />
              <Input
                placeholder="Số điện thoại"
                value={order.customerPhone}
                onChange={(e) =>
                  set((d) => (d.customerPhone = e.target.value))
                }
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-bold tracking-widest text-gray-600">
              ● GIAO HÀNG
            </div>
            <Input
              placeholder="Địa chỉ 1 *"
              value={order.address1}
              onChange={(e) => set((d) => (d.address1 = e.target.value))}
            />
            <Input
              placeholder="Địa chỉ 2"
              value={order.address2}
              onChange={(e) => set((d) => (d.address2 = e.target.value))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Thành phố *"
                value={order.city}
                onChange={(e) => set((d) => (d.city = e.target.value))}
              />
              <Input
                placeholder="Bang/Vùng *"
                value={order.state}
                onChange={(e) => set((d) => (d.state = e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Mã Zip *"
                value={order.zip}
                onChange={(e) => set((d) => (d.zip = e.target.value))}
              />
              <Input
                placeholder="Quốc gia"
                value={order.country}
                onChange={(e) => set((d) => (d.country = e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold tracking-widest text-gray-600">
            ● SẢN PHẨM TRONG ĐƠN ({order.items?.length || 0})
          </div>
          <Button
            size="small"
            onClick={() => set((d) => d.items.push({ ...EMPTY_ITEM }))}
          >
            + Thêm sản phẩm
          </Button>
        </div>

        {(order.items || []).map((item, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-xl p-4 space-y-4 relative"
          >
            <div className="flex items-center justify-between">
              <span className="bg-[#171826] text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded">
                MÓN #{idx + 1}
              </span>
              {(order.items?.length || 0) > 1 && (
                <button
                  onClick={() => set((d) => d.items.splice(idx, 1))}
                  className="text-red-500 text-xs bg-transparent border-0 cursor-pointer"
                >
                  Xóa món
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">
                  LOẠI SẢN PHẨM (PHÔI) *
                </div>
                <Select
                  showSearch
                  className="w-full"
                  placeholder="Chọn sản phẩm..."
                  value={item.productSku || undefined}
                  onChange={(v) =>
                    set((d) => {
                      d.items[idx].productSku = v;
                      const p = products.find((x) => x.sku === v);
                      if (p && !d.items[idx].productName)
                        d.items[idx].productName = p.name;
                    })
                  }
                  options={products.map((p) => ({
                    value: p.sku,
                    label: `${p.name} (${p.sku})`,
                  }))}
                />
              </div>
              <div className="col-span-3">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">
                  MÀU (TÙY CHỌN)
                </div>
                <Select
                  className="w-full"
                  placeholder="-- Không chọn --"
                  allowClear
                  value={item.color || undefined}
                  onChange={(v) => set((d) => (d.items[idx].color = v || ""))}
                  options={Array.from(
                    new Set([
                      ...(products.find((p) => p.sku === item.productSku)
                        ?.colors || []),
                      ...(item.color ? [item.color] : []),
                    ])
                  ).map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div className="col-span-2">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">
                  SIZE (TÙY CHỌN)
                </div>
                <Select
                  className="w-full"
                  placeholder="-- Không chọn --"
                  allowClear
                  value={item.size || undefined}
                  onChange={(v) => set((d) => (d.items[idx].size = v || ""))}
                  options={Array.from(
                    new Set([
                      ...(products.find((p) => p.sku === item.productSku)
                        ?.sizes || []),
                      ...(item.size ? [item.size] : []),
                    ])
                  ).map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div className="col-span-1">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">
                  SL *
                </div>
                <InputNumber
                  min={1}
                  className="w-full"
                  value={item.quantity}
                  onChange={(v) => set((d) => (d.items[idx].quantity = v || 1))}
                />
              </div>
              <div className="col-span-1">
                <div className="text-[10px] tracking-widest text-gray-500 mb-1">
                  GIÁ $
                </div>
                <InputNumber
                  min={0}
                  className="w-full"
                  value={item.price}
                  onChange={(v) => set((d) => (d.items[idx].price = v || 0))}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-[250px]">
                  <div className="text-[10px] tracking-widest text-gray-500 mb-1">
                    MÃ SKU (ĐỒNG BỘ THƯ VIỆN)
                  </div>
                  <Select
                    showSearch
                    allowClear
                    className="w-full"
                    placeholder="Nhập mã mới hoặc tìm SKU có sẵn..."
                    value={item.sku || undefined}
                    onChange={(v) => applyDesignSku(idx, v || "")}
                    options={designs.map((x) => ({
                      value: x.sku,
                      label: x.sku,
                    }))}
                  />
                </div>
                <ImgLinkInput
                  label="FRONT"
                  color="#3B82F6"
                  value={item.frontUrl}
                  onChange={(v) => set((d) => (d.items[idx].frontUrl = v))}
                />
                <ImgLinkInput
                  label="BACK"
                  color="#8B5CF6"
                  value={item.backUrl}
                  onChange={(v) => set((d) => (d.items[idx].backUrl = v))}
                />
                <ImgLinkInput
                  label="MOCKUP"
                  color="#059669"
                  value={item.mockupUrl}
                  onChange={(v) => set((d) => (d.items[idx].mockupUrl = v))}
                />
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <span className="text-[10px] tracking-widest text-gray-500">
                  CÁC VÙNG IN PHỤ (TAY ÁO, CỔ...):{" "}
                  {item.extraAreas?.length
                    ? item.extraAreas.map((a) => a.name).join(", ")
                    : "Không có"}
                </span>
                <button
                  onClick={() =>
                    set((d) =>
                      d.items[idx].extraAreas.push({ name: "Vùng in", url: "" })
                    )
                  }
                  className="text-xs text-[#8B5CF6] bg-[#F3EBFF] rounded-lg px-2 py-1 border-0 cursor-pointer"
                >
                  + Thêm vùng in
                </button>
              </div>
              {item.personalization ? (
                <div className="text-xs text-gray-500">
                  Personalization:{" "}
                  <b className="text-[#171826]">{item.personalization}</b>
                </div>
              ) : null}
              <Input
                placeholder="Ghi chú riêng cho sản phẩm này"
                value={item.note}
                onChange={(e) => set((d) => (d.items[idx].note = e.target.value))}
              />
            </div>
          </div>
        ))}

        {/* Ghi chú */}
        <div>
          <div className="text-xs font-bold tracking-widest text-gray-600 mb-2">
            ● GHI CHÚ GỬI XƯỞNG
          </div>
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú về đóng gói, ship hàng..."
            value={order.note}
            onChange={(e) => set((d) => (d.note = e.target.value))}
          />
        </div>
      </div>
    </Modal>
  );
}
