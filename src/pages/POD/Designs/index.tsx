import {
  Button,
  Checkbox,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Popover,
  Select,
  Tooltip,
  message,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiImage,
  FiShoppingBag,
} from "react-icons/fi";
import {
  useDesignMutations,
  useDesigns,
  useStores,
} from "../../../hooks/usePod";
import { Design, DesignExtraArea } from "../../../models/pod";
import { downloadCSV, parseCSV, toCSV } from "../../../utils/csvPod";
import { imageUrlCandidates } from "../../../utils/imageUrl";
import { usePodStore } from "../../../store/usePodStore";
import UploadImgButton from "../../../components/UploadImgButton";

function SafeImg({ url, alt }: { url: string; alt: string }) {
  const [idx, setIdx] = useState(0);
  const candidates = imageUrlCandidates(url);
  if (!candidates.length)
    return (
      <span className="text-gray-300 text-xs tracking-widest">NO IMAGE</span>
    );
  if (idx >= candidates.length)
    return (
      <span className="text-gray-300 text-xs tracking-widest">
        LINK ẢNH LỖI
      </span>
    );
  return (
    <img
      key={candidates[idx]}
      src={candidates[idx]}
      alt={alt}
      referrerPolicy="no-referrer"
      className="w-full h-full object-contain"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

const SWATCHES = [
  { name: "Graphite", color: "#353231" },
  { name: "Pepper", color: "#6B6B68" },
  { name: "Grey", color: "#A9A9A9" },
  { name: "Black", color: "#000000" },
  { name: "Red", color: "#BE0F26" },
  { name: "White", color: "#FFFFFF" },
];

/** Dãy swatch màu nền ướm thử + nút chọn màu tùy ý (color picker) */

function TestBgPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const timer = useRef<any>(null);

  const isCustom =
    !!value && !SWATCHES.some((item) => item.color === value);

  const debounced = (color: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(color), 350);
  };

  return (
    <div className="flex gap-1.5 items-center">
      {SWATCHES.map(({ name, color }) => (
        <Tooltip key={color} title={name} placement="top">
          <button
            onClick={() => onChange(color)}
            className={`w-5 h-5 rounded-full cursor-pointer border-2 transition-all hover:scale-110 ${
              value === color
                ? "border-[#C6A15B]"
                : "border-gray-200"
            }`}
            style={{ backgroundColor: color }}
          />
        </Tooltip>
      ))}

      {/* Màu tùy chọn */}
      <Tooltip title="Custom Color" placement="top">
        <label
          className={`w-5 h-5 rounded-full cursor-pointer border-2 relative overflow-hidden inline-block ${
            isCustom ? "border-[#C6A15B]" : "border-gray-200"
          }`}
          style={{
            background: isCustom
              ? value
              : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
          }}
        >
          <input
            type="color"
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            value={
              /^#[0-9a-fA-F]{6}$/.test(value || "")
                ? value
                : "#F9FAFB"
            }
            onChange={(e) => debounced(e.target.value)}
          />
        </label>
      </Tooltip>
    </div>
  );
}

