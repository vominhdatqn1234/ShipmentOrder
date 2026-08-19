/**
 * Bảng nhập liệu kiểu Excel (không dùng thư viện ngoài).
 *
 * Hỗ trợ:
 *  - Chọn ô / kéo chọn vùng / Shift+click mở rộng vùng / Ctrl+A chọn tất cả
 *  - Di chuyển bằng ← ↑ → ↓, Tab / Shift+Tab, Enter / Shift+Enter, Home/End
 *  - Gõ để sửa ngay, F2 hoặc nháy đúp để sửa, Esc huỷ, Enter lưu
 *  - Ctrl/Cmd + C / X / V: copy - cắt - dán NHIỀU Ô (định dạng TSV như Excel)
 *  - Dán vượt số dòng hiện có sẽ tự thêm dòng mới
 *  - Delete / Backspace: xoá nội dung vùng đang chọn
 *  - Ctrl/Cmd + D: điền xuống (fill down) từ dòng đầu vùng chọn
 *  - Ctrl/Cmd + Z / Shift+Z: hoàn tác / làm lại
 */
import { message } from "antd";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown } from "react-icons/fi";

export interface GridColumn {
  key: string;
  label: string;
  required?: boolean;
  width: number;
  /** Có options = ô dạng chọn (dropdown) thay vì gõ tay */
  options?: { value: string; label: string }[];
}

export type GridRowData = Record<string, string>;

interface Sel {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

const norm = (s: Sel) => ({
  r1: Math.min(s.r1, s.r2),
  r2: Math.max(s.r1, s.r2),
  c1: Math.min(s.c1, s.c2),
  c2: Math.max(s.c1, s.c2),
});

/* -------------------------------- 1 dòng -------------------------------- */

const Row = memo(function Row({
  row,
  rowIndex,
  columns,
  selC1,
  selC2,
  activeC,
  editC,
  isLastSelRow,
  fillMark,
  onFillStart,
  onCellDown,
  onCellEnter,
  onCellDouble,
  onCellContext,
  onEditCommit,
  onRowHeaderDown,
}: {
  row: GridRowData;
  rowIndex: number;
  columns: GridColumn[];
  /** Cột bắt đầu/kết thúc vùng chọn trên dòng này (-1 = dòng không được chọn) */
  selC1: number;
  selC2: number;
  activeC: number;
  editC: number;
  /** Dòng cuối vùng chọn -> hiện nút vuông kéo copy xuống (fill handle) */
  isLastSelRow: boolean;
  /** Dòng đang nằm trong vùng kéo copy (xem trước) */
  fillMark: boolean;
  onFillStart: (e: React.MouseEvent) => void;
  onCellDown: (e: React.MouseEvent, r: number, c: number) => void;
  onCellEnter: (r: number, c: number) => void;
  onCellDouble: (r: number, c: number) => void;
  onCellContext: (e: React.MouseEvent, r: number, c: number) => void;
  onEditCommit: (value: string, key: "enter" | "tab" | "esc" | "blur") => void;
  onRowHeaderDown: (e: React.MouseEvent, r: number) => void;
}) {
  const selected = selC1 >= 0;
  return (
    <tr>
      <td
        onMouseDown={(e) => onRowHeaderDown(e, rowIndex)}
        className={`sticky left-0 z-[1] px-2 text-[10px] text-gray-400 text-center border-b border-r border-gray-100 cursor-pointer select-none ${
          selected ? "bg-[#F2EAD9]" : "bg-gray-50"
        }`}
      >
        {rowIndex + 1}
      </td>
      {columns.map((col, c) => {
        const inSel = selected && c >= selC1 && c <= selC2;
        const isActive = activeC === c;
        const isEditing = editC === c;
        const missing = col.required && !String(row[col.key] || "").trim();
        return (
          <td
            key={col.key}
            data-cell={`${rowIndex}-${c}`}
            onMouseDown={(e) => onCellDown(e, rowIndex, c)}
            onMouseEnter={() => onCellEnter(rowIndex, c)}
            onDoubleClick={() => onCellDouble(rowIndex, c)}
            onContextMenu={(e) => onCellContext(e, rowIndex, c)}
            style={{ minWidth: col.width, maxWidth: col.width }}
            className={`relative h-[30px] px-0 border-b border-r border-gray-100 align-middle select-none ${
              isEditing
                ? "bg-white"
                : inSel
                ? "bg-[#FBF6EC]"
                : missing
                ? "bg-[#FDECEC]"
                : "bg-white"
            } ${
              fillMark && c >= selC1 && c <= selC2
                ? "bg-[#FDF6E6] outline-dashed outline-1 -outline-offset-1 outline-[#C6A15B]"
                : ""
            } ${isActive && !isEditing ? "outline outline-2 -outline-offset-2 outline-[#C6A15B]" : ""}`}
          >
            {isEditing ? (
              col.options ? (
                <EditSelect
                  initial={row[col.key] || ""}
                  options={col.options}
                  onCommit={onEditCommit}
                />
              ) : (
                <EditInput
                  initial={row[col.key] || ""}
                  onCommit={onEditCommit}
                />
              )
            ) : col.options ? (
              <div className="group flex items-center gap-1 pl-2 pr-1 h-[30px] cursor-pointer">
                <span
                  className={`text-[12px] truncate flex-1 ${
                    row[col.key] ? "" : "text-gray-300"
                  }`}
                >
                  {row[col.key] || "Chọn..."}
                </span>
                <span className="w-[18px] h-[18px] shrink-0 rounded border border-gray-300 bg-gray-50 text-gray-500 flex items-center justify-center group-hover:border-[#C6A15B] group-hover:text-[#C6A15B] group-hover:bg-[#FBF6EC] transition-colors">
                  <FiChevronDown size={12} />
                </span>
              </div>
            ) : (
              <div className="px-2 text-[12px] leading-[30px] truncate">
                {row[col.key] || ""}
              </div>
            )}
            {isLastSelRow && inSel && c === selC2 && !isEditing && (
              <span
                onMouseDown={onFillStart}
                title="Kéo xuống để copy giá trị (fill)"
                className="absolute -bottom-[3px] -right-[3px] w-[7px] h-[7px] bg-[#C6A15B] border border-white rounded-[1px] cursor-crosshair z-[2]"
              />
            )}
          </td>
        );
      })}
    </tr>
  );
});

/** Ô đang sửa — input không kiểm soát để gõ không làm render lại cả bảng */
function EditInput({
  initial,
  onCommit,
}: {
  initial: string;
  onCommit: (value: string, key: "enter" | "tab" | "esc" | "blur") => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    // Gõ ký tự để vào chế độ sửa -> con trỏ ở cuối; F2/nháy đúp -> bôi đen
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  return (
    <input
      ref={ref}
      defaultValue={initial}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onCommit(e.currentTarget.value, "enter");
        } else if (e.key === "Tab") {
          e.preventDefault();
          e.stopPropagation();
          onCommit(e.currentTarget.value, "tab");
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCommit(initial, "esc");
        } else {
          // Không để phím mũi tên / ký tự lọt lên grid
          e.stopPropagation();
        }
      }}
      onBlur={(e) => onCommit(e.currentTarget.value, "blur")}
      className="cell-editor w-full h-[30px] px-2 text-[12px] border-0 outline outline-2 -outline-offset-2 outline-[#C6A15B] bg-white"
    />
  );
}

