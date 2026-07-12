import { Input, Select } from "antd";
import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useBaseProducts } from "../../../hooks/usePod";
import { BaseProduct } from "../../../models/pod";

type SortKey = "newest" | "priceAsc" | "priceDesc" | "nameAsc";

export default function Catalog() {
  const { products } = useBaseProducts();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category || "Khác"))),
    [products]
  );

  const list = useMemo(() => {
    let out = products.filter(
      (p) =>
        (tab === "all" || p.category === tab) &&
        (!search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()))
    );
    if (sort === "priceAsc") out = [...out].sort((a, b) => a.baseCost - b.baseCost);
    else if (sort === "priceDesc")
      out = [...out].sort((a, b) => b.baseCost - a.baseCost);
    else if (sort === "nameAsc")
      out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [products, tab, search, sort]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-2xl font-extrabold text-[#171826] m-0">
          Danh mục Phôi sản phẩm (Base Catalog)
        </h1>
        <p className="text-gray-500 m-0 mt-1">
          Khám phá và tra cứu giá gốc (Base Cost) các mẫu phôi chuẩn từ xưởng.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 rounded-lg text-sm cursor-pointer border-0 ${
              tab === "all"
                ? "bg-[#171826] text-white font-bold"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Tất cả Phôi
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`px-4 py-2 rounded-lg text-sm cursor-pointer border-0 ${
                tab === c
                  ? "bg-[#171826] text-white font-bold"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Input
            prefix={<FiSearch className="text-gray-400" />}
            placeholder="Tìm theo mã SKU hoặc tên phôi..."
            className="max-w-md h-[42px] rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-widest text-gray-500 font-bold">
              SẮP XẾP:
            </span>
            <Select
              value={sort}
              onChange={(v) => setSort(v)}
              className="w-[190px]"
              options={[
                { value: "newest", label: "Mới nhất" },
                { value: "priceAsc", label: "Giá: Thấp đến Cao" },
                { value: "priceDesc", label: "Giá: Cao đến Thấp" },
                { value: "nameAsc", label: "Tên: A-Z" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {list.map((p: BaseProduct) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
          >
            <div className="relative m-4 mb-0 h-[210px] bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-300 text-xl tracking-widest">
                  No Image
                </span>
              )}
              <span
                className={`absolute top-2 right-2 text-[10px] font-bold tracking-widest px-2 py-1 rounded ${
                  p.inStock
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-400 text-white"
                }`}
              >
                {p.inStock ? "IN STOCK" : "OUT OF STOCK"}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <span className="self-start text-[11px] font-bold text-[#3B82F6] bg-[#EFF4FF] rounded px-2 py-0.5">
                {p.category || "Khác"}
              </span>
              <div className="font-extrabold text-[#171826] text-lg mt-2">
                {p.name}
              </div>
              <div className="text-gray-400 text-sm">SKU: {p.sku}</div>
              <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-[10px] tracking-widest text-gray-400 font-bold">
                    BASE COST (TỪ)
                  </div>
                  <div className="text-xl font-extrabold text-[#C6A15B]">
                    ${p.baseCost.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate("/dashboard/orders", {
                      state: { createWithSku: p.sku },
                    })
                  }
                  className="bg-[#171826] text-white text-sm font-bold px-4 py-2 rounded-lg cursor-pointer border-0 hover:bg-black"
                >
                  Lên đơn →
                </button>
              </div>
            </div>
          </div>
        ))}
        {!list.length && (
          <div className="col-span-full text-center text-gray-400 py-16">
            Không tìm thấy phôi nào
          </div>
        )}
      </div>
    </div>
  );
}
