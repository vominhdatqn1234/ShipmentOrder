/**
 * Import đơn hàng từ LINK Google Sheets.
 *
 * Luồng 3 bước:
 *   1. Dán link sheet  -> tải dữ liệu về (đọc bằng endpoint gviz -> CSV)
 *   2. Ghép cột (Match fields): mỗi field của hệ thống chọn 1 cột trong file,
 *      hệ thống tự đoán sẵn theo tên cột.
 *   3. Bảng dữ liệu sửa được từng ô -> bấm gửi. Mỗi dòng = 1 sản phẩm,
 *      các dòng cùng "Mã đơn" được gộp thành 1 đơn.
 *
 * Bấm Import -> đơn được đưa vào bảng PREVIEW của tab Import (giống luồng CSV),
 * kiểm tra xong bấm "Đồng bộ lên Web" để ghi lên hệ thống.
 */
import { Button, Input, InputNumber, Modal, Select, message } from "antd";
import { useCallback, useMemo, useState } from "react";
import {
  FiDownloadCloud,
  FiEdit3,
  FiPlus,
  FiUploadCloud,
} from "react-icons/fi";
import { parseCSV } from "../../../utils/csvPod";
import ExcelGrid from "./ExcelGrid";
import {
  Design,
  PodVariant,
  findVariantForItem,
  makeBlankName,
  variantUnitPrice,
} from "../../../models/pod";
import { useBaseProducts } from "../../../hooks/usePod";

/* ------------------------------- Field map ------------------------------- */

type FieldKey =
  | "storeName"
  | "orderCode"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "address1"
  | "address2"
  | "city"
  | "state"
  | "zip"
  | "country"
  | "orderNote"
  | "variantId"
  | "productSku"
  | "color"
  | "size"
  | "quantity"
  | "price"
  | "designSku"
  | "frontUrl"
  | "backUrl"
  | "mockupUrl"
  | "printArea"
  | "extraLeft"
  | "extraRight"
  | "extraNeck"
  | "extraHood"
  | "extraPocket"
  | "itemNote";

interface FieldDef {
  key: FieldKey;
  label: string;
  required?: boolean;
  group: "order" | "item";
  /** Từ khóa để tự đoán cột trong file */
  hints: string[];
  width: number;
}

