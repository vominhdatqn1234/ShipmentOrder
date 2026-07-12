import { AutoComplete, InputNumber, Popover, Select, message } from "antd";
import { memo, useEffect, useRef, useState } from "react";
import { FiDownload } from "react-icons/fi";
import {
  useBaseProducts,
  useDesignMutations,
  useDesigns,
} from "../../../hooks/usePod";
import { PodOrder, PodOrderItem } from "../../../models/pod";
import { imageUrlCandidates } from "../../../utils/imageUrl";


function Thumb({
  url,
  tag,
  small,
}: {
  url: string;
  tag: string;
  small?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const candidates = imageUrlCandidates(url);
  const img =
    url && idx < candidates.length ? (
      <img
        key={candidates[idx]}
        src={candidates[idx]}
        alt={tag}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain"
        onError={() => setIdx((i) => i + 1)}
      />
    ) : null;
  const box = (
    <div
      className={`${
        small ? "w-[34px] h-[34px]" : "w-[52px] h-[52px]"
      } shrink-0 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center overflow-hidden ${
        img ? "cursor-zoom-in" : ""
      }`}
    >
      {img || (
        <span className="text-[7px] font-bold text-gray-300 tracking-wider">
          {small ? "—" : tag}
        </span>
      )}
    </div>
  );
  if (!img) return box;
  return (
    <Popover
      title={tag}
      content={
        <div className="w-[280px] h-[280px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
          <img
            src={candidates[idx]}
            alt={tag}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      }
    >
      {box}
    </Popover>
  );
}

/** 1 hàng gọn: thumbnail (hover xem lớn) + nhãn màu + ô dán link */
function ThumbLink({
  label,
  color,
  value,
  onCommit,
}: {
  label: string;
  color: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1.5 bg-white">
      <Thumb url={value} tag={label} small />
      <div className="flex-1 min-w-0">
        <div
          className="text-[9px] font-bold tracking-wider leading-none mb-0.5"
          style={{ color }}
        >
          {label}
        </div>
        <input
          key={value}
          defaultValue={value}
          placeholder="Dán link..."
          className="border-0 outline-none text-[11px] w-full text-gray-600 bg-transparent p-0"
          onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
        />
      </div>
    </div>
  );
}

function OrderItemEditor({
  order,
  index,
  onPatchItem,
}: {
  order: PodOrder;
  index: number;
  onPatchItem: (patch: Partial<PodOrderItem>) => void;
}) {
  const item = order.items[index];
  const { products } = useBaseProducts();
  const { designs } = useDesigns();
  const { add: addDesign, update: updateDesign } = useDesignMutations();
  const product = products.find((p) => p.sku === item.productSku);

  // Tự đồng bộ từ thư viện — không cần bấm nút:
  // - Khi SKU vừa đổi sang mã CÓ trong thư viện → đồng bộ đầy đủ FRONT/BACK/MOCKUP
  // - Lần đầu (mở đơn cũ) → chỉ điền link còn trống, không ghi đè link đã có
  const lastSyncedSku = useRef<string | null>(null);
  useEffect(() => {
    const sku = item.sku?.trim();
    if (!sku || !designs.length) return;
    const d = designs.find((x) => x.sku.toLowerCase() === sku.toLowerCase());
    if (!d) return;
    const skuChanged =
      lastSyncedSku.current !== null &&
      lastSyncedSku.current.toLowerCase() !== sku.toLowerCase();
    lastSyncedSku.current = sku;
    if (skuChanged) {
      onPatchItem({
        frontUrl: d.frontUrl,
        backUrl: d.backUrl,
        mockupUrl: d.mockupUrl,
      });
    } else {
      const patch: Partial<PodOrderItem> = {};
      if (!item.frontUrl && d.frontUrl) patch.frontUrl = d.frontUrl;
      if (!item.backUrl && d.backUrl) patch.backUrl = d.backUrl;
      if (!item.mockupUrl && d.mockupUrl) patch.mockupUrl = d.mockupUrl;
      if (Object.keys(patch).length) onPatchItem(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.sku, item.frontUrl, item.backUrl, item.mockupUrl, designs.length]);

  const applyDesign = (sku: string) => {
    const d = designs.find((x) => x.sku.toLowerCase() === sku.toLowerCase());
    if (d) {
      onPatchItem({
        sku,
        frontUrl: d.frontUrl,
        backUrl: d.backUrl,
        mockupUrl: d.mockupUrl,
      });
      message.success(`Đã đồng bộ thiết kế "${sku}" từ thư viện`);
    } else {
      onPatchItem({ sku });
    }
  };

  const saveToLibrary = async () => {
    if (!item.sku?.trim())
      return message.error("Nhập mã SKU trước khi lưu vào thư viện");
    const existing = designs.find(
      (d) => d.sku.toLowerCase() === item.sku.toLowerCase()
    );
    // Merge: món thiếu link nào thì GIỮ link cũ trong thư viện, không ghi đè rỗng
    const urls = {
      frontUrl: item.frontUrl || existing?.frontUrl || "",
      backUrl: item.backUrl || existing?.backUrl || "",
      mockupUrl: item.mockupUrl || existing?.mockupUrl || "",
    };
    if (existing) {
      await updateDesign.mutateAsync({ id: existing.id, ...urls });
      message.success(`Đã cập nhật SKU "${item.sku}" trong thư viện`);
    } else {
      await addDesign.mutateAsync({
        sku: item.sku.trim(),
        ...urls,
        extraAreas: [],
        testBg: "#FFFFFF",
        created: new Date().toISOString(),
      } as any);
      message.success(`Đã lưu SKU "${item.sku}" vào thư viện`);
    }
  };

  const variation = [
    item.size,
    item.personalization ? `Personalization:${item.personalization}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex gap-4 items-start bg-white border border-gray-200 rounded-xl p-3 min-w-[560px]">
      {/* Cột trái: SKU + thiết kế */}
      <div className="w-[200px] shrink-0 space-y-2 border-r border-gray-100 pr-4">
        <AutoComplete
          className="w-full"
          value={item.sku}
          placeholder="Mã SKU..."
          options={designs.map((d) => ({ value: d.sku }))}
          filterOption={(input, opt) =>
            String(opt?.value || "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          onSelect={(v) => applyDesign(String(v))}
          onChange={(v) => onPatchItem({ sku: String(v || "") })}
        />
        <div className="flex gap-1.5">
          <button
            onClick={saveToLibrary}
            className="flex-1 flex items-center justify-center gap-1.5 text-[#2563EB] bg-[#EFF4FF] border border-[#D6E4FF] rounded-lg py-1.5 text-xs font-bold cursor-pointer hover:bg-[#E0EBFF]"
          >
            <FiDownload size={12} /> Lưu vào Thư viện
          </button>
        </div>
        {/* Mỗi hàng = thumbnail + link, gọn chiều cao */}
        <div className="space-y-1.5">
          <ThumbLink
            label="FRONT"
            color="#3B82F6"
            value={item.frontUrl}
            onCommit={(v) => onPatchItem({ frontUrl: v })}
          />
          <ThumbLink
            label="BACK"
            color="#8B5CF6"
            value={item.backUrl}
            onCommit={(v) => onPatchItem({ backUrl: v })}
          />
          <ThumbLink
            label="MOCKUP"
            color="#059669"
            value={item.mockupUrl}
            onCommit={(v) => onPatchItem({ mockupUrl: v })}
          />
        </div>
      </div>

      {/* Cột phải: phôi + biến thể */}
      <div className="flex-1 min-w-0 space-y-2">
        {variation && (
          <div className="flex items-center gap-2 bg-[#FFF9E6] border border-[#F3E2A9] text-[#B7791F] rounded-lg px-3 py-1.5 text-xs font-bold">
            <span className="shrink-0">ⓘ</span>
            <span className="truncate" title={variation}>
              {variation}
            </span>
          </div>
        )}
        <Select
          showSearch
          className="w-full"
          placeholder="Chọn phôi..."
          value={item.productSku || undefined}
          onChange={(v) => {
            const p = products.find((x) => x.sku === v);
            onPatchItem({
              productSku: v,
              productName: item.productName || p?.name || "",
            });
          }}
          options={products.map((p) => ({
            value: p.sku,
            label: `${p.name} (${p.sku})`,
          }))}
          filterOption={(input, opt) =>
            String(opt?.label || "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
        <div className="flex gap-2">
          {/* Màu/Size theo phôi trong Kho Phôi POD; giá trị hiện tại (từ Etsy)
              vẫn giữ trong danh sách để xem/đổi qua lại được */}
          <Select
            className="flex-1 min-w-0"
            placeholder="Chọn Màu"
            allowClear
            showSearch
            value={item.color || undefined}
            onChange={(v) => onPatchItem({ color: v || "" })}
            options={Array.from(
              new Set([
                ...(product?.colors || []),
                ...(item.color ? [item.color] : []),
              ])
            ).map((c) => ({ value: c, label: c }))}
          />
          <Select
            className="flex-1 min-w-0"
            placeholder="Chọn Size"
            allowClear
            showSearch
            value={item.size || undefined}
            onChange={(v) => onPatchItem({ size: v || "" })}
            options={Array.from(
              new Set([
                ...(product?.sizes || []),
                ...(item.size ? [item.size] : []),
              ])
            ).map((s) => ({ value: s, label: s }))}
          />
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 bg-gray-50 shrink-0">
            <span className="text-[10px] font-bold text-gray-400">SL</span>
            <InputNumber
              min={1}
              size="small"
              bordered={false}
              className="w-[52px] bg-transparent"
              value={item.quantity}
              onChange={(v) => onPatchItem({ quantity: v || 1 })}
            />
          </div>
        </div>
        <input
          key={item.note}
          defaultValue={item.note}
          placeholder="🖊 Ghi chú riêng cho sản phẩm này..."
          className="w-full box-border border border-[#F3E2A9] bg-[#FFFDF5] rounded-lg px-3 py-2 text-xs outline-none text-gray-600"
          onBlur={(e) =>
            e.target.value !== item.note && onPatchItem({ note: e.target.value })
          }
        />
      </div>
    </div>
  );
}

// Memo: chỉ re-render khi đơn/hàng thay đổi — tránh giật khi danh sách dài
export default memo(
  OrderItemEditor,
  (prev, next) =>
    prev.order === next.order &&
    prev.index === next.index
);
