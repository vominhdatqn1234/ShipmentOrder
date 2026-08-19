import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import ExcelGrid, { GridColumn, GridRowData } from "./ExcelGrid";

const COLUMNS: GridColumn[] = [
  {
    key: "storeName",
    label: "Shop",
    width: 160,
    options: [
      { value: "CamTran", label: "CamTran" },
      { value: "VintaCrew", label: "VintaCrew" },
      { value: "Namcrew", label: "Namcrew" },
    ],
  },
  { key: "orderCode", label: "Mã đơn", required: true, width: 120 },
];

function Harness({ rows: n = 1 }: { rows?: number }) {
  const [rows, setRows] = useState<GridRowData[]>(
    Array.from({ length: n }, (_, i) => ({
      __id: `r${i + 1}`,
      storeName: i === 0 ? "CamTran" : "",
      orderCode: i === 0 ? "4109753460" : "",
    }))
  );
  return (
    <ExcelGrid
      columns={COLUMNS}
      rows={rows}
      onRowsChange={setRows}
      makeEmptyRow={() => ({ __id: `n${Math.random()}` })}
    />
  );
}

test("bấm ô Shop mở dropdown và chọn được shop khác", () => {
  render(<Harness />);

  // Ban đầu chưa có danh sách
  expect(screen.queryByText("VintaCrew")).toBeNull();

  // Bấm 1 lần vào ô Shop -> dropdown hiện đủ shop + lựa chọn để trống
  fireEvent.mouseDown(screen.getByText("CamTran"));
  expect(screen.getByText("VintaCrew")).toBeTruthy();
  expect(screen.getByText("Namcrew")).toBeTruthy();
  expect(screen.getByText("— Trống —")).toBeTruthy();

  // Chọn shop khác -> giá trị ô đổi theo, dropdown đóng
  fireEvent.mouseDown(screen.getByText("VintaCrew"));
  expect(screen.getByText("VintaCrew")).toBeTruthy();
  expect(screen.queryByText("Namcrew")).toBeNull();
});

test("kéo nút fill từ ô xuống dòng dưới thì copy giá trị xuống", () => {
  const { container } = render(<Harness rows={3} />);
  // Chọn ô "Mã đơn" dòng 1
  const cell = container.querySelector('[data-cell="0-1"]') as HTMLElement;
  fireEvent.mouseDown(cell);
  // Kéo nút vuông ở góc dưới phải xuống dòng 3
  const handle = cell.querySelector("span.cursor-crosshair") as HTMLElement;
  expect(handle).toBeTruthy();
  fireEvent.mouseDown(handle);
  fireEvent.mouseEnter(
    container.querySelector('[data-cell="1-1"]') as HTMLElement
  );
  fireEvent.mouseEnter(
    container.querySelector('[data-cell="2-1"]') as HTMLElement
  );
  fireEvent.mouseUp(window);
  // Cả 3 dòng đều mang mã đơn của dòng đầu
  expect(screen.getAllByText("4109753460")).toHaveLength(3);
});

test("copy 1 ô rồi bôi nhiều dòng và dán -> điền cho tất cả dòng đã bôi", () => {
  const { container } = render(<Harness rows={4} />);
  const grid = container.querySelector(".sheet-grid") as HTMLElement;

  // Bôi cột "Mã đơn" từ dòng 1 xuống dòng 4
  fireEvent.mouseDown(container.querySelector('[data-cell="0-1"]') as Element);
  fireEvent.mouseEnter(container.querySelector('[data-cell="3-1"]') as Element);
  fireEvent.mouseUp(window);

  // Dán 1 giá trị -> lặp cho cả vùng đang bôi
  fireEvent.paste(grid, {
    clipboardData: { getData: () => "999999" },
  });
  expect(screen.getAllByText("999999")).toHaveLength(4);
});

test("dropdown không bị đóng ngay bởi chính cú click mở nó", () => {
  render(<Harness />);
  fireEvent.mouseDown(screen.getByText("CamTran"));
  // Giả lập sự kiện mousedown lan tới window trong cùng nhịp click
  fireEvent.mouseDown(window);
  expect(screen.getByText("Namcrew")).toBeTruthy();
});
