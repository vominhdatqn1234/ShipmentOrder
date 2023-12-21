import { produce } from "immer";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface OrderSlice {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  orders: [];
  search: [];
  newTerm: string;
  setSearch: (result: any) => void;
  setOrders: (orders: any) => void;
  setNewTerm: (term: string) => void;
  updateOrderId: (orderId: string, orders: any) => void;
  updateSearchOrderId: (orderId: string, orders: any) => void;
  removeOrderId: (orderId: string) => void;
}

const createOrderSlice: StateCreator<
  OrderSlice,
  [],
  [["zustand/immer", never]],
  OrderSlice
> = immer((set) => ({
  search: [],
  newTerm: "",
  setNewTerm: (u) =>
    set((state) => {
      state.newTerm = u;
    }),
  setSearch: (u) =>
    set((state) => {
      state.search = u;
    }),
  orders: [],
  setOrders: (u) =>
    set((state) => {
      state.orders = u;
    }),
  isLoading: true,
  setIsLoading: (isLoading: boolean) =>
    set((state) => {
      state.isLoading = isLoading;
    }),
  // updateOrderId: (orderId: string, orders: any) => {
  //   set((state) => ({
  //     orders: state.orders.map((order: any) =>
  //       order.id === orderId ? { ...order, orders } : order
  //     ),
  //   }));
  // },
  // updateOrderId: (orderId: string, payload: any) => {
  //   set((state) => ({
  //     orders: state.orders.map((order: any) => {
  //       if (order.orderId === orderId) {
  //         console.log('payloadpayload', payload)
  //         return payload
  //       }
  //       return order
  //     }

  //     ),
  //   }));
  // },
  updateOrderId: (orderId: string, payload: any) =>
    set(
      produce((item: any) => {
        const orderIndex = item.orders.findIndex(
          (el: any) => el.orderId === orderId
        );
        if (orderIndex !== -1) item.orders[orderIndex] = payload;
      })
    ),
    updateSearchOrderId: (orderId: string, payload: any) =>
    set(
      produce((item: any) => {
        const orderIndex = item.search.findIndex(
          (el: any) => el.orderId === orderId
        );
        if (orderIndex !== -1) item.search[orderIndex] = payload;
      })
    ),
  removeOrderId: (orderId: string) =>
    set(
      produce((item) => {
        const orderIndex = item.orders.findIndex(
          // (el: any) => el.id === orderId
          (el: any) => el.orderId === orderId
        );
        item.orders.splice(orderIndex, 1);
      })
    ),
}));

// const useOrderSlice = create(
//   devtools(
//     persist<OrderSlice>(
//       (...a) => ({
//         ...createOrderSlice(...a),
//       }),
//       {
//         name: "orders-store",
//       }
//     )
//   )
// );
const useOrderSlice = create(devtools(createOrderSlice));

export { useOrderSlice };
