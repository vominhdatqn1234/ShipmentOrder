import {
  Button,
  Checkbox,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Popover,
  Tooltip,
  message,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiPlus, FiEdit3, FiTrash2, FiImage } from "react-icons/fi";
import { useDesignMutations, useDesigns } from "../../../hooks/usePod";
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

const SWATCHES = ["#FFFFFF", "#111111", "#2B4A8B", "#7B2430"];

/** Dãy swatch màu nền ướm thử + nút chọn màu tùy ý (color picker) */
function TestBgPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const timer = useRef<any>(null);
  const isCustom = !!value && !SWATCHES.includes(value);
  const debounced = (color: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(color), 350);
  };
  return (
    <div className="flex gap-1.5 items-center">
      {SWATCHES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          className={`w-5 h-5 rounded-full cursor-pointer border-2 ${
            value === c ? "border-[#C6A15B]" : "border-gray-200"
          }`}
          style={{ background: c }}
        />
      ))}
      {/* Màu tùy chọn */}
      <label
        title="Chọn màu tùy ý"
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
          value={/^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#F9FAFB"}
          onChange={(e) => debounced(e.target.value)}
        />
      </label>
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

function DesignFormModal({
  open,
  initial,
  focusAreas,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  initial?: Design | null;
  focusAreas?: boolean;
  onClose: () => void;
  onSave: (data: {
    sku: string;
    frontUrl: string;
    backUrl: string;
    mockupUrl: string;
    extraAreas: DesignExtraArea[];
  }) => void;
  saving: boolean;
}) {
  const isEdit = !!initial;
  const [sku, setSku] = useState("");
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const [mockupUrl, setMockupUrl] = useState("");
  const [extraAreas, setExtraAreas] = useState<DesignExtraArea[]>([]);
  const [highlightAreas, setHighlightAreas] = useState(false);
  const areasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setSku(initial?.sku || "");
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
  }, [open, initial, focusAreas]);

  const reset = () => {
    setSku("");
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
              onSave({
                sku: sku.trim(),
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

export default function Designs() {
  const { designs } = useDesigns();
  const { add, update, remove, removeMany } = useDesignMutations();
  const { selectedStoreId } = usePodStore();
  const hasStore = !!selectedStoreId;
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Design | null>(null);
  const [focusAreas, setFocusAreas] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(
    () =>
      designs.filter(
        (d) => !search || d.sku.toLowerCase().includes(search.toLowerCase())
      ),
    [designs, search]
  );

  // Trang hiện tại
  const paged = useMemo(
    () => list.slice((page - 1) * pageSize, page * pageSize),
    [list, page, pageSize]
  );

  // Reset trang khi tìm kiếm/đổi store; bỏ selection không còn tồn tại
  useEffect(() => {
    setPage(1);
  }, [search, selectedStoreId]);
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => designs.some((d) => d.id === id))
    );
  }, [designs]);

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
    if (designs.some((d) => d.sku.toLowerCase() === data.sku.toLowerCase())) {
      message.error("Mã SKU này đã tồn tại trong thư viện");
      return;
    }
    await add.mutateAsync({
      ...data,
      testBg: "#FFFFFF",
      created: new Date().toISOString(),
    } as any);
    message.success("Đã thêm thiết kế gốc mới");
    setAddOpen(false);
  };

  const handleImport = async (file: File) => {
    if (!hasStore) {
      message.warning("Bạn cần tạo cửa hàng trước khi thêm thiết kế");
      return;
    }
    const rows = parseCSV(await file.text());
    let count = 0;
    for (const r of rows) {
      const sku = r["SKU"] || r["sku"];
      if (!sku) continue;
      const existing = designs.find((d) => d.sku === sku);
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
          extraAreas: [],
          testBg: "#FFFFFF",
          created: new Date().toISOString(),
        } as any);
      count++;
    }
    message.success(`Đã nhập ${count} SKU từ CSV`);
  };

  const handleExport = () => {
    downloadCSV(
      "designs.csv",
      toCSV(
        ["SKU", "Front", "Back", "Mockup"],
        designs.map((d) => [d.sku, d.frontUrl, d.backUrl, d.mockupUrl])
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
              {designs.length} SKU
            </span>
          </h1>
          <p className="text-gray-500 m-0 mt-1 max-w-md">
            Quản lý kho tài nguyên in ấn. Có thể chỉnh sửa nhanh link ảnh trực
            tiếp trên bảng.
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
          <div className="flex gap-2 flex-wrap">
            <Input
              prefix={<FiSearch className="text-gray-400" />}
              placeholder="Tìm theo mã SKU..."
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
          <Tooltip
            title={
              hasStore
                ? ""
                : "Bạn cần tạo cửa hàng trước khi thêm thiết kế (Quản lý Cửa hàng → Kết nối Store mới)"
            }
          >
            <Button
              type="primary"
              className={hasStore ? "bg-[#171826]" : ""}
              icon={<FiPlus />}
              disabled={!hasStore}
              onClick={() => {
                if (!hasStore) {
                  message.warning(
                    "Bạn cần tạo cửa hàng trước khi thêm thiết kế"
                  );
                  return;
                }
                setAddOpen(true);
              }}
            >
              Thêm Mới Gốc
            </Button>
          </Tooltip>
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
                <td colSpan={7} className="p-16 text-center text-gray-400">
                  {hasStore
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
            {hasStore
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
