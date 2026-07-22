import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import {
  Design,
  PodOrderItem,
  PodStore,
  PodVariant,
  findVariant,
  variantUnitPrice,
} from "../models/pod";

export type PdfOrderPreview = {
  id: string;
  data: Omit<any, "id">;
};

const clean = (value = "") => value.replace(/\s+/g, " ").trim();

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

function parseItems(
  lines: string[],
  designs: Design[],
  variants: PodVariant[]
): PodOrderItem[] {
  const countIndex = lines.findIndex((line) => /^\d+ items?$/.test(line));
  if (countIndex < 0) return [];
  const skuIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^SKU:\s*/i.test(line))
    .map(({ index }) => index);
  let titleStart = countIndex + 1;

  return skuIndexes.map((skuIndex, index) => {
    const sku = clean(lines[skuIndex].replace(/^SKU:\s*/i, ""));
    const detailEnd = skuIndexes[index + 1] || lines.length;
    const details = lines.slice(skuIndex + 1, detailEnd);
    const title = lines.slice(titleStart, skuIndex).join(" ");
    // Phần giữa SKU hiện tại và SKU tiếp theo còn chứa tiêu đề sản phẩm tiếp theo.
    // Lấy trường Etsy cuối cùng làm mốc để không làm mất tiêu đề khi một đơn có nhiều item.
    const lastDetailIndex = details.reduce(
      (last, line, detailIndex) =>
        /^(Quantity|Styles\s*-\s*Colors|Size|Personalization):/i.test(line)
          ? detailIndex
          : last,
      -1
    );
    titleStart = skuIndex + 1 + lastDetailIndex + 1;
    const quantity = Number(
      details.find((line) => /^Quantity:\s*/i.test(line))?.replace(/^Quantity:\s*/i, "") || 1
    );
    const styleLine = details.find((line) =>
      /^Styles?(?:\s*-?\s*Colors?|\s+and\s+Size):\s*/i.test(line)
    );
    const style = clean(
      styleLine?.replace(
        /^Styles?(?:\s*-?\s*Colors?|\s+and\s+Size):\s*/i,
        ""
      ) || ""
    );
    // Etsy thay đổi nhãn variation tùy listing: "Styles - Colors",
    // "Styles Colors" hoặc "Styles and Size". Giá trị thường là
    // "Gildan - Black" (có dấu phân cách) hoặc "Gildan Black" (không có).
    // SKU thiết kế Etsy vẫn được giữ riêng ở trường `sku`.
    const separatedStyle = style.split(/\s+-\s+/);
    const [productStyle = "", ...colorParts] =
      separatedStyle.length > 1 ? separatedStyle : style.split(/\s+/);
    const color = colorParts.join(separatedStyle.length > 1 ? " - " : " ");
    const size = clean(
      details.find((line) => /^Size:\s*/i.test(line))?.replace(/^Size:\s*/i, "") || ""
    );
    const personalization = clean(
      details
        .find((line) => /^Personalization:\s*/i.test(line))
        ?.replace(/^Personalization:\s*/i, "") || ""
    );
    const design = designs.find((entry) => entry.sku.toLowerCase() === sku.toLowerCase());
    const baseItem: PodOrderItem = {
      productName: clean(title) || productStyle || sku,
      productSku: productStyle || sku,
      sku,
      color,
      size,
      personalization,
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
        findVariant(variants, baseItem.productSku, size, color),
        baseItem
      ),
    };
  });
}

/** Đọc packing slip PDF của Etsy (mỗi trang tương ứng một đơn hàng). */
export async function parseEtsyPackingSlipPdf(
  file: File,
  options: { storeId?: string; store?: PodStore; designs: Design[]; variants: PodVariant[] }
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
      const code = lines.find((line) => /^Order\s*#/i.test(line))?.replace(/^Order\s*#/i, "");
      const shipTo = lines.findIndex((line) => /^Ship to$/i.test(line));
      const shipEnd = lines.findIndex((line, index) => index > shipTo && /^Scheduled to ship by$/i.test(line));
      if (!code || shipTo < 0 || shipEnd < 0) continue;

      const orderDateIndex = lines.findIndex((line) => /^Order date$/i.test(line));
      const orderDate = orderDateIndex >= 0 ? lines[orderDateIndex + 1] : "";
      const shipByIndex = lines.findIndex((line) => /^Scheduled to ship by$/i.test(line));
      const shipByDate = shipByIndex >= 0 ? new Date(lines[shipByIndex + 1]) : null;
      const items = parseItems(lines, options.designs, options.variants);
      if (!items.length) continue;
      const address = parseAddress(lines.slice(shipTo + 1, shipEnd));
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const createdDate = new Date(orderDate);

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
          total,
          shipBy:
            shipByDate && !Number.isNaN(shipByDate.getTime())
              ? shipByDate.toISOString()
              : null,
          created: Number.isNaN(createdDate.getTime())
            ? new Date().toISOString()
            : createdDate.toISOString(),
        },
      });
    } catch (error) {
      // Một trang hỏng không nên làm mất các đơn hợp lệ ở trang còn lại.
      console.warn(`Không thể đọc trang ${pageNumber} của ${file.name}`, error);
    }
  }

  return previews;
}
