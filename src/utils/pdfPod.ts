import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import {
  Design,
  KNOWN_SIZES,
  PodOrderItem,
  PodStore,
  PodVariant,
  findVariantForItem,
  splitSizeFromColor,
  variantUnitPrice,
} from "../models/pod";

/** Map SKU phôi -> tên phôi (truyền từ trang gọi, xem makeBlankName). */
export type BlankNameFn = (sku?: string) => string;

export type PdfOrderPreview = {
  id: string;
  data: Omit<any, "id">;
};

const clean = (value = "") => value.replace(/\s+/g, " ").trim();

// Parse ngày Etsy kiểu "Apr 7, 2026" ổn định trên MỌI trình duyệt (không dựa
// vào new Date(string) vốn khác nhau giữa Chrome/Safari).
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
function parseEtsyDate(raw?: string): Date | null {
  const s = clean(raw || "");
  if (!s) return null;
  const m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mo !== undefined) {
      const d = new Date(Date.UTC(Number(m[3]), mo, Number(m[2])));
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  const fallback = new Date(s); // dự phòng cho định dạng khác
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}
// Tìm dòng ngày ngay dưới một nhãn — quét vài dòng phòng khi layout tách dòng.
function findDateAfter(lines: string[], labelRe: RegExp): Date | null {
  const idx = lines.findIndex((l) => labelRe.test(l));
  if (idx < 0) return null;
  for (let i = idx + 1; i <= idx + 3 && i < lines.length; i += 1) {
    const d = parseEtsyDate(lines[i]);
    if (d) return d;
  }
  return null;
}

