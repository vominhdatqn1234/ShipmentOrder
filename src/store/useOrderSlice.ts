import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface OrderSlice {
  orders: [];
  setOrders: (orders: any) => void;
}

const createOrderSlice: StateCreator<
  OrderSlice,
  [],
  [["zustand/immer", never]],
  OrderSlice
> = immer((set) => ({
  orders: [],
  setOrders: (u) =>
    set((state) => {
      state.orders = u;
    }),
}));

const useOrderSlice = create(
  devtools(
    persist<OrderSlice>(
      (...a) => ({
        ...createOrderSlice(...a),
      }),
      {
        name: "orders-store",
      }
    )
  )
);

export { useOrderSlice };