function ImgCell({
  url,
  tag,
  tagColor,
  placeholder,
  onChange,
  bg,
  fluid,
}: {
  url: string;
  tag: string;
  tagColor: string;
  placeholder: string;
  onChange: (v: string) => void;
  bg?: string;
  fluid?: boolean;
}) {
  const box = (
    <div
      className={`h-[110px] rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
        url
          ? "cursor-zoom-in border border-gray-200 shadow-inner hover:shadow-md"
          : "border-2 border-dashed border-gray-200"
      }`}
      style={{ backgroundColor: url ? bg || "#F9FAFB" : "#FCFCFD" }}
    >
      {url ? (
        <SafeImg key={url} url={url} alt={tag} />
      ) : (
        <span className="flex flex-col items-center gap-1.5 text-gray-300">
          <FiImage size={20} />
          <span className="text-[10px] tracking-widest">{placeholder}</span>
        </span>
      )}
    </div>
  );
  return (
    <div className={`flex flex-col gap-2 ${fluid ? "w-full" : "w-[180px]"}`}>
      {url ? (
        <Popover
          title={tag}
          content={
            <div
              className="w-[340px] h-[340px] flex items-center justify-center rounded-lg overflow-hidden transition-colors duration-300"
              style={{ backgroundColor: bg || "#F9FAFB" }}
            >
              <SafeImg key={url} url={url} alt={tag} />
            </div>
          }
        >
          {box}
        </Popover>
      ) : (
        box
      )}
      <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 bg-white">
        <span
          className="text-[9px] font-bold tracking-wider shrink-0"
          style={{ color: tagColor }}
        >
          {tag}
        </span>
        <input
          key={url}
          className="border-0 outline-none text-xs w-full text-gray-600"
          placeholder={`Dán link ${tag.toLowerCase()}...`}
          defaultValue={url}
          onBlur={(e) => e.target.value !== url && onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  placeholder,
  borderClass,
  value,
  onChange,
  disabled,
  preview,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  borderClass: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  preview?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold tracking-widest text-gray-400 mb-2">
        {label} {required && "*"}
      </div>
      <div className="flex gap-2 items-center">
        <input
          className={`flex-1 h-[52px] rounded-xl border-2 ${borderClass} px-4 text-[15px] outline-none placeholder:text-gray-300 box-border ${
            disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
          }`}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        {preview && !disabled && <UploadImgButton onUploaded={onChange} />}
      </div>
      {preview && value.trim() && (
        <div className="mt-2 h-[150px] bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
          <SafeImg key={value} url={value.trim()} alt={label} />
        </div>
      )}
    </div>
  );
}

/** Ô chọn cửa hàng trong form (cùng style với <Field/>) */
function StoreField({
  value,
  options,
  onChange,
  disabled,
  disabledText,
}: {
  value: string;
  options: { id: string; name: string; status?: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  disabledText?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold tracking-widest text-gray-400 mb-2">
        CỬA HÀNG (SHOP) *
      </div>
      {disabled ? (
        <div className="h-[52px] rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 px-4 flex items-center text-[15px]">
          {disabledText || "—"}
        </div>
      ) : (
        <Select
          className="w-full pod-store-select"
          size="large"
          value={value || undefined}
          placeholder="Chọn cửa hàng lưu thiết kế"
          onChange={onChange}
          showSearch
          optionFilterProp="label"
          options={options.map((s) => ({
            value: s.id,
            label: s.name + (s.status === "locked" ? " (đang khóa)" : ""),
            disabled: s.status === "locked",
          }))}
        />
      )}
    </div>
  );
}

function DesignFormModal({
  open,
  initial,
  focusAreas,
  stores,
  defaultStoreId,
  storeName,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  initial?: Design | null;
  focusAreas?: boolean;
  stores: { id: string; name: string; status?: string }[];
  defaultStoreId: string;
  storeName?: string;
  onClose: () => void;
  onSave: (data: {
    sku: string;
    storeId: string;
    frontUrl: string;
    backUrl: string;
    mockupUrl: string;
    extraAreas: DesignExtraArea[];
  }) => void;
  saving: boolean;
}) {
  const isEdit = !!initial;
  const [sku, setSku] = useState("");
  const [storeId, setStoreId] = useState("");
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const [mockupUrl, setMockupUrl] = useState("");
  const [extraAreas, setExtraAreas] = useState<DesignExtraArea[]>([]);
  const [highlightAreas, setHighlightAreas] = useState(false);
  const areasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setSku(initial?.sku || "");
    setStoreId(initial?.storeId || defaultStoreId || "");
    setFrontUrl(initial?.frontUrl || "");
    setBackUrl(initial?.backUrl || "");
    setMockupUrl(initial?.mockupUrl || "");
    const areas = initial?.extraAreas ? [...initial.extraAreas] : [];
    // Mở từ nút "Thêm/Sửa vùng phụ": tự thêm dòng trống nếu chưa có,
    // cuộn tới mục vùng in và highlight cho dễ thấy
    if (focusAreas && !areas.length) areas.push({ name: "", url: "" });
    setExtraAreas(areas);
    if (focusAreas) {
      setHighlightAreas(true);
      setTimeout(() => {
        areasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
      setTimeout(() => setHighlightAreas(false), 2500);
    }
  }, [open, initial, focusAreas, defaultStoreId]);

  const reset = () => {
    setSku("");
    setStoreId("");
    setFrontUrl("");
    setBackUrl("");
    setMockupUrl("");
    setExtraAreas([]);
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        reset();
        onClose();
      }}
      width={620}
      title={
        <span className="text-xl font-extrabold text-[#171826]">
          {isEdit
            ? `🛠️ Cập nhật SKU: ${initial?.sku}`
            : "🎨 Thêm thiết kế gốc vào hệ thống"}
        </span>
      }
      footer={
        <div className="flex justify-end items-center gap-6 pt-2">
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-gray-500 text-base bg-transparent border-0 cursor-pointer"
          >
            Hủy
          </button>
          <Button
            type="primary"
            loading={saving}
            onClick={() => {
              if (!sku.trim()) {
                message.error("Vui lòng nhập mã định danh (Design SKU)");
                return;
              }
              if (!isEdit && !storeId) {
                message.error("Vui lòng chọn cửa hàng cho thiết kế này");
                return;
              }
              onSave({
                sku: sku.trim(),
                storeId,
                frontUrl: frontUrl.trim(),
                backUrl: backUrl.trim(),
                mockupUrl: mockupUrl.trim(),
                extraAreas: extraAreas.filter((a) => a.name.trim()),
              });
              reset();
            }}
            className="bg-[#171826] h-[48px] px-8 rounded-xl font-bold text-base"
          >
            Xác nhận lưu
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-2 max-h-[62vh] overflow-y-auto pr-1">
        <StoreField
          value={storeId}
          options={stores}
          onChange={setStoreId}
          disabled={isEdit}
          disabledText={storeName || "Không xác định"}
        />
        <Field
          label="MÃ ĐỊNH DANH (DESIGN SKU)"
          required
          placeholder="Vd: TS-MEDUSA-FRONT-01"
          borderClass="border-[#171826]"
          value={sku}
          onChange={setSku}
          disabled={isEdit}
        />
        <Field
          label="URL FILE THIẾT KẾ MẶT TRƯỚC (FRONT URL)"
          placeholder="https://link-driver-or-s3/design_front.png"
          borderClass="border-[#3B82F6]"
          value={frontUrl}
          onChange={setFrontUrl}
          preview
        />
        <Field
          label="URL FILE THIẾT KẾ MẶT SAU (BACK URL)"
          placeholder="https://link-driver-or-s3/design_back.png"
          borderClass="border-[#3B82F6]"
          value={backUrl}
          onChange={setBackUrl}
          preview
        />
        <Field
          label="URL ẢNH MOCKUP SẢN PHẨM"
          placeholder="https://link-img/mockup.jpg"
          borderClass="border-[#0E9F6E]"
          value={mockupUrl}
          onChange={setMockupUrl}
          preview
        />

        <div
          ref={areasRef}
          className={`rounded-xl transition-all duration-500 ${
            highlightAreas
              ? "ring-2 ring-[#8B5CF6] ring-offset-4 bg-[#FBFAFF] p-3"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-extrabold tracking-widest text-gray-500">
              CÁC VÙNG IN TÙY CHỌN (TAY ÁO, CỔ...)
            </span>
            <button
              onClick={() =>
                setExtraAreas((prev) => [...prev, { name: "", url: "" }])
              }
              className="text-[#8B5CF6] font-bold text-sm bg-[#F3EBFF] rounded-xl px-3 py-2 border-0 cursor-pointer"
            >
              + Thêm vùng in
            </button>
          </div>
          {extraAreas.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-7 text-center text-gray-400 italic">
              Thiết kế này chưa có khu vực in phụ.
            </div>
          ) : (
            <div className="space-y-2">
              {extraAreas.map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  {/* Thumbnail nhỏ, hover xem ảnh lớn */}
                  <Popover
                    content={
                      a.url.trim() ? (
                        <div className="w-[260px] h-[260px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                          <SafeImg
                            key={a.url}
                            url={a.url.trim()}
                            alt={a.name || "Vùng in"}
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Chưa có ảnh
                        </span>
                      )
                    }
                    title={a.name || "Vùng in"}
                  >
                    <div className="w-[44px] h-[44px] shrink-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden cursor-zoom-in">
                      {a.url.trim() ? (
                        <SafeImg
                          key={a.url}
                          url={a.url.trim()}
                          alt={a.name || "Vùng in"}
                        />
                      ) : (
                        <span className="text-[8px] text-gray-300">Trống</span>
                      )}
                    </div>
                  </Popover>
                  <input
                    className="w-[160px] h-[44px] rounded-xl border-2 border-gray-200 px-3 text-sm outline-none box-border"
                    placeholder="Tên vùng (VD: Tay áo)"
                    value={a.name}
                    onChange={(e) =>
                      setExtraAreas((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                  />
                  <input
                    className="flex-1 h-[44px] rounded-xl border-2 border-gray-200 px-3 text-sm outline-none box-border"
                    placeholder="URL ảnh vùng in"
                    value={a.url}
                    onChange={(e) =>
                      setExtraAreas((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, url: e.target.value } : x
                        )
                      )
                    }
                  />
                  <UploadImgButton
                    size="small"
                    onUploaded={(url) =>
                      setExtraAreas((prev) =>
                        prev.map((x, idx) => (idx === i ? { ...x, url } : x))
                      )
                    }
                  />
                  <button
                    onClick={() =>
                      setExtraAreas((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-red-400 bg-transparent border-0 cursor-pointer text-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Giá trị bộ lọc "tất cả cửa hàng" */
const ALL_SHOPS = "__all__";

export default function Designs() {
  // Lấy thiết kế của TẤT CẢ cửa hàng để có thể lọc / tìm kiếm xuyên shop
  const { designs } = useDesigns({ allStores: true });
  const { add, update, remove, removeMany } = useDesignMutations();
  const { selectedStoreId } = usePodStore();
  const { stores } = useStores();
  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const shopLocked = selectedStore?.status === "locked";
  // Chỉ cho thêm thiết kế khi có shop và shop không bị khóa
  const hasStore = !!selectedStoreId && !shopLocked;
  const storeBlockMsg = !selectedStoreId
    ? "Bạn cần tạo cửa hàng trước khi thêm thiết kế"
    : "Cửa hàng đang bị khóa — không thể thêm thiết kế. Vui lòng liên hệ admin.";
  // Được phép thêm thiết kế nếu còn ít nhất 1 cửa hàng chưa bị khóa
  const canAdd = stores.some((s) => s.status !== "locked");
  const addBlockMsg = !stores.length
    ? "Bạn cần tạo cửa hàng trước khi thêm thiết kế"
    : "Tất cả cửa hàng đang bị khóa — không thể thêm thiết kế. Vui lòng liên hệ admin.";
  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState<string>(selectedStoreId || ALL_SHOPS);
  const [detail, setDetail] = useState<Design | null>(null);
  const [focusAreas, setFocusAreas] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tên shop theo id (dùng cho cột "Cửa hàng" + tìm kiếm theo tên shop)
  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    stores.forEach((s) => (map[s.id] = s.name));
    return map;
  }, [stores]);
  const shopNameOf = (d: Design) =>
    storeNameById[d.storeId || ""] || (d.storeId ? "Shop đã xóa" : "Chưa gán shop");

  // Đổi shop ở sidebar -> bộ lọc bám theo shop đó (trừ khi đang xem "tất cả")
  useEffect(() => {
    setShopFilter((prev) =>
      prev === ALL_SHOPS ? prev : selectedStoreId || ALL_SHOPS
    );
  }, [selectedStoreId]);

  const list = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return designs.filter((d) => {
      if (shopFilter !== ALL_SHOPS && (d.storeId || "") !== shopFilter)
        return false;
      if (!kw) return true;
      // Tìm theo mã SKU hoặc theo tên cửa hàng
      return (
        d.sku.toLowerCase().includes(kw) ||
        shopNameOf(d).toLowerCase().includes(kw)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs, search, shopFilter, storeNameById]);

  // Số kết quả nếu tìm trên toàn bộ shop (gợi ý mở rộng phạm vi tìm kiếm)
  const globalMatchCount = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return 0;
    return designs.filter(
      (d) =>
        d.sku.toLowerCase().includes(kw) ||
        shopNameOf(d).toLowerCase().includes(kw)
    ).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs, search, storeNameById]);

  // Trang hiện tại
  const paged = useMemo(
    () => list.slice((page - 1) * pageSize, page * pageSize),
    [list, page, pageSize]
  );

  // Reset trang khi tìm kiếm/đổi store; bỏ selection không còn tồn tại
  useEffect(() => {
    setPage(1);
  }, [search, shopFilter, selectedStoreId]);
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => designs.some((d) => d.id === id))
    );
  }, [designs]);

  // Shop mặc định khi mở form thêm mới: shop đang lọc (nếu không bị khóa),
  // ngược lại lấy shop đang chọn ở sidebar.
  const defaultFormStoreId = useMemo(() => {
    const filtered = stores.find((s) => s.id === shopFilter);
    if (filtered && filtered.status !== "locked") return filtered.id;
    return selectedStore && selectedStore.status !== "locked"
      ? selectedStore.id
      : "";
  }, [stores, shopFilter, selectedStore]);

  const pageIds = paged.map((d) => d.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const togglePage = (checked: boolean) =>
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...pageIds]))
        : prev.filter((id) => !pageIds.includes(id))
    );
  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );

  const handleBulkDelete = async () => {
    await removeMany.mutateAsync(selectedIds);
    message.success(`Đã xóa ${selectedIds.length} SKU`);
    setSelectedIds([]);
  };

  // Thanh chọn nhiều — nằm trên bảng cho dễ thấy
  const selectionBar = selectedIds.length > 0 && (
    <div className="bg-[#FBF6EC] border border-[#EADFC8] rounded-2xl px-4 py-3 flex items-center gap-4 flex-wrap">
      <span className="text-sm text-gray-600">
        Đã chọn <b className="text-[#171826]">{selectedIds.length}</b> SKU
      </span>
      <Popconfirm
        title={`Xóa ${selectedIds.length} SKU đã chọn?`}
        description="Hành động này không thể hoàn tác."
        okText="Xóa tất cả"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onConfirm={handleBulkDelete}
      >
        <Button danger loading={removeMany.isLoading}>
          Xóa đã chọn ({selectedIds.length})
        </Button>
      </Popconfirm>
      <button
        onClick={() => setSelectedIds([])}
        className="text-gray-400 text-sm bg-transparent border-0 cursor-pointer ml-auto"
      >
        Bỏ chọn tất cả
      </button>
    </div>
  );

  const paginationBar = (
    <div className="flex items-center justify-end p-4 border-t border-gray-100">
      <Pagination
        current={page}
        pageSize={pageSize}
        total={list.length}
        showSizeChanger
        pageSizeOptions={[10, 20, 50, 100, 200, 1000]}
        showTotal={(t) => `${t} SKU`}
        onChange={(p, ps) => {
          setPage(ps !== pageSize ? 1 : p);
          setPageSize(ps);
        }}
      />
    </div>
  );

  const handleSave = async (data: {
    sku: string;
    storeId: string;
    frontUrl: string;
    backUrl: string;
    mockupUrl: string;
    extraAreas: DesignExtraArea[];
  }) => {
    if (detail) {
      // Cập nhật SKU đang xem chi tiết
      await update.mutateAsync({
        id: detail.id,
        frontUrl: data.frontUrl,
        backUrl: data.backUrl,
        mockupUrl: data.mockupUrl,
        extraAreas: data.extraAreas,
      });
      message.success(`Đã cập nhật SKU ${detail.sku}`);
      setDetail(null);
      setFocusAreas(false);
      return;
    }
    // SKU chỉ cần duy nhất TRONG cùng 1 cửa hàng
    if (
      designs.some(
        (d) =>
          (d.storeId || "") === data.storeId &&
          d.sku.toLowerCase() === data.sku.toLowerCase()
      )
    ) {
      message.error("Mã SKU này đã tồn tại trong cửa hàng đã chọn");
      return;
    }
    await add.mutateAsync({
      ...data,
      testBg: "#FFFFFF",
      created: new Date().toISOString(),
    } as any);
    message.success(
      `Đã thêm thiết kế gốc mới vào shop ${
        storeNameById[data.storeId] || ""
      }`.trim()
    );
    setAddOpen(false);
  };

  const handleImport = async (file: File) => {
    if (!hasStore) {
      message.warning(storeBlockMsg);
      return;
    }
    const rows = parseCSV(await file.text());
    let count = 0;
    for (const r of rows) {
      const sku = r["SKU"] || r["sku"];
      if (!sku) continue;
      // Import luôn vào cửa hàng đang chọn ở sidebar
      const existing = designs.find(
        (d) => d.sku === sku && (d.storeId || "") === selectedStoreId
      );
      const data = {
        sku,
        frontUrl: r["Front"] || r["frontUrl"] || "",
        backUrl: r["Back"] || r["backUrl"] || "",
        mockupUrl: r["Mockup"] || r["mockupUrl"] || "",
      };
      if (existing) await update.mutateAsync({ id: existing.id, ...data });
      else
        await add.mutateAsync({
          ...data,
          storeId: selectedStoreId,
          extraAreas: [],
          testBg: "#FFFFFF",
          created: new Date().toISOString(),
        } as any);
      count++;
    }
    message.success(
      `Đã nhập ${count} SKU từ CSV vào shop ${selectedStore?.name || ""}`.trim()
    );
  };

  // Xuất đúng những gì đang hiển thị (theo bộ lọc shop + từ khóa tìm kiếm)
  const handleExport = () => {
    downloadCSV(
      "designs.csv",
      toCSV(
        ["Shop", "SKU", "Front", "Back", "Mockup"],
        list.map((d) => [
          shopNameOf(d),
          d.sku,
          d.frontUrl,
          d.backUrl,
          d.mockupUrl,
        ])
      )
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171826] m-0 flex items-center gap-3">
            Thư viện Thiết kế & SKU
            <span className="text-xs font-bold bg-[#FBF6EC] text-[#B79351] border border-[#EADFC8] rounded-full px-2.5 py-1">
              {list.length}
              {list.length !== designs.length ? `/${designs.length}` : ""} SKU
            </span>
          </h1>
          <p className="text-gray-500 m-0 mt-1 max-w-md">
            Quản lý kho tài nguyên in ấn của tất cả cửa hàng. Có thể chỉnh sửa
            nhanh link ảnh trực tiếp trên bảng.
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
          <div className="flex gap-2 flex-wrap">
            <Select
              className="w-full sm:w-[210px]"
              value={shopFilter}
              onChange={setShopFilter}
              showSearch
              optionFilterProp="label"
              options={[
                {
                  value: ALL_SHOPS,
                  label: `Tất cả cửa hàng (${designs.length})`,
                },
                ...stores.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${
                    designs.filter((d) => (d.storeId || "") === s.id).length
                  })`,
                })),
              ]}
            />
            <Input
              prefix={<FiSearch className="text-gray-400" />}
              placeholder="Tìm mã SKU / tên shop..."
              className="w-full sm:w-[220px] rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
            <Button
              disabled={!hasStore}
              onClick={() => fileRef.current?.click()}
            >
              Nhập CSV
            </Button>
            <Button onClick={handleExport}>Xuất CSV</Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </div>
          <Tooltip title={canAdd ? "" : addBlockMsg}>
            <Button
              type="primary"
              className={canAdd ? "bg-[#171826]" : ""}
              icon={<FiPlus />}
              disabled={!canAdd}
              onClick={() => {
                if (!canAdd) {
                  message.warning(addBlockMsg);
                  return;
                }
                setAddOpen(true);
              }}
            >
              Thêm Mới Gốc
            </Button>
          </Tooltip>
          {/* Gợi ý mở rộng tìm kiếm ra toàn bộ cửa hàng */}
          {search.trim() &&
            shopFilter !== ALL_SHOPS &&
            globalMatchCount > list.length && (
              <button
                onClick={() => setShopFilter(ALL_SHOPS)}
                className="text-xs text-[#B79351] bg-transparent border-0 cursor-pointer p-0 text-left sm:text-right"
              >
                Có <b>{globalMatchCount}</b> kết quả ở tất cả cửa hàng — bấm để
                tìm trên toàn bộ shop
              </button>
            )}
        </div>
      </div>

      {selectionBar}

      {/* Bảng (tablet ngang / desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[1100px]">
          <thead>
            <tr className="text-left text-[11px] tracking-widest text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="p-4 w-10">
                <Checkbox
                  checked={allPageSelected}
                  indeterminate={
                    !allPageSelected &&
                    pageIds.some((id) => selectedIds.includes(id))
                  }
                  onChange={(e) => togglePage(e.target.checked)}
                />
              </th>
              <th className="p-4">CỬA HÀNG (SHOP)</th>
              <th className="p-4">MÃ ĐỊNH DANH (SKU)</th>
              <th className="p-4">MẶT TRƯỚC (FRONT)</th>
              <th className="p-4">MẶT SAU (BACK)</th>
              <th className="p-4">MOCKUP SP</th>
              <th className="p-4">VÙNG IN PHỤ</th>
              <th className="p-4">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((d) => (
              <tr
                key={d.id}
                className={`border-b border-gray-50 align-top transition-colors ${
                  selectedIds.includes(d.id)
                    ? "bg-[#FBF6EC]"
                    : "hover:bg-gray-50/60"
                }`}
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedIds.includes(d.id)}
                    onChange={(e) => toggleOne(d.id, e.target.checked)}
                  />
                </td>
                <td className="p-4">
                  <Tooltip
                    title={
                      <span>
                        {shopNameOf(d)}
                        <br />
                        <span className="text-[11px] opacity-70">
                          Bấm để lọc theo cửa hàng này
                        </span>
                      </span>
                    }
                  >
                    <button
                      onClick={() => setShopFilter(d.storeId || "")}
                      className="inline-flex items-center gap-1.5 max-w-[160px] text-xs font-bold text-[#B79351] bg-[#FBF6EC] border border-[#EADFC8] rounded-full px-2.5 py-1 cursor-pointer hover:bg-[#F5EBD8] transition-colors"
                    >
                      <FiShoppingBag size={12} className="shrink-0" />
                      <span className="truncate">{shopNameOf(d)}</span>
                    </button>
                  </Tooltip>
                </td>
                <td className="p-4">
                  <div className="font-extrabold text-[#171826] text-lg">
                    {d.sku}
                  </div>
                  <div className="text-[10px] tracking-widest text-gray-400 mt-2 mb-1">
                    NỀN ƯỚM THỬ
                  </div>
                  <TestBgPicker
                    value={d.testBg || "#FFFFFF"}
                    onChange={(color) =>
                      update.mutate({ id: d.id, testBg: color })
                    }
                  />
                </td>
                <td className="p-4">
                  <ImgCell
                    url={d.frontUrl}
                    tag="FRONT"
                    tagColor="#3B82F6"
                    placeholder="NO IMAGE"
                    bg={d.testBg}
                    onChange={(v) => update.mutate({ id: d.id, frontUrl: v })}
                  />
                </td>
                <td className="p-4">
                  <ImgCell
                    url={d.backUrl}
                    tag="BACK"
                    tagColor="#8B5CF6"
                    placeholder="NO IMAGE"
                    bg={d.testBg}
                    onChange={(v) => update.mutate({ id: d.id, backUrl: v })}
                  />
                </td>
                <td className="p-4">
                  <ImgCell
                    url={d.mockupUrl}
                    tag="MOCKUP"
                    tagColor="#059669"
                    placeholder="NO MOCKUP"
                    onChange={(v) => update.mutate({ id: d.id, mockupUrl: v })}
                  />
                </td>
                <td className="p-4">
                  {d.extraAreas?.length ? (
                    <div className="space-y-1">
                      {d.extraAreas.map((a: DesignExtraArea, i: number) => (
                        <Popover
                          key={i}
                          title={a.name}
                          content={
                            a.url ? (
                              <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                                <SafeImg key={a.url} url={a.url} alt={a.name} />
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                Chưa có ảnh
                              </span>
                            )
                          }
                        >
                          <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-zoom-in bg-gray-50 border border-gray-200 rounded-full pl-1 pr-2.5 py-1 hover:border-[#C6A15B] transition-colors">
                            <span className="w-[22px] h-[22px] bg-white border border-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                              {a.url ? (
                                <SafeImg key={a.url} url={a.url} alt={a.name} />
                              ) : (
                                <span className="text-[7px] text-gray-300">
                                  –
                                </span>
                              )}
                            </span>
                            {a.name}
                          </div>
                        </Popover>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Không có</span>
                  )}
                  <button
                    onClick={() => {
                      setFocusAreas(true);
                      setDetail(d);
                    }}
                    className="mt-2 block text-xs text-[#8B5CF6] bg-[#F3EBFF] rounded-lg px-2 py-1 border-0 cursor-pointer"
                  >
                    + Thêm/Sửa vùng phụ
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 items-center">
                    <Tooltip title="Xem / cập nhật chi tiết">
                      <button
                        onClick={() => setDetail(d)}
                        className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-[#171826] flex items-center justify-center cursor-pointer hover:border-[#C6A15B] hover:text-[#C6A15B] transition-colors"
                      >
                        <FiEdit3 size={15} />
                      </button>
                    </Tooltip>
                    <Popconfirm
                      title={`Xóa SKU "${d.sku}"?`}
                      description="Hành động này không thể hoàn tác."
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => remove.mutate(d.id)}
                    >
                      <Tooltip title="Xóa SKU">
                        <button className="w-9 h-9 rounded-lg border border-red-100 bg-red-50 text-red-500 flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white transition-colors">
                          <FiTrash2 size={15} />
                        </button>
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={8} className="p-16 text-center text-gray-400">
                  {search.trim()
                    ? "Không tìm thấy SKU nào khớp với từ khóa"
                    : hasStore
                    ? 'Chưa có SKU nào — bấm "Thêm Mới Gốc" để bắt đầu'
                    : "Bạn chưa có cửa hàng — vào Quản lý Cửa hàng để kết nối store trước, sau đó mới thêm được thiết kế"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {list.length > 0 && paginationBar}
      </div>

      {/* Card view (mobile) */}
      <div className="md:hidden space-y-4">
        {paged.map((d) => (
          <div
            key={d.id}
            className={`bg-white rounded-2xl border p-4 space-y-3 ${
              selectedIds.includes(d.id)
                ? "border-[#C6A15B] bg-[#FBF6EC]"
                : "border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.includes(d.id)}
                    onChange={(e) => toggleOne(d.id, e.target.checked)}
                  />
                  <div className="font-extrabold text-[#171826] text-lg">
                    {d.sku}
                  </div>
                </div>
                <Tooltip title={shopNameOf(d)}>
                  <button
                    onClick={() => setShopFilter(d.storeId || "")}
                    className="mt-2 inline-flex items-center gap-1.5 max-w-[190px] text-xs font-bold text-[#B79351] bg-[#FBF6EC] border border-[#EADFC8] rounded-full px-2.5 py-1 cursor-pointer"
                  >
                    <FiShoppingBag size={12} className="shrink-0" />
                    <span className="truncate">{shopNameOf(d)}</span>
                  </button>
                </Tooltip>
                <div className="text-[10px] tracking-widest text-gray-400 mt-2 mb-1">
                  NỀN ƯỚM THỬ
                </div>
                <TestBgPicker
                  value={d.testBg || "#FFFFFF"}
                  onChange={(color) =>
                    update.mutate({ id: d.id, testBg: color })
                  }
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Tooltip title="Xem / cập nhật chi tiết">
                  <button
                    onClick={() => setDetail(d)}
                    className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-[#171826] flex items-center justify-center cursor-pointer hover:border-[#C6A15B] hover:text-[#C6A15B] transition-colors"
                  >
                    <FiEdit3 size={15} />
                  </button>
                </Tooltip>
                <Popconfirm
                  title={`Xóa SKU "${d.sku}"?`}
                  description="Hành động này không thể hoàn tác."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => remove.mutate(d.id)}
                >
                  <Tooltip title="Xóa SKU">
                    <button className="w-9 h-9 rounded-lg border border-red-100 bg-red-50 text-red-500 flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ImgCell
                fluid
                url={d.frontUrl}
                tag="FRONT"
                tagColor="#3B82F6"
                placeholder="NO IMAGE"
                bg={d.testBg}
                onChange={(v) => update.mutate({ id: d.id, frontUrl: v })}
              />
              <ImgCell
                fluid
                url={d.backUrl}
                tag="BACK"
                tagColor="#8B5CF6"
                placeholder="NO IMAGE"
                bg={d.testBg}
                onChange={(v) => update.mutate({ id: d.id, backUrl: v })}
              />
              <ImgCell
                fluid
                url={d.mockupUrl}
                tag="MOCKUP"
                tagColor="#059669"
                placeholder="NO MOCKUP"
                onChange={(v) => update.mutate({ id: d.id, mockupUrl: v })}
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-500">
                Vùng in phụ:{" "}
                {d.extraAreas?.length
                  ? d.extraAreas.map((a) => a.name).join(", ")
                  : "Không có"}
              </span>
              <button
                onClick={() => {
                  setFocusAreas(true);
                  setDetail(d);
                }}
                className="text-xs text-[#8B5CF6] bg-[#F3EBFF] rounded-lg px-2 py-1 border-0 cursor-pointer shrink-0"
              >
                + Thêm/Sửa vùng phụ
              </button>
            </div>
          </div>
        ))}
        {!list.length && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            {search.trim()
              ? "Không tìm thấy SKU nào khớp với từ khóa"
              : hasStore
              ? 'Chưa có SKU nào — bấm "Thêm Mới Gốc" để bắt đầu'
              : "Bạn chưa có cửa hàng — vào Quản lý Cửa hàng để kết nối store trước"}
          </div>
        )}
        {list.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100">
            {paginationBar}
          </div>
        )}
      </div>

      <DesignFormModal
        open={addOpen || !!detail}
        initial={detail}
        focusAreas={focusAreas}
        stores={stores}
        defaultStoreId={defaultFormStoreId}
        storeName={detail ? shopNameOf(detail) : ""}
        saving={add.isLoading || update.isLoading}
        onClose={() => {
          setAddOpen(false);
          setDetail(null);
          setFocusAreas(false);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
