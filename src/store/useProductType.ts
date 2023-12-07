import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface ProductTypeSlice {
  productsType: any[];
  setProductsType: (productsType: any) => void;
}

const createProductTypeSlice: StateCreator<
  ProductTypeSlice,
  [],
  [["zustand/immer", never]],
  ProductTypeSlice
> = immer((set) => ({
    productsType: [],
    setProductsType: (u) =>
    set((state) => {
      state.productsType = u;
    }),
}));

const useProductTypeSlice = create(
  devtools(
    persist<ProductTypeSlice>(
      (...a) => ({
        ...createProductTypeSlice(...a),
      }),
      {
        name: "product-type-store",
      }
    )
  )
);

export { useProductTypeSlice };
