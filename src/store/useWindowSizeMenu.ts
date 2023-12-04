import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type WindowSizeState = {
    isActiveMenu: boolean;
    setIsActiveMenu: (isActiveMenu: boolean) => void;
};

const useWindowSizeMenu = create(
    devtools(
        immer<WindowSizeState>((set) => ({
            isActiveMenu: false,
            setIsActiveMenu: (u) =>
                set((state) => {
                    state.isActiveMenu = u;
                }),
        }))
    )
);
export { useWindowSizeMenu };
