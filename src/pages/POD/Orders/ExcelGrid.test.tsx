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

function Harness() {
  const [rows, setRows] = useState<GridRowData[]>([
    { __id: "r1", storeName: "CamTran", orderCode: "4109753460" },
  ]);
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

test("dropdown không bị đóng ngay bởi chính cú click mở nó", () => {
  render(<Harness />);
  fireEvent.mouseDown(screen.getByText("CamTran"));
  // Giả lập sự kiện mousedown lan tới window trong cùng nhịp click
  fireEvent.mouseDown(window);
  expect(screen.getByText("Namcrew")).toBeTruthy();
});
