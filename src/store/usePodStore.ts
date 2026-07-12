import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PodStoreState {
  selectedStoreId: string;
  setSelectedStoreId: (id: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const usePodStore = create<PodStoreState>()(
  persist(
    (set) => ({
      selectedStoreId: "",
      setSelectedStoreId: (id: string) => set({ selectedStoreId: id }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (v: boolean) => set({ sidebarCollapsed: v }),
    }),
    { name: "pod-store" }
  )
);
