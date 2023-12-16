import { produce } from "immer";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface RevenueSlice {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  revenue: any[];
  setRevenue: (revenue: any) => void;
  updateRevenueId: (revenueId: string, payload: any) => void;
  removeRevenueId: (revenueId: string) => void;
}

const createRevenueSlice: StateCreator<
  RevenueSlice,
  [],
  [["zustand/immer", never]],
  RevenueSlice
> = immer((set) => ({
    isLoading: true,
    setIsLoading: (isLoading: boolean) => set((state) => {
      state.isLoading = isLoading
    }),
    revenue: [],
    setRevenue: (u) =>
    set((state) => {
      state.revenue = u;
    }),
    updateRevenueId: (revenueId: string, revenue: any) => {
      set(produce((item) => {
        const revenueIndex = item.revenue.findIndex(
          (el: any) => el.id === revenueId
        );
        if (revenueIndex !== -1) item.revenue[revenueIndex] = revenue
      }));
    },
    removeRevenueId: (revenueId: string) =>
    set(
      produce((item) => {
        const orderIndex = item.revenue.findIndex(
          (el: any) => el.id === revenueId
        );
        item.revenue.splice(orderIndex, 1);
      })
    ),
}));

const useRevenueSlice = create(
  devtools(
    createRevenueSlice
  )
);


export { useRevenueSlice };