/**
 * Ô dạng chọn — tự vẽ danh sách (thẻ select gốc không mở được bằng code trên
 * mọi trình duyệt). Danh sách dùng position fixed nên không bị bảng cắt mất.
 */
function EditSelect({
  initial,
  options,
  onCommit,
}: {
  initial: string;
  options: { value: string; label: string }[];
  onCommit: (value: string, key: "enter" | "tab" | "esc" | "blur") => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{
    left: number;
    top: number;
    width: number;
    up: boolean;
  } | null>(null);
  const items = useMemo(
    () => [{ value: "", label: "— Trống —" }, ...options],
    [options]
  );
  const [hi, setHi] = useState(() => {
    const i = options.findIndex((o) => o.value === initial);
    return i < 0 ? 0 : i + 1;
  });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const listH = Math.min(240, items.length * 30 + 8);
    const up = r.bottom + listH > window.innerHeight && r.top > listH;
    setRect({
      left: r.left,
      top: up ? r.top - listH - 2 : r.bottom + 2,
      width: Math.max(160, r.width),
      up,
    });
    el.focus();
  }, [items.length]);

  // Bấm ra ngoài -> đóng, giữ nguyên giá trị cũ.
  // Phải đăng ký ở tick sau: nếu gắn ngay, chính cú click vừa mở dropdown sẽ
  // lọt vào listener này và đóng lại lập tức (nhìn như dropdown không hiện).
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      onCommit(initial, "blur");
    };
    const t = window.setTimeout(
      () => window.addEventListener("mousedown", onDown),
      0
    );
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHi((i) => Math.min(items.length - 1, i + 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHi((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          onCommit(items[hi]?.value ?? initial, e.key === "Tab" ? "tab" : "enter");
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCommit(initial, "esc");
        }
      }}
      className="relative h-[30px] pl-2 pr-1 flex items-center gap-1 outline outline-2 -outline-offset-2 outline-[#C6A15B] bg-white cursor-pointer"
    >
      <span
        className={`text-[12px] truncate flex-1 ${
          initial ? "" : "text-gray-300"
        }`}
      >
        {initial || "Chọn..."}
      </span>
      <span className="w-[18px] h-[18px] shrink-0 rounded border border-[#C6A15B] bg-[#FBF6EC] text-[#B79351] flex items-center justify-center">
        <FiChevronDown size={12} className="rotate-180" />
      </span>

      {/* Đưa ra ngoài body: tránh bị bảng cắt hoặc lớp phủ của modal che mất */}
      {rect &&
        createPortal(
          <div
            ref={dropRef}
            style={{ left: rect.left, top: rect.top, width: rect.width }}
            className="fixed z-[3000] max-h-[240px] overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          >
            {items.map((o, i) => (
              <button
                key={o.value || "__empty"}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCommit(o.value, "enter");
                }}
                className={`w-full text-left px-3 py-1.5 text-[12px] border-0 cursor-pointer truncate ${
                  i === hi ? "bg-[#FBF6EC] text-[#171826]" : "bg-transparent"
                } ${o.value ? "" : "text-gray-400"} ${
                  o.value === initial ? "font-bold" : ""
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* -------------------------------- Bảng ---------------------------------- */

export default function ExcelGrid({
  columns,
  rows,
  onRowsChange,
  makeEmptyRow,
  pageSize = 100,
}: {
  columns: GridColumn[];
  rows: GridRowData[];
  onRowsChange: (rows: GridRowData[]) => void;
  /** Tạo dòng trống khi dán vượt số dòng hiện có */
  makeEmptyRow: () => GridRowData;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Sel>({ r1: 0, c1: 0, r2: 0, c2: 0 });
  const [active, setActive] = useState({ r: 0, c: 0 });
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null);
  // Giữ ô đang sửa ở ref: khi bấm sang ô khác, input bị gỡ khỏi DOM trước cả
  // sự kiện blur -> vẫn lấy lại được giá trị vừa gõ để lưu.
  const editingRef = useRef<{ r: number; c: number } | null>(null);
  const dragging = useRef(false);
  // Vị trí con trỏ + vòng lặp tự cuộn khi kéo chọn chạm mép bảng (giống Excel)
  const pointer = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  // Kéo nút vuông góc dưới phải để copy giá trị xuống/lên (fill như Excel)
  const filling = useRef(false);
  const [fillTo, setFillTo] = useState<number | null>(null);
  const flushEditRef = useRef<() => void>(() => {});
  const applyFillRef = useRef<() => void>(() => {});
  const wrapRef = useRef<HTMLDivElement>(null);
  const undoStack = useRef<GridRowData[][]>([]);
  const redoStack = useRef<GridRowData[][]>([]);
  // Theo dõi thay đổi dữ liệu để ghi lịch sử hoàn tác
  const lastRows = useRef<GridRowData[]>(rows);
  const selfChange = useRef(false);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = useMemo(
    () => rows.slice(start, start + pageSize),
    [rows, start, pageSize]
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* --------------------------- Ghi dữ liệu + undo -------------------------- */

  const commitRows = useCallback(
    (next: GridRowData[]) => {
      selfChange.current = true;
      undoStack.current.push(rows);
      if (undoStack.current.length > 60) undoStack.current.shift();
      redoStack.current = [];
      onRowsChange(next);
    },
    [rows, onRowsChange]
  );

  /**
   * Dữ liệu bị đổi từ BÊN NGOÀI bảng (nút "Thêm dòng", đọc lại sheet...) cũng
   * được ghi vào lịch sử để Ctrl+Z hoàn tác được luôn.
   */
  useEffect(() => {
    if (rows === lastRows.current) return;
    if (!selfChange.current) {
      undoStack.current.push(lastRows.current);
      if (undoStack.current.length > 60) undoStack.current.shift();
      redoStack.current = [];
    }
    selfChange.current = false;
    lastRows.current = rows;
  }, [rows]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) {
      message.info("Không còn thao tác nào để hoàn tác");
      return;
    }
    selfChange.current = true;
    redoStack.current.push(rows);
    onRowsChange(prev);
  }, [rows, onRowsChange]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    selfChange.current = true;
    undoStack.current.push(rows);
    onRowsChange(next);
  }, [rows, onRowsChange]);

  /**
   * Ctrl/⌘ + Z ở mức cửa sổ — hoàn tác được kể cả khi con trỏ đang ở nút bấm
   * hay ô tìm kiếm ngoài bảng. Đang gõ trong ô nhập thì nhường undo của ô đó.
   */
  useEffect(() => {
    const onWinKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const el = e.target as HTMLElement | null;
      const tag = (el?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onWinKey);
    return () => window.removeEventListener("keydown", onWinKey);
  }, [undo, redo]);

  /* ------------------------------ Chọn / focus ----------------------------- */


  const stopAutoScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
      stopAutoScroll();
      if (filling.current) applyFillRef.current();
    };
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  /**
   * Kéo chọn tới sát mép bảng -> tự cuộn tiếp và mở rộng vùng chọn theo ô đang
   * nằm dưới con trỏ (giống thao tác bôi đen kéo dài bên Excel).
   */
  const autoScrollStep = useCallback(() => {
    const el = wrapRef.current;
    if (!el || (!dragging.current && !filling.current)) {
      stopAutoScroll();
      return;
    }
    const r = el.getBoundingClientRect();
    const { x, y } = pointer.current;
    const EDGE = 40; // vùng mép kích hoạt cuộn
    const MAX = 24; // tốc độ cuộn tối đa mỗi khung hình
    let dx = 0;
    let dy = 0;
    if (y > r.bottom - EDGE)
      dy = Math.min(MAX, ((y - (r.bottom - EDGE)) / EDGE) * MAX);
    else if (y < r.top + EDGE)
      dy = -Math.min(MAX, ((r.top + EDGE - y) / EDGE) * MAX);
    if (x > r.right - EDGE)
      dx = Math.min(MAX, ((x - (r.right - EDGE)) / EDGE) * MAX);
    else if (x < r.left + EDGE)
      dx = -Math.min(MAX, ((r.left + EDGE - x) / EDGE) * MAX);
    if (dx || dy) {
      el.scrollLeft += dx;
      el.scrollTop += dy;
    }
    // Ô dưới con trỏ (kẹp trong khung bảng) -> mở rộng vùng chọn tới đó
    const cx = Math.max(r.left + 2, Math.min(r.right - 2, x));
    const cy = Math.max(r.top + 2, Math.min(r.bottom - 2, y));
    const hit = document
      .elementFromPoint(cx, cy)
      ?.closest("[data-cell]") as HTMLElement | null;
    const key = hit?.getAttribute("data-cell");
    if (key) {
      const [rr, cc] = key.split("-").map(Number);
      if (filling.current) setFillTo((v) => (v === rr ? v : rr));
      else
        setSel((s) =>
          s.r2 === rr && s.c2 === cc ? s : { ...s, r2: rr, c2: cc }
        );
    }
    rafRef.current = requestAnimationFrame(autoScrollStep);
  }, [stopAutoScroll]);

  const onGridMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current && !filling.current) return;
      pointer.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(autoScrollStep);
    },
    [autoScrollStep]
  );

  const focusGrid = () => wrapRef.current?.focus();

  const onCellDown = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      flushEditRef.current();
      if (e.shiftKey) {
        // Shift + giữ chuột kéo -> mở rộng vùng chọn liên tục
        dragging.current = true;
        setSel((s) => ({ ...s, r2: r, c2: c }));
        return;
      }
      setSel({ r1: r, c1: c, r2: r, c2: c });
      setActive({ r, c });
      // Cột dạng chọn: bấm 1 lần là mở dropdown luôn cho nhanh
      if (columns[c]?.options) {
        editingRef.current = { r, c };
        setEditing({ r, c });
        return;
      }
      dragging.current = true;
      setEditing(null);
    },
    [columns]
  );

  const onCellEnter = useCallback((r: number, c: number) => {
    if (filling.current) {
      setFillTo(r);
      return;
    }
    if (!dragging.current) return;
    setSel((s) => ({ ...s, r2: r, c2: c }));
  }, []);

  const onRowHeaderDown = useCallback(
    (e: React.MouseEvent, r: number) => {
      flushEditRef.current();
      dragging.current = true;
      setSel({ r1: r, c1: 0, r2: r, c2: columns.length - 1 });
      setActive({ r, c: 0 });
      setEditing(null);
    },
    [columns.length]
  );

  const startEdit = useCallback((r: number, c: number) => {
    editingRef.current = { r, c };
    setEditing({ r, c });
  }, []);

  const onCellDouble = useCallback(
    (r: number, c: number) => {
      setActive({ r, c });
      startEdit(r, c);
    },
    [startEdit]
  );

  /** Đưa ô đang chọn về trong tầm nhìn + đổi trang nếu cần */
  const goTo = useCallback(
    (r: number, c: number, extend = false) => {
      const rr = Math.max(0, Math.min(rows.length - 1, r));
      const cc = Math.max(0, Math.min(columns.length - 1, c));
      setActive({ r: rr, c: cc });
      setSel((s) => (extend ? { ...s, r2: rr, c2: cc } : { r1: rr, c1: cc, r2: rr, c2: cc }));
      const targetPage = Math.floor(rr / pageSize) + 1;
      setPage((p) => (p === targetPage ? p : targetPage));
      window.requestAnimationFrame(() => {
        document
          .querySelector(`[data-cell="${rr}-${cc}"]`)
          ?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    },
    [rows.length, columns.length, pageSize]
  );

  /* ------------------------------ Sửa 1 ô ------------------------------- */

  const setCell = useCallback(
    (r: number, c: number, value: string) => {
      const next = rows.map((row, i) =>
        i === r ? { ...row, [columns[c].key]: value } : row
      );
      commitRows(next);
    },
    [rows, columns, commitRows]
  );

  const onEditCommit = useCallback(
    (value: string, key: "enter" | "tab" | "esc" | "blur") => {
      const cell = editingRef.current;
      editingRef.current = null;
      setEditing(null);
      if (!cell) return;
      if (key !== "esc" && value !== (rows[cell.r]?.[columns[cell.c].key] || ""))
        setCell(cell.r, cell.c, value);
      if (key === "enter") goTo(cell.r + 1, cell.c);
      else if (key === "tab") goTo(cell.r, cell.c + 1);
      if (key !== "blur") focusGrid();
    },
    [rows, columns, setCell, goTo]
  );

  /** Lưu ô đang sửa (đọc thẳng value từ DOM) — gọi trước khi đổi ô/khối chọn */
  const flushEdit = useCallback(() => {
    const cell = editingRef.current;
    if (!cell) return;
    const el = wrapRef.current?.querySelector<
      HTMLInputElement | HTMLSelectElement
    >(".cell-editor");
    const value = el?.value;
    editingRef.current = null;
    setEditing(null);
    if (
      value !== undefined &&
      value !== (rows[cell.r]?.[columns[cell.c].key] || "")
    )
      setCell(cell.r, cell.c, value);
  }, [rows, columns, setCell]);

  flushEditRef.current = flushEdit;

  /* ------------------------------ Fill (kéo copy) -------------------------- */

  /** Bắt đầu kéo nút vuông góc dưới phải vùng chọn */
  const onFillStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      flushEditRef.current();
      filling.current = true;
      dragging.current = false;
      setFillTo(norm(sel).r2);
    },
    [sel]
  );

  /**
   * Thả chuột -> copy giá trị vùng chọn xuống (hoặc lên) các dòng vừa kéo qua,
   * lặp lại theo chu kỳ giống Excel khi vùng nguồn có nhiều dòng.
   */
  const applyFill = useCallback(() => {
    const s = norm(sel);
    const to = fillTo;
    filling.current = false;
    setFillTo(null);
    if (to === null || (to <= s.r2 && to >= s.r1)) return;

    const srcLen = s.r2 - s.r1 + 1;
    const next = [...rows];
    const writeRow = (r: number, srcIdx: number) => {
      if (r < 0 || r >= next.length) return;
      const src = next[s.r1 + srcIdx];
      if (!src) return;
      const copy = { ...next[r] };
      for (let c = s.c1; c <= s.c2; c++) copy[columns[c].key] = src[columns[c].key] || "";
      next[r] = copy;
    };
    if (to > s.r2) {
      for (let r = s.r2 + 1; r <= to; r++) writeRow(r, (r - s.r2 - 1) % srcLen);
    } else {
      for (let r = s.r1 - 1; r >= to; r--)
        writeRow(r, srcLen - 1 - ((s.r1 - 1 - r) % srcLen));
    }
    commitRows(next);
    setSel({
      r1: Math.min(s.r1, to),
      c1: s.c1,
      r2: Math.max(s.r2, to),
      c2: s.c2,
    });
  }, [sel, fillTo, rows, columns, commitRows]);

  applyFillRef.current = applyFill;

  /* --------------------------- Copy / Cut / Paste -------------------------- */

  const selText = useCallback(() => {
    const s = norm(sel);
    const lines: string[] = [];
    for (let r = s.r1; r <= s.r2; r++) {
      const cells: string[] = [];
      for (let c = s.c1; c <= s.c2; c++)
        cells.push(rows[r]?.[columns[c].key] || "");
      lines.push(cells.join("\t"));
    }
    return lines.join("\n");
  }, [sel, rows, columns]);

  const clearSel = useCallback(() => {
    const s = norm(sel);
    const next = rows.map((row, r) => {
      if (r < s.r1 || r > s.r2) return row;
      const copy = { ...row };
      for (let c = s.c1; c <= s.c2; c++) copy[columns[c].key] = "";
      return copy;
    });
    commitRows(next);
  }, [sel, rows, columns, commitRows]);

  /**
   * Dán dữ liệu vào bảng, hành xử như Excel:
   *  - Vùng chọn LỚN HƠN khối vừa copy -> lặp khối phủ kín vùng chọn
   *    (copy 1 ô rồi bôi nhiều dòng và dán = điền giá trị đó cho mọi dòng).
   *  - Ngược lại -> đổ từ ô đang đứng, thiếu dòng thì tự thêm dòng mới.
   */
  const pasteText = useCallback(
    (text: string) => {
      const lines = text.replace(/\r/g, "").replace(/\n+$/, "").split("\n");
      if (!lines.length) return;
      const block = lines.map((l) => l.split("\t"));
      const bRows = block.length;
      const bCols = Math.max(...block.map((b) => b.length));
      const s = norm(sel);
      const selRows = s.r2 - s.r1 + 1;
      const selCols = s.c2 - s.c1 + 1;
      const next = [...rows];

      // Điền lặp khối vào đúng vùng đang bôi
      if ((selRows > 1 || selCols > 1) && (selRows > bRows || selCols > bCols)) {
        for (let i = 0; i < selRows; i++) {
          const r = s.r1 + i;
          if (r >= next.length) break;
          const row = { ...next[r] };
          for (let j = 0; j < selCols; j++) {
            const col = columns[s.c1 + j];
            if (!col) continue;
            const cell = block[i % bRows][j % bCols];
            row[col.key] = (cell ?? "").trim();
          }
          next[r] = row;
        }
        commitRows(next);
        message.success(`Đã dán vào ${selRows} dòng`);
        return;
      }

      // Dán bình thường: đổ từ ô neo, tự thêm dòng nếu thiếu
      block.forEach((cells, li) => {
        const r = s.r1 + li;
        while (next.length <= r) next.push(makeEmptyRow());
        const row = { ...next[r] };
        cells.forEach((cell, ci) => {
          const col = columns[s.c1 + ci];
          if (col) row[col.key] = cell.trim();
        });
        next[r] = row;
      });
      commitRows(next);
      setSel({
        r1: s.r1,
        c1: s.c1,
        r2: s.r1 + bRows - 1,
        c2: Math.min(columns.length - 1, s.c1 + bCols - 1),
      });
    },
    [sel, rows, columns, commitRows, makeEmptyRow]
  );

  /** Ctrl+D — điền giá trị dòng đầu vùng chọn xuống các dòng dưới */
  const fillDown = useCallback(() => {
    const s = norm(sel);
    if (s.r2 <= s.r1) return;
    const src = rows[s.r1];
    const next = rows.map((row, r) => {
      if (r <= s.r1 || r > s.r2) return row;
      const copy = { ...row };
      for (let c = s.c1; c <= s.c2; c++)
        copy[columns[c].key] = src[columns[c].key] || "";
      return copy;
    });
    commitRows(next);
  }, [sel, rows, columns, commitRows]);

  /* ---------------------------- Thao tác trên dòng ------------------------- */

  /** Chèn n dòng trống tại vị trí at (giống "Insert rows" bên Excel) */
  const insertRows = useCallback(
    (at: number, n: number) => {
      const next = [...rows];
      next.splice(
        Math.max(0, at),
        0,
        ...Array.from({ length: n }, () => makeEmptyRow())
      );
      commitRows(next);
    },
    [rows, commitRows, makeEmptyRow]
  );

  /** Xoá các dòng đang chọn */
  const deleteSelRows = useCallback(() => {
    const s = norm(sel);
    const next = rows.filter((_, r) => r < s.r1 || r > s.r2);
    commitRows(next.length ? next : [makeEmptyRow()]);
    setSel({ r1: s.r1, c1: s.c1, r2: s.r1, c2: s.c2 });
    setActive({ r: Math.max(0, s.r1 - 0), c: s.c1 });
  }, [sel, rows, commitRows, makeEmptyRow]);

  /** Nhân đôi các dòng đang chọn, chèn ngay bên dưới */
  const duplicateSelRows = useCallback(() => {
    const s = norm(sel);
    const copies = rows
      .slice(s.r1, s.r2 + 1)
      .map((row) => ({ ...row, __id: makeEmptyRow().__id }));
    const next = [...rows];
    next.splice(s.r2 + 1, 0, ...copies);
    commitRows(next);
  }, [sel, rows, commitRows, makeEmptyRow]);

  /* ------------------------------ Menu chuột phải -------------------------- */

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const onCellContextMenu = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      flushEditRef.current();
      const s = norm(sel);
      // Bấm chuột phải ngoài vùng đang chọn -> chọn lại đúng ô đó
      if (r < s.r1 || r > s.r2 || c < s.c1 || c > s.c2) {
        setSel({ r1: r, c1: c, r2: r, c2: c });
        setActive({ r, c });
      }
      setMenu({ x: e.clientX, y: e.clientY });
    },
    [sel]
  );

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("mousedown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  /** Copy bằng menu (dùng clipboard API vì không có sự kiện copy của trình duyệt) */
  const menuCopy = useCallback(
    async (cut: boolean) => {
      const text = selText();
      try {
        await navigator.clipboard.writeText(text);
        if (cut) clearSel();
      } catch {
        message.warning("Trình duyệt chặn — dùng Ctrl/⌘ + C để copy");
      }
    },
    [selText, clearSel]
  );

  const menuPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) pasteText(text);
    } catch {
      message.warning("Trình duyệt chặn đọc clipboard — dùng Ctrl/⌘ + V để dán");
    }
  }, [pasteText]);

  /* -------------------------------- Bàn phím ------------------------------- */

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (menu && e.key === "Escape") {
      setMenu(null);
      return;
    }
    if (editing) return;
    const mod = e.metaKey || e.ctrlKey;
    const { r, c } = active;

    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && e.key.toLowerCase() === "d") {
      e.preventDefault();
      fillDown();
      return;
    }
    if (mod && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setSel({ r1: 0, c1: 0, r2: rows.length - 1, c2: columns.length - 1 });
      return;
    }
    // Copy / Cut để trình duyệt bắn sự kiện onCopy/onCut bên dưới
    if (mod && ["c", "x", "v"].includes(e.key.toLowerCase())) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        goTo(r - 1, c, e.shiftKey);
        return;
      case "ArrowDown":
        e.preventDefault();
        goTo(r + 1, c, e.shiftKey);
        return;
      case "ArrowLeft":
        e.preventDefault();
        goTo(r, c - 1, e.shiftKey);
        return;
      case "ArrowRight":
        e.preventDefault();
        goTo(r, c + 1, e.shiftKey);
        return;
      case "Tab":
        e.preventDefault();
        goTo(r, e.shiftKey ? c - 1 : c + 1);
        return;
      case "Enter":
      case "F2":
        e.preventDefault();
        startEdit(r, c);
        return;
      case "Home":
        e.preventDefault();
        goTo(r, 0, e.shiftKey);
        return;
      case "End":
        e.preventDefault();
        goTo(r, columns.length - 1, e.shiftKey);
        return;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        clearSel();
        return;
      default:
        break;
    }
    // Gõ ký tự thường -> vào chế độ sửa với ô trống (như Excel).
    // Cột dạng chọn thì chỉ mở dropdown, không ghi đè bằng ký tự vừa gõ.
    if (!mod && e.key.length === 1) {
      e.preventDefault();
      if (!columns[c]?.options) setCell(r, c, e.key);
      startEdit(r, c);
    }
  };

  const s = norm(sel);

  return (
    <div className="space-y-2">
      <div
        ref={wrapRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseMove={onGridMouseMove}
        onCopy={(e) => {
          e.preventDefault();
          e.clipboardData.setData("text/plain", selText());
        }}
        onCut={(e) => {
          e.preventDefault();
          e.clipboardData.setData("text/plain", selText());
          clearSel();
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text/plain");
          if (!text) return;
          e.preventDefault();
          pasteText(text);
        }}
        className="sheet-grid overflow-auto max-h-[52vh] border border-gray-200 rounded-xl outline-none"
      >
        <table className="border-collapse text-[12px]">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="sticky left-0 z-[3] bg-gray-100 border-b border-r border-gray-200 w-[42px]" />
              {columns.map((col, c) => (
                <th
                  key={col.key}
                  style={{ minWidth: col.width, maxWidth: col.width }}
                  className={`px-2 py-1.5 text-left text-[10px] tracking-wider font-semibold whitespace-nowrap border-b border-r border-gray-200 ${
                    c >= s.c1 && c <= s.c2
                      ? "bg-[#F2EAD9] text-[#8A6D1F]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {col.label}
                  {col.required && <span className="text-red-500"> *</span>}
                  {col.options && (
                    <FiChevronDown
                      size={10}
                      className="inline ml-1 -mt-[1px] text-gray-400"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const r = start + i;
              const inRange = r >= s.r1 && r <= s.r2;
              return (
                <Row
                  key={row.__id || r}
                  row={row}
                  rowIndex={r}
                  columns={columns}
                  selC1={inRange ? s.c1 : -1}
                  selC2={inRange ? s.c2 : -1}
                  isLastSelRow={r === s.r2}
                  fillMark={
                    fillTo !== null &&
                    ((r > s.r2 && r <= fillTo) || (r < s.r1 && r >= fillTo))
                  }
                  onFillStart={onFillStart}
                  activeC={active.r === r ? active.c : -1}
                  editC={editing && editing.r === r ? editing.c : -1}
                  onCellDown={onCellDown}
                  onCellEnter={onCellEnter}
                  onCellDouble={onCellDouble}
                  onCellContext={onCellContextMenu}
                  onEditCommit={onEditCommit}
                  onRowHeaderDown={onRowHeaderDown}
                />
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="p-10 text-center text-gray-400"
                >
                  Chưa có dòng nào — bấm “Thêm dòng” hoặc dán dữ liệu từ Excel
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Menu chuột phải kiểu Excel */}
      {menu && (
        <div
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[2000] min-w-[212px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-[13px]"
        >
          {[
            {
              label: "Cắt",
              hint: "Ctrl+X",
              run: () => menuCopy(true),
            },
            { label: "Sao chép", hint: "Ctrl+C", run: () => menuCopy(false) },
            { label: "Dán", hint: "Ctrl+V", run: menuPaste },
            { label: "-" },
            {
              label: "Chèn dòng phía trên",
              run: () => insertRows(norm(sel).r1, 1),
            },
            {
              label: "Chèn dòng phía dưới",
              run: () => insertRows(norm(sel).r2 + 1, 1),
            },
            { label: "Nhân đôi dòng", run: duplicateSelRows },
            { label: "Xoá dòng", danger: true, run: deleteSelRows },
            { label: "-" },
            { label: "Điền xuống", hint: "Ctrl+D", run: fillDown },
            { label: "Xoá nội dung", hint: "Delete", run: clearSel },
            { label: "-" },
            { label: "Hoàn tác", hint: "Ctrl+Z", run: undo },
            { label: "Làm lại", hint: "Ctrl+Shift+Z", run: redo },
          ].map((item, i) =>
            item.label === "-" ? (
              <div key={i} className="h-px bg-gray-100 my-1" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  setMenu(null);
                  item.run?.();
                }}
                className={`w-full flex items-center justify-between gap-6 px-3 py-1.5 border-0 bg-transparent cursor-pointer text-left hover:bg-gray-100 ${
                  (item as any).danger ? "text-red-500" : "text-gray-700"
                }`}
              >
                {item.label}
                {item.hint && (
                  <span className="text-[11px] text-gray-300">{item.hint}</span>
                )}
              </button>
            )
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap text-[11px] text-gray-400">
        <span className="flex items-center gap-2 flex-wrap">
          <button
            onClick={undo}
            title="Hoàn tác (Ctrl/⌘ + Z)"
            className="px-2 py-1 rounded border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-[#C6A15B]"
          >
            ↶ Hoàn tác
          </button>
          <button
            onClick={redo}
            title="Làm lại (Ctrl/⌘ + Shift + Z)"
            className="px-2 py-1 rounded border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-[#C6A15B]"
          >
            ↷ Làm lại
          </button>
          Chuột phải để mở menu · Ctrl/⌘ + C · X · V copy/cắt/dán nhiều ô ·
          Ctrl/⌘+D điền xuống ·
          Ctrl/⌘+Z hoàn tác · Delete xoá vùng chọn · F2 hoặc nháy đúp để sửa
        </span>
        {totalPages > 1 && (
          <span className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-gray-200 bg-white cursor-pointer disabled:opacity-40"
            >
              ‹
            </button>
            Trang {page}/{totalPages}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded border border-gray-200 bg-white cursor-pointer disabled:opacity-40"
            >
              ›
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
