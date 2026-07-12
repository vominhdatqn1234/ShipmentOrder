import { InputNumber, message } from "antd";
import { useState } from "react";
import {
  useBaseProductMutations,
  useBaseProducts,
} from "../../hooks/useAdmin";

export default function PodPrices() {
  const { products } = useBaseProducts();
  const { update } = useBaseProductMutations();
  const [savingId, setSavingId] = useState<string | null>(null);

  const savePrice = async (id: string, baseCost: number) => {
    setSavingId(id);
    try {
      await update.mutateAsync({ id, baseCost });
      message.success("Đã cập nhật giá");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold text-gray-900 m-0">Bảng giá POD</h1>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        Thiết lập Base Cost từng phôi — giá này hiển thị trong catalog của
        seller và dùng tính doanh thu phôi.
      </p>

      <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="p-3 font-medium">Phôi</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium text-right">Base Cost ($)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-50">
                <td className="p-3 font-medium text-gray-900">{p.name}</td>
                <td className="p-3 text-gray-500">{p.sku}</td>
                <td className="p-3 text-right">
                  <InputNumber
                    min={0}
                    step={0.5}
                    prefix="$"
                    className="w-[130px]"
                    defaultValue={p.baseCost}
                    disabled={savingId === p.id}
                    onBlur={(e) => {
                      const v = parseFloat(
                        (e.target as HTMLInputElement).value.replace("$", "")
                      );
                      if (!isNaN(v) && v !== p.baseCost) savePrice(p.id, v);
                    }}
                  />
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr>
                <td colSpan={3} className="p-12 text-center text-gray-400">
                  Chưa có phôi — thêm ở Kho Phôi POD
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
