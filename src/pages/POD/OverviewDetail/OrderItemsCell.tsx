import { Popover } from "antd";
import { useState } from "react";
import {
  PodOrder,
  PodOrderItem,
  SPECIAL_PRINT_AREA_LABEL,
  splitSizeFromColor,
} from "../../../models/pod";
import { imageUrlCandidates } from "../../../utils/imageUrl";

/**
 * Các ô chỉ-đọc dùng cho danh sách đơn ở trang Chi tiết chỉ số:
 *  - ItemsDetail  : CHI TIẾT SẢN PHẨM & THIẾT KẾ (bản gốc khách up + phôi
 *                   fulfill + thumbnail FRONT/BACK/MOCKUP, hover xem lớn)
 *  - PrintAreaCell: VÙNG IN của từng sản phẩm
 */

/** Dữ liệu từ DB (jsonb) đôi khi là null/chuỗi — luôn ép về mảng cho an toàn */
function asArray<T>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Danh sách sản phẩm của 1 đơn, luôn trả về mảng hợp lệ */
export function orderItems(order: PodOrder): PodOrderItem[] {
  return asArray<PodOrderItem>(order?.items).filter(
    (it) => it && typeof it === "object"
  );
}

/** Thumbnail thiết kế, hover để xem ảnh lớn (chỉ xem, không sửa) */
export function Thumb({ url, tag }: { url: string; tag: string }) {
  const [idx, setIdx] = useState(0);
  const candidates = imageUrlCandidates(String(url || ""));
  const img =
    url && idx < candidates.length ? (
      <img
        key={candidates[idx]}
        src={candidates[idx]}
        alt={tag}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain rounded-[3px]"
        onError={() => setIdx((i) => i + 1)}
      />
    ) : null;
  const box = (
    <div
      className={`w-[46px] h-[46px] shrink-0 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center overflow-hidden ${
        img ? "cursor-zoom-in" : ""
      }`}
    >
      {img || (
        <span className="text-[7px] font-bold tracking-wider text-gray-300">
          {tag}
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
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      }
    >
      {box}
    </Popover>
  );
}

/** Bản gốc khách up: Type · Color · Size (tách size nếu dính trong color) */
export function origLabel(it: PodOrderItem): string {
  const type = it.origType ?? it.productSku ?? it.sku ?? "";
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

/** Phôi fulfill: 2x GILDAN-5000 (Black - XL) */
function fulfillLabel(it: PodOrderItem): string {
  const variant = [it.color, it.size].filter(Boolean).join(" - ");
  return `${it.quantity || 1}x ${it.productSku || it.sku || "—"}${
    variant ? ` (${variant})` : ""
  }`;
}

export function ItemsDetail({
  order,
  compact,
}: {
  order: PodOrder;
  compact?: boolean;
}) {
  const items = orderItems(order);
  if (!items.length)
    return <span className="text-gray-300 text-xs">Chưa có sản phẩm</span>;
  return (
    <div className="space-y-2">
      {items.map((it, idx) => {
        const thumbs: { url?: string; tag: string }[] = [
          { url: it.frontUrl, tag: "FRONT" },
          { url: it.backUrl, tag: "BACK" },
          { url: it.mockupUrl, tag: "MOCKUP" },
          ...asArray<{ name?: string; url?: string }>(it.extraAreas).map(
            (e) => ({
              url: e?.url,
              tag: String(e?.name || "EXTRA").toUpperCase(),
            })
          ),
        ].filter((t) => String(t.url || "").trim());
        return (
          <div
            key={idx}
            className={`${
              compact ? "" : "border border-gray-100 rounded-lg p-2"
            } ${idx ? "pt-2 border-t border-gray-50" : ""}`}
          >
            {items.length > 1 && (
              <div className="text-[9px] font-bold text-gray-400 mb-0.5">
                SP{idx + 1}
              </div>
            )}
            {/* Bản GỐC khách up (ô vàng) */}
            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-700 rounded px-2 py-0.5 text-[11px] font-semibold">
              {origLabel(it) || "—"}
            </div>
            {/* Phôi fulfill thực tế */}
            <div className="text-xs text-gray-600 mt-1">
              Fulfill: <b className="text-[#171826]">{fulfillLabel(it)}</b>
            </div>
            {/* Thiết kế */}
            {thumbs.length ? (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {thumbs.map((t, i) => (
                  <Thumb key={i} url={t.url as string} tag={t.tag} />
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 italic mt-1">
                Chưa có file thiết kế
              </div>
            )}
            {it.personalization && (
              <div className="text-[11px] text-gray-500 mt-1">
                Personalization: {it.personalization}
              </div>
            )}
            {it.note && (
              <div className="text-[11px] text-gray-500 mt-0.5">
                Ghi chú: {it.note}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PrintAreaCell({ order }: { order: PodOrder }) {
  const items = orderItems(order);
  if (!items.length) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div key={idx}>
          {items.length > 1 && (
            <div className="text-[9px] font-bold text-gray-400 mb-0.5">
              SP{idx + 1}
            </div>
          )}
          {it.printArea === "special" ? (
            <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-[#FFF1E7] text-[#C2410C] whitespace-nowrap">
              {SPECIAL_PRINT_AREA_LABEL}
            </span>
          ) : (
            <span className="inline-block rounded px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500">
              Mặc định
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