const BASE_FIELDS: FieldDef[] = [
  { key: "storeName", label: "Shop", group: "order", hints: ["store", "shop", "cua hang", "ten shop"], width: 170 },
  { key: "orderCode", label: "Mã đơn", required: true, group: "order", hints: ["order id", "orderid", "ma don", "order"], width: 130 },
  { key: "customerName", label: "Tên khách", required: true, group: "order", hints: ["customer name", "customers name", "buyer", "ship name", "ten khach", "name"], width: 160 },
  { key: "customerEmail", label: "Email", group: "order", hints: ["email", "mail"], width: 170 },
  { key: "customerPhone", label: "Điện thoại", group: "order", hints: ["phone", "dien thoai", "sdt"], width: 130 },
  { key: "address1", label: "Địa chỉ 1", required: true, group: "order", hints: ["address line 1", "address 1", "shipping address 1", "ship address1", "dia chi 1"], width: 200 },
  { key: "address2", label: "Địa chỉ 2", group: "order", hints: ["address line 2", "address 2", "shipping address 2", "ship address2", "dia chi 2"], width: 160 },
  { key: "city", label: "City", required: true, group: "order", hints: ["city", "thanh pho"], width: 130 },
  { key: "state", label: "State", required: true, group: "order", hints: ["state", "province", "region", "tinh"], width: 110 },
  { key: "zip", label: "Zip", required: true, group: "order", hints: ["zip", "postcode", "postal"], width: 110 },
  { key: "country", label: "Country", required: true, group: "order", hints: ["country", "quoc gia"], width: 110 },
  { key: "orderNote", label: "Ghi chú đơn", group: "order", hints: ["order note", "ghi chu don", "note don"], width: 160 },

  { key: "variantId", label: "Variant ID", group: "item", hints: ["variant id", "variantid", "variant"], width: 120 },
  { key: "productSku", label: "Phôi", group: "item", hints: ["product", "phoi", "style", "brand", "item name"], width: 150 },
  { key: "color", label: "Màu", group: "item", hints: ["color", "colour", "mau"], width: 120 },
  { key: "size", label: "Size", group: "item", hints: ["size", "kich thuoc"], width: 90 },
  { key: "quantity", label: "SL", required: true, group: "item", hints: ["quantity", "qty", "so luong"], width: 70 },
  { key: "price", label: "Đơn giá", group: "item", hints: ["price", "gia", "unit price"], width: 100 },
  { key: "designSku", label: "Mã thiết kế", group: "item", hints: ["design sku", "sku", "ma thiet ke"], width: 140 },
  { key: "frontUrl", label: "Link Front", group: "item", hints: ["design front", "front", "mat truoc"], width: 200 },
  { key: "backUrl", label: "Link Back", group: "item", hints: ["design back", "back", "mat sau"], width: 200 },
  { key: "mockupUrl", label: "Mockup", group: "item", hints: ["mockup front", "mockup", "anh mockup"], width: 200 },
  { key: "printArea", label: "Vùng in", group: "item", hints: ["vung in", "special print", "print area"], width: 120 },
  { key: "extraLeft", label: "Vùng phụ: Tay trái", group: "item", hints: ["design left hand", "left hand", "tay trai"], width: 170 },
  { key: "extraRight", label: "Vùng phụ: Tay phải", group: "item", hints: ["design right hand", "right hand", "tay phai"], width: 170 },
  { key: "extraNeck", label: "Vùng phụ: Cổ", group: "item", hints: ["design neck", "neck", "co ao"], width: 150 },
  { key: "extraHood", label: "Vùng phụ: Mũ", group: "item", hints: ["design hood", "hood", "mu"], width: 150 },
  { key: "extraPocket", label: "Vùng phụ: Túi", group: "item", hints: ["design pocket", "pocket", "tui"], width: 150 },
  { key: "itemNote", label: "Ghi chú SP", group: "item", hints: ["product note", "item note", "ghi chu"], width: 160 },
];

const EXTRA_AREAS: { key: FieldKey; name: string }[] = [
  { key: "extraLeft", name: "Tay trái" },
  { key: "extraRight", name: "Tay phải" },
  { key: "extraNeck", name: "Cổ" },
  { key: "extraHood", name: "Mũ" },
  { key: "extraPocket", name: "Túi" },
];

