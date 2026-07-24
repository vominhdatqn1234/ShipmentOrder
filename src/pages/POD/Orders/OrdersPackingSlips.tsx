import dayjs from "dayjs";
import { forwardRef } from "react";
import {
  POD_STATUS,
  PodOrder,
  PodOrderItem,
  splitSizeFromColor,
} from "../../../models/pod";

/** Bản gốc khách up: Type · Color · Size (tách size nếu bị dính trong color) */
function origLabel(it: PodOrderItem): string {
  const type = it.origType ?? it.productSku ?? "";
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

function fulfillLabel(it: PodOrderItem): string {
  const parts = [it.color, it.size].filter(Boolean).join(" - ");
  return `${it.quantity || 1}x ${it.productSku || "—"}${
    parts ? ` (${parts})` : ""
  }`;
}

/**
 * Phiếu in cho từng đơn (packing slip). Dùng với react-to-print → Save as PDF.
 * Render trong div ẩn; react-to-print sẽ clone nội dung này ra để in.
 */
const OrdersPackingSlips = forwardRef<
  HTMLDivElement,
  { orders: PodOrder[]; storeName?: string }
>(({ orders }, ref) => {
  return (
    <div ref={ref}>
      <style>{`
        @page { size: A4; margin: 14mm; }
        .slip { page-break-after: always; font-family: Arial, Helvetica, sans-serif; color: #111827; }
        .slip:last-child { page-break-after: auto; }
        .slip h2 { font-size: 18px; margin: 0; }
        .slip table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .slip th, .slip td { border: 1px solid #D1D5DB; padding: 6px 8px; font-size: 12px; text-align: left; vertical-align: top; }
        .slip th { background: #F3F4F6; }
        .muted { color: #6B7280; }
      `}</style>

      {orders.map((o) => (
        <div className="slip" key={o.id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #111827",
              paddingBottom: 8,
            }}
          >
            <div>
              <h2>Đơn #{o.orderCode}</h2>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {o.storeName || ""} ·{" "}
                {dayjs(o.created).format("DD/MM/YYYY")}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12 }}>
              <div style={{ fontWeight: 700 }}>
                {POD_STATUS[o.status]?.label || o.status}
              </div>
              {o.tracking && <div className="muted">Tracking: {o.tracking}</div>}
            </div>
          </div>

          {/* Khách hàng */}
          <div style={{ marginTop: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              Khách hàng
            </div>
            <div>{o.customerName || "—"}</div>
            <div className="muted">
              {[o.address1, o.address2].filter(Boolean).join(", ")}
            </div>
            <div className="muted">
              {[o.city, o.state, o.zip].filter(Boolean).join(", ")}
              {o.country ? ` · ${o.country}` : ""}
            </div>
            <div className="muted">
              {[
                o.customerPhone && `ĐT: ${o.customerPhone}`,
                o.customerEmail && `Email: ${o.customerEmail}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>

          {/* Sản phẩm */}
          <table>
            <thead>
              <tr>
                <th style={{ width: 24 }}>#</th>
                <th>Sản phẩm gốc (khách chọn)</th>
                <th>Phôi Fulfill</th>
                <th style={{ width: 40 }}>SL</th>
                <th>Thiết kế</th>
              </tr>
            </thead>
            <tbody>
              {(o.items || []).map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{origLabel(it) || "—"}</td>
                  <td>{fulfillLabel(it)}</td>
                  <td>{it.quantity || 1}</td>
                  <td style={{ wordBreak: "break-all", fontSize: 10 }}>
                    {[
                      it.frontUrl && `FRONT: ${it.frontUrl}`,
                      it.backUrl && `BACK: ${it.backUrl}`,
                      it.mockupUrl && `MOCKUP: ${it.mockupUrl}`,
                    ]
                      .filter(Boolean)
                      .map((line, k) => (
                        <div key={k}>{line}</div>
                      ))}
                    {it.personalization && (
                      <div>Personalization: {it.personalization}</div>
                    )}
                    {it.note && <div>Ghi chú: {it.note}</div>}
                  </td>
                </tr>
              ))}
              {!o.items?.length && (
                <tr>
                  <td colSpan={5} className="muted">
                    Không có sản phẩm
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {o.note && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <b>Ghi chú đơn:</b> {o.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

OrdersPackingSlips.displayName = "OrdersPackingSlips";
export default OrdersPackingSlips;