// Netlify cần một URL tĩnh cho PDF worker. `new URL(..., import.meta.url)`
// có thể sinh asset URL không tồn tại sau SPA redirect, khiến getDocument báo
// "Không thể đọc file PDF" dù file Etsy hoàn toàn hợp lệ.
GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.js`;

function parseAddress(lines: string[]) {
  const values = lines.map(clean).filter(Boolean);
  const customerName = values.shift() || "";
  const country = values.pop() || "United States";
  let zip = "";
  let state = "";
  let city = "";

  // Etsy có thể đặt ZIP cùng dòng thành phố hoặc thành một dòng riêng.
  if (values.length && /^\d{5}(?:-\d{4})?$/.test(values[values.length - 1])) {
    zip = values.pop() || "";
  }
  const cityState = values.pop() || "";
  const cityStateMatch = cityState.match(
    /^(.*?),\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/
  );
  if (cityStateMatch) {
    city = clean(cityStateMatch[1]);
    state = cityStateMatch[2];
    zip = zip || cityStateMatch[3] || "";
  } else {
    city = cityState;
  }

  return {
    customerName,
    address1: values.join(", "),
    city,
    state,
    zip,
    country,
  };
}

// Một dòng thuộc phần chi tiết biến thể (không phải tiêu đề sản phẩm).
const isDetailLine = (line: string) =>
  /^(Quantity|Styles?|Colou?rs?|Size|Personalization)\b[^:]*:/i.test(line);

type ItemSegment = { sku: string; title: string; details: string[] };

/** Dựng 1 PodOrderItem từ tiêu đề + các dòng chi tiết của một item. */
function buildItem(
  seg: ItemSegment,
  designs: Design[],
  variants: PodVariant[],
  blankName?: BlankNameFn
): PodOrderItem {
  const { sku, title, details } = seg;
  const quantity = Number(
    details.find((line) => /^Quantity:\s*/i.test(line))?.replace(/^Quantity:\s*/i, "") || 1
  );

  // Dòng "Styles..." có thể là: "Styles Colors: ...", "Styles and Size: ...",
  // hoặc layout 2026 "Styles and size ( Comfort Colors ): t-Shirt M".
  const styleLine = details.find((line) => /^Styles?\b[^:]*:/i.test(line));
  const colonPos = styleLine ? styleLine.indexOf(":") : -1;
  const styleLabel = styleLine ? styleLine.slice(0, colonPos) : "";
  const styleValue = styleLine ? clean(styleLine.slice(colonPos + 1)) : "";
  // Hãng phôi đôi khi nằm trong ngoặc ở nhãn: "( Comfort Colors )".
  const styleMaterial = clean(styleLabel.match(/\(([^)]+)\)/)?.[1] || "");

  const sizeRaw = clean(
    details.find((line) => /^Size:\s*/i.test(line))?.replace(/^Size:\s*/i, "") || ""
  );
  // Dòng "Colors:" đứng riêng (không phải "Styles Colors").
  const colorLineVal = clean(
    details
      .find((line) => /^Colou?rs?:\s*/i.test(line) && !/^Styles/i.test(line))
      ?.replace(/^Colou?rs?:\s*/i, "") || ""
  );

  let productStyle = "";
  let color = "";
  let size = "";

  if (styleLine) {
    const separated = styleValue.split(/\s+-\s+/);
    if (separated.length > 1 && !colorLineVal) {
      // Kiểu cũ A: "Type - Color" cùng dòng, không có dòng Colors riêng.
      productStyle = clean(separated[0]);
      const sp = splitSizeFromColor(clean(separated.slice(1).join(" - ")), sizeRaw);
      color = sp.color;
      size = sp.size;
    } else {
      // Layout 2026: value = "<Type...> <Size>", màu ở dòng "Colors:" riêng.
      const sp = splitSizeFromColor(styleValue, sizeRaw);
      size = sp.size;
      productStyle = styleMaterial || sp.color; // ưu tiên hãng phôi trong ngoặc
      color = colorLineVal;
    }
  } else if (colorLineVal) {
    // Kiểu cũ B: không có dòng Styles; Color riêng; Size chứa Type + Size.
    color = colorLineVal;
    const sp = splitSizeFromColor(sizeRaw, "");
    productStyle = sp.color;
    size = sp.size;
  } else if (KNOWN_SIZES.includes(sizeRaw.toUpperCase())) {
    size = sizeRaw;
  } else {
    const sp = splitSizeFromColor(sizeRaw, "");
    productStyle = sp.color;
    size = sp.size;
  }

  // Bỏ chữ "Color"/"Colors" ở cuối Type (vd "Comfort Colors" → "Comfort").
  const strippedStyle = productStyle.replace(/\s+colou?rs?\s*$/i, "").trim();
  if (strippedStyle) productStyle = strippedStyle;

  const personalization = clean(
    details
      .find((line) => /^Personalization:\s*/i.test(line))
      ?.replace(/^Personalization:\s*/i, "") || ""
  );
  const design = sku
    ? designs.find((entry) => entry.sku.toLowerCase() === sku.toLowerCase())
    : undefined;
  const origTitle = clean(title) || productStyle || sku;
  const origType = productStyle || sku;
  const baseItem: PodOrderItem = {
    productName: origTitle,
    productSku: origType,
    sku,
    color,
    size,
    personalization,
    // Chụp bản gốc khách up lên — ô vàng luôn hiển thị cái này, không đổi
    origTitle,
    origType,
    origColor: color,
    origSize: size,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    price: 0,
    frontUrl: design?.frontUrl || "",
    backUrl: design?.backUrl || "",
    mockupUrl: design?.mockupUrl || "",
    extraAreas: design?.extraAreas || [],
    note: "",
  };
  return {
    ...baseItem,
    price: variantUnitPrice(
      findVariantForItem(variants, baseItem, blankName),
      baseItem
    ),
  };
}

function parseItems(
  lines: string[],
  designs: Design[],
  variants: PodVariant[],
  blankName?: BlankNameFn
): PodOrderItem[] {
  const countIndex = lines.findIndex((line) => /^\d+ items?$/.test(line));
  if (countIndex < 0) return [];

  const skuIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^SKU:\s*/i.test(line))
    .map(({ index }) => index);

  const segments: ItemSegment[] = [];

  if (skuIndexes.length) {
    // Định dạng cũ: mỗi item bắt đầu bằng dòng "SKU:".
    let titleStart = countIndex + 1;
    skuIndexes.forEach((skuIndex, index) => {
      const sku = clean(lines[skuIndex].replace(/^SKU:\s*/i, ""));
      const detailEnd = skuIndexes[index + 1] || lines.length;
      const details = lines.slice(skuIndex + 1, detailEnd);
      const title = lines.slice(titleStart, skuIndex).join(" ");
      // Phần giữa SKU hiện tại và SKU kế còn chứa tiêu đề của item kế tiếp.
      const lastDetailIndex = details.reduce(
        (last, line, detailIndex) => (isDetailLine(line) ? detailIndex : last),
        -1
      );
      titleStart = skuIndex + 1 + lastDetailIndex + 1;
      segments.push({ sku, title, details });
    });
  } else {
    // Layout 2026 (Etsy bỏ dòng SKU): mỗi item mốc theo dòng "Quantity:".
    // Vùng item = từ sau dòng đếm ("N items") tới trước phần footer quảng cáo.
    const footerIdx = lines.findIndex(
      (line, index) =>
        index > countIndex && /^Love what you bought\??$/i.test(line)
    );
    const region = lines.slice(countIndex + 1, footerIdx < 0 ? lines.length : footerIdx);
    const qtyIndexes = region
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => /^Quantity:\s*/i.test(line))
      .map(({ index }) => index);

    let titleStart = 0;
    qtyIndexes.forEach((qtyIndex) => {
      const title = region.slice(titleStart, qtyIndex).join(" ");
      let end = qtyIndex + 1;
      while (end < region.length && isDetailLine(region[end])) end += 1;
      const details = region.slice(qtyIndex, end);
      titleStart = end;
      segments.push({ sku: "", title, details });
    });
  }

  return segments.map((seg) => buildItem(seg, designs, variants, blankName));
}

/** Đọc packing slip PDF của Etsy (mỗi trang tương ứng một đơn hàng). */
export async function parseEtsyPackingSlipPdf(
  file: File,
  options: {
    storeId?: string;
    store?: PodStore;
    designs: Design[];
    variants: PodVariant[];
    blankName?: BlankNameFn;
  }
): Promise<PdfOrderPreview[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const previews: PdfOrderPreview[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    try {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = content.items
        .map((item: any) => clean(item.str || ""))
        .filter(Boolean);
      // Etsy có 2 kiểu ghi mã đơn:
      //  A) cùng dòng: "Order #4124650591"
      //  B) tách dòng (layout 2026): "Order" rồi dòng kế "#4124650591"
      let code = lines
        .find((line) => /^Order\s*#\s*\d/i.test(line))
        ?.replace(/^Order\s*#\s*/i, "");
      if (!code) {
        const orderIdx = lines.findIndex((line) => /^Order$/i.test(line));
        const next = orderIdx >= 0 ? lines[orderIdx + 1] || "" : "";
        if (/^#?\s*\d/.test(next)) code = clean(next.replace(/^#\s*/, ""));
      }
      const shipTo = lines.findIndex((line) => /^Ship to$/i.test(line));
      const shipEnd = lines.findIndex((line, index) => index > shipTo && /^Scheduled to ship by$/i.test(line));
      if (!code || shipTo < 0 || shipEnd < 0) continue;

      const shipByDate = findDateAfter(lines, /^Scheduled to ship by$/i);
      const items = parseItems(
        lines,
        options.designs,
        options.variants,
        options.blankName
      );
      if (!items.length) continue;
      const address = parseAddress(lines.slice(shipTo + 1, shipEnd));
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const createdDate = findDateAfter(lines, /^Order date$/i);

      previews.push({
        id: `etsy-pdf-${code}-${pageNumber}`,
        data: {
          orderCode: code,
          storeId: options.storeId,
          storeName: options.store?.name || "",
          status: "pending_payment",
          tracking: "",
          source: "etsy",
          customerEmail: "",
          customerPhone: "",
          ...address,
          items,
          note: `Imported from ${file.name}`,
          // Tin nhắn khách để TRỐNG, nhân viên tự nhập tay (không lấy Personalization)
          csCustomerMsg: "",
          total,
          shipBy: shipByDate ? shipByDate.toISOString() : null,
          // Không đọc được ngày -> để TRỐNG (hiển thị "—"), không bịa hôm nay.
          created: createdDate ? createdDate.toISOString() : "",
        },
      });
    } catch (error) {
      // Một trang hỏng không nên làm mất các đơn hợp lệ ở trang còn lại.
      console.warn(`Không thể đọc trang ${pageNumber} của ${file.name}`, error);
    }
  }

  return previews;
}