/** Bỏ dấu + hạ chữ thường để so tên cột */
function norm(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Đoán cột trong file cho từng field hệ thống */
function guessMapping(columns: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const used = new Set<string>();
  // Vòng 1: khớp CHÍNH XÁC tên cột trước (vd "Product Note" phải về Ghi chú SP,
  // không bị field "Phôi" chộp mất vì chứa chữ "product").
  BASE_FIELDS.forEach((f) => {
    const hit = columns.find(
      (c) => !used.has(c) && f.hints.some((h) => norm(c) === norm(h))
    );
    if (hit) {
      out[f.key] = hit;
      used.add(hit);
    }
  });
  // Vòng 2: khớp gần đúng cho các field còn trống
  BASE_FIELDS.forEach((f) => {
    if (out[f.key]) return;
    const hit = columns.find(
      (c) => !used.has(c) && f.hints.some((h) => norm(c).includes(norm(h)))
    );
    if (hit) {
      out[f.key] = hit;
      used.add(hit);
    }
  });
  return out;
}

/** Link Google Sheets -> URL trả về CSV (endpoint gviz cho phép gọi chéo miền) */
export function sheetCsvUrl(link: string): string | null {
  const m = String(link || "").match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const gid = (String(link).match(/[#&?]gid=(\d+)/) || [])[1] || "0";
  return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

type Row = Record<string, string>;

let ROW_SEQ = 0;
/** Id riêng cho mỗi dòng (dùng làm key + định danh khi sửa/xoá) */
function newRowId(): string {
  ROW_SEQ += 1;
  return `r${ROW_SEQ}`;
}
/** Dòng trống mặc định: SL = 1, Country = US, shop = shop đang chọn */
function emptyRow(defaultStore = ""): Row {
  return {
    __id: newRowId(),
    __v: "0",
    quantity: "1",
    country: "US",
    storeName: defaultStore,
  };
}

/** Thanh cuộn mảnh cho bảng dữ liệu (mặc định của macOS/Windows khá dày) */
const THIN_SCROLLBAR_CSS = `
.sheet-grid { scrollbar-width: thin; scrollbar-color: #D4D4D8 transparent; }
.sheet-grid::-webkit-scrollbar { width: 7px; height: 7px; }
.sheet-grid::-webkit-scrollbar-track { background: transparent; }
.sheet-grid::-webkit-scrollbar-thumb {
  background: #D4D4D8; border-radius: 999px;
}
.sheet-grid::-webkit-scrollbar-thumb:hover { background: #A1A1AA; }
.sheet-grid::-webkit-scrollbar-corner { background: transparent; }
`;

export default function SheetImportModal({
  open,
  onClose,
  storeId,
  storeName,
  stores,
  designs,
  variants,
  submitting,
  onSubmit,
  onSyncNow,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  /** Danh sách shop của seller — dùng cho cột "Shop" dạng dropdown */
  stores: { id: string; name: string }[];
  designs: Design[];
  variants: PodVariant[];
  submitting: boolean;
  onSubmit: (
    list: { id?: string; data: any }[],
    sourceName: string
  ) => Promise<void>;
  /** Đồng bộ thẳng lên web, bỏ qua bước xem trước */
  onSyncNow?: (
    list: { id?: string; data: any }[],
    sourceName: string
  ) => Promise<void>;
}) {
  // Map SKU phôi -> tên phôi, để tra bảng giá khớp cả khi sheet ghi mã SKU
  const { products } = useBaseProducts();
  const blankName = useMemo(() => makeBlankName(products), [products]);

  // Cột "Shop" là dropdown chọn từ danh sách shop của seller (được để trống)
  const FIELDS = useMemo(
    () =>
      BASE_FIELDS.map((f) =>
        f.key === "storeName"
          ? {
              ...f,
              options: stores.map((st) => ({
                value: st.name,
                label: st.name,
              })),
            }
          : f
      ),
    [stores]
  );

  /** Dòng trống mới luôn gán sẵn shop đang chọn (vẫn xoá được để trống) */
  const newRow = useCallback(() => emptyRow(storeName), [storeName]);

  const [step, setStep] = useState<"link" | "map" | "grid">("link");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  // Dữ liệu đã ghép cột, sửa được từng ô (1 dòng = 1 sản phẩm)
  const [rows, setRows] = useState<Row[]>([]);
  const [addCount, setAddCount] = useState(1);

  const reset = () => {
    setStep("link");
    setLink("");
    setColumns([]);
    setFileRows([]);
    setMapping({});
    setRows([]);
  };

  /* ------------------------------ B1: tải link ----------------------------- */
  const loadSheet = async () => {
    const url = sheetCsvUrl(link);
    if (!url)
      return message.error(
        "Link không hợp lệ — dán link Google Sheets dạng .../spreadsheets/d/..."
      );
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();
      const parsed = parseCSV(text);
      if (!parsed.length) throw new Error("empty");
      const cols = Object.keys(parsed[0]).filter((c) => c.trim());
      setColumns(cols);
      setFileRows(parsed);
      setMapping(guessMapping(cols));
      setStep("map");
      message.success(`Đọc được ${parsed.length} dòng · ${cols.length} cột`);
    } catch (e) {
      message.error(
        "Không tải được sheet. Mở Chia sẻ → “Bất kỳ ai có đường liên kết” (quyền Người xem) rồi thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ B2: ghép cột ----------------------------- */
  const missingRequired = FIELDS.filter(
    (f) => f.required && !mapping[f.key]
  ).map((f) => f.label);

  const applyMapping = () => {
    if (missingRequired.length)
      return message.error(`Chưa ghép cột: ${missingRequired.join(", ")}`);
    const mapped: Row[] = fileRows.map((r) => {
      const out: Row = { __id: newRowId(), __v: "0" };
      FIELDS.forEach((f) => {
        const col = mapping[f.key];
        out[f.key] = col ? String(r[col] ?? "").trim() : "";
      });
      if (!out.quantity) out.quantity = "1";
      if (!out.country) out.country = "US";
      if (!out.storeName) out.storeName = storeName;
      return out;
    });
    // Bỏ dòng trống hoàn toàn (sheet hay dư dòng cuối)
    setRows(mapped.filter((r) => r.orderCode || r.customerName));
    setStep("grid");
  };

  /* ------------------------------ B3: bảng sửa ----------------------------- */
  /** Thêm n dòng trống vào cuối bảng */
  const addRows = useCallback((n: number) => {
    const count = Math.max(1, Math.min(200, Math.floor(n) || 1));
    setRows((prev) => [
      ...prev,
      ...Array.from({ length: count }, () => newRow()),
    ]);
  }, [newRow]);

  const orderCount = useMemo(
    () =>
      new Set(rows.map((r) => String(r.orderCode || "").trim()).filter(Boolean))
        .size,
    [rows]
  );

  /** Gom dòng theo mã đơn -> danh sách đơn đưa sang bảng preview */
  const buildList = () => {
    const byOrder = new Map<string, Row[]>();
    rows.forEach((r) => {
      const code = String(r.orderCode || "").trim();
      if (!code) return;
      if (!byOrder.has(code)) byOrder.set(code, []);
      byOrder.get(code)!.push(r);
    });

    // Tên shop trên dòng -> shop thật của seller (bỏ trống thì dùng shop đang chọn)
    const storeByName = new Map(
      stores.map((st) => [st.name.trim().toLowerCase(), st])
    );

    return Array.from(byOrder.entries()).map(([code, group]) => {
      const head = group[0];
      const shopCell = String(head.storeName || "").trim();
      const matched = storeByName.get(shopCell.toLowerCase());
      // Có chọn shop -> dùng shop đó; để trống -> theo shop đang chọn ở sidebar;
      // gõ tên lạ -> giữ nguyên tên, chưa gán được shop (gán sau ở tab đơn hàng)
      const rowStoreId = shopCell ? matched?.id || "" : storeId;
      const rowStoreName = shopCell ? matched?.name || shopCell : storeName;
      const items = group.map((r) => {
        const extraAreas = EXTRA_AREAS.filter((a) => (r[a.key] || "").trim()).map(
          (a) => ({ name: a.name, url: (r[a.key] || "").trim() })
        );
        // Có mã thiết kế trong thư viện -> tự lấy link nếu cột link để trống
        const design = designs.find(
          (d) =>
            r.designSku &&
            d.sku.toLowerCase() === String(r.designSku).trim().toLowerCase()
        );
        const printAreaRaw = norm(r.printArea || "");
        const printArea =
          printAreaRaw.includes("special") || printAreaRaw.includes("dac biet")
            ? "special"
            : printAreaRaw.includes("full")
            ? "full"
            : "";
        const item: any = {
          productName: r.productSku || "",
          productSku: r.productSku || "",
          sku: r.designSku || "",
          variantId: r.variantId || "",
          color: r.color || "",
          size: r.size || "",
          origTitle: r.productSku || "",
          origType: r.productSku || "",
          origColor: r.color || "",
          origSize: r.size || "",
          printArea,
          quantity: parseInt(r.quantity) || 1,
          price: parseFloat(r.price) || 0,
          frontUrl: (r.frontUrl || design?.frontUrl || "").trim(),
          backUrl: (r.backUrl || design?.backUrl || "").trim(),
          mockupUrl: (r.mockupUrl || design?.mockupUrl || "").trim(),
          extraAreas: extraAreas.length ? extraAreas : design?.extraAreas || [],
          note: r.itemNote || "",
        };
        // Chưa có giá -> tính theo bảng giá phôi POD (nếu tra được biến thể)
        if (!item.price) {
          const v = findVariantForItem(variants, item, blankName);
          item.price = variantUnitPrice(v, item);
        }
        return item;
      });

      return {
        id: `sheet-${code}`,
        data: {
          orderCode: code,
          storeId: rowStoreId,
          storeName: rowStoreName,
          status: "pending_payment",
          tracking: "",
          source: "csv",
          customerName: head.customerName || "",
          customerEmail: head.customerEmail || "",
          customerPhone: head.customerPhone || "",
          address1: head.address1 || "",
          address2: head.address2 || "",
          city: head.city || "",
          state: head.state || "",
          zip: head.zip || "",
          country: head.country || "US",
          items,
          note: head.orderNote || "",
          csCustomerMsg: "",
          total: items.reduce(
            (s: number, i: any) => s + (i.price || 0) * (i.quantity || 1),
            0
          ),
          created: new Date().toISOString(),
        },
      };
    });
  };

  /** Dựng danh sách đơn + kiểm tra thông tin bắt buộc; lỗi thì trả về null */
  const buildValidList = () => {
    const list = buildList();
    if (!list.length) {
      message.error("Không có đơn nào để import");
      return null;
    }
    const bad = list.find(
      (o) =>
        !o.data.customerName ||
        !o.data.address1 ||
        !o.data.city ||
        !o.data.state ||
        !o.data.zip
    );
    if (bad) {
      message.error(
        `Đơn ${bad.data.orderCode} còn thiếu thông tin bắt buộc (tên khách / địa chỉ / city / state / zip)`
      );
      return null;
    }
    return list;
  };

  /** Đưa sang bảng xem trước ở tab Import */
  const submit = async () => {
    const list = buildValidList();
    if (!list) return;
    await onSubmit(list, link);
    reset();
  };

  /** Đồng bộ thẳng lên web, không qua bước xem trước */
  const syncNow = async () => {
    if (!onSyncNow) return;
    const list = buildValidList();
    if (!list) return;
    await onSyncNow(list, link);
    reset();
  };

  /* --------------------------------- Render -------------------------------- */

  const colOptions = [
    { value: "", label: "— Không dùng —" },
    ...columns.map((c) => ({ value: c, label: c })),
  ];

  return (
    <Modal
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      width={step === "grid" ? 1200 : 680}
      footer={null}
      title={
        <span className="text-lg font-extrabold text-[#171826]">
          📥 Import đơn từ link Google Sheets
        </span>
      }
    >
      <style>{THIN_SCROLLBAR_CSS}</style>

      {/* Bước 1 — dán link */}
      {step === "link" && (
        <div className="space-y-3 pt-2">
          <div className="text-[11px] font-bold tracking-widest text-gray-400">
            LINK GOOGLE SHEETS
          </div>
          <div className="flex gap-2">
            <Input
              size="large"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onPressEnter={loadSheet}
            />
            <Button
              type="primary"
              size="large"
              icon={<FiDownloadCloud />}
              loading={loading}
              onClick={loadSheet}
              className="bg-[#171826] border-0 font-bold"
            >
              Tải dữ liệu
            </Button>
          </div>
          <Button
            icon={<FiEdit3 />}
            onClick={() => {
              setRows(Array.from({ length: 10 }, () => newRow()));
              setStep("grid");
            }}
          >
            Hoặc nhập tay trên bảng (không cần link)
          </Button>
          <div className="text-xs text-gray-500 leading-6 bg-gray-50 rounded-xl p-3">
            • Sheet phải để chế độ <b>Chia sẻ → Bất kỳ ai có đường liên kết</b>{" "}
            (quyền Người xem).
            <br />• Dòng đầu tiên là <b>tên cột</b>. Mỗi dòng là{" "}
            <b>1 sản phẩm</b>; đơn nhiều sản phẩm thì lặp lại mã đơn ở các dòng.
            <br />• Link có <code>#gid=</code> sẽ lấy đúng tab đó, không có thì
            lấy tab đầu tiên.
          </div>
        </div>
      )}

      {/* Bước 2 — ghép cột */}
      {step === "map" && (
        <div className="pt-2">
          <div className="text-xs text-gray-500 mb-3">
            Đọc được <b>{fileRows.length}</b> dòng. Chọn cột tương ứng cho từng
            field — dấu <span className="text-red-500">*</span> là bắt buộc.
          </div>
          <div className="sheet-grid max-h-[52vh] overflow-y-auto pr-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[11px] tracking-wider text-gray-500 bg-gray-50 border-b border-gray-100">
                  <th className="p-2.5">Field hệ thống</th>
                  <th className="p-2.5">Cột trong file</th>
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((f) => (
                  <tr key={f.key} className="border-b border-gray-50">
                    <td className="p-2.5">
                      <span
                        className={`text-[9px] font-bold rounded px-1.5 py-[1px] mr-2 ${
                          f.group === "order"
                            ? "bg-[#EEF0FF] text-[#4338CA]"
                            : "bg-[#FBF6EC] text-[#B79351]"
                        }`}
                      >
                        {f.group === "order" ? "ĐƠN" : "SP"}
                      </span>
                      {f.label}
                      {f.required && <span className="text-red-500"> *</span>}
                    </td>
                    <td className="p-2.5">
                      <Select
                        className="w-[300px]"
                        showSearch
                        optionFilterProp="label"
                        placeholder="Chọn cột..."
                        value={mapping[f.key] || ""}
                        onChange={(v) =>
                          setMapping((prev) => ({ ...prev, [f.key]: v }))
                        }
                        options={colOptions}
                        status={f.required && !mapping[f.key] ? "error" : ""}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center gap-3 pt-4">
            <Button onClick={() => setStep("link")}>Quay lại</Button>
            <div className="flex items-center gap-3">
              {missingRequired.length > 0 && (
                <span className="text-xs text-red-500">
                  Thiếu: {missingRequired.join(", ")}
                </span>
              )}
              <Button
                type="primary"
                onClick={applyMapping}
                className="bg-[#171826] border-0 font-bold"
              >
                Xem &amp; sửa dữ liệu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bước 3 — bảng nhập liệu kiểu Excel */}
      {step === "grid" && (
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold bg-[#FBF6EC] text-[#B79351] border border-[#EADFC8] rounded-full px-2.5 py-1">
              {orderCount} đơn · {rows.length} sản phẩm
            </span>
            <div className="flex items-center gap-1.5">
              <InputNumber
                size="small"
                min={1}
                max={200}
                value={addCount}
                onChange={(v) => setAddCount(Number(v) || 1)}
                className="w-[64px]"
              />
              <Button
                size="small"
                icon={<FiPlus />}
                onClick={() => addRows(addCount)}
              >
                Thêm dòng
              </Button>
            </div>
            <span className="text-xs text-gray-400">
              Dòng cùng mã đơn gộp thành 1 đơn
            </span>
          </div>

          <ExcelGrid
            columns={FIELDS}
            rows={rows}
            onRowsChange={setRows}
            makeEmptyRow={newRow}
          />

          <div className="flex justify-between items-center pt-1">
            <Button onClick={() => setStep(columns.length ? "map" : "link")}>
              Quay lại
            </Button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                disabled={!rows.length || submitting}
                onClick={submit}
                className="h-[42px] px-5 rounded-xl font-bold border-2 border-[#C6A15B] text-[#B79351]"
              >
                Import {orderCount} đơn để xem trước
              </Button>
              {onSyncNow && (
                <Button
                  type="primary"
                  loading={submitting}
                  disabled={!rows.length}
                  onClick={syncNow}
                  icon={<FiUploadCloud />}
                  className="bg-[#C6A15B] border-0 h-[42px] px-6 rounded-xl font-bold"
                >
                  Đồng bộ {orderCount} đơn lên Web
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
