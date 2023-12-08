import { produce } from "immer";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface ProductTypeSlice {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  productsType: any[];
  setProductsType: (productsType: any) => void;
  removeProductTypeId: (productsTypeId: string) => void;
}

const createProductTypeSlice: StateCreator<
  ProductTypeSlice,
  [],
  [["zustand/immer", never]],
  ProductTypeSlice
> = immer((set) => ({
    isLoading: true,
    setIsLoading: (isLoading: boolean) => set((state) => {
      state.isLoading = isLoading
    }),
    productsType: [],
    setProductsType: (u) =>
    set((state) => {
      state.productsType = u;
    }),
    removeProductTypeId: (productsTypeId: string) =>
    set(
      produce((item) => {
        const orderIndex = item.productsType.findIndex(
          (el: any) => el.id === productsTypeId
        );
        item.productsType.splice(orderIndex, 1);
      })
    ),
}));

const useProductTypeSlice = create(
  devtools(
    createProductTypeSlice
  )
);


// const useProductTypeSlice = create(
//   devtools(
//     persist<ProductTypeSlice>(
//       (...a) => ({
//         ...createProductTypeSlice(...a),
//       }),
//       {
//         name: "product-type-store",
//       }
//     )
//   )
// );

export { useProductTypeSlice };
