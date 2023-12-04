import { StateCreator, create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UserSlice {
  user: any;
  setUser: (user: any) => void;
}

const createUserSlice: StateCreator<UserSlice,
	[],
	[["zustand/immer", never]],
	UserSlice
> = immer((set) => ({
  user: {},
  setUser: (u) =>
    set((state) => {
      state.user = u;
    }),
}))


const useUser = create(
  devtools(
      persist<UserSlice>(
          (...a) => ({
              ...createUserSlice(...a),
          }),
          {
              name: 'user-store',
              // partialize: (state) => ({ services: state.services })
              // partialize: (state) =>
              //     Object.fromEntries(
              //         Object.entries(state).filter(([key]) => !['services'].includes(key))
              //     ),
          }
      )
  )
)

// const useUser = create(
//   persist(
//     immer<UserState>((set) => ({
//       user: {},
//       setUser: (u) =>
//         set((state) => {
//           state.user = u;
//         }),
//     }))
//   )
// );
export { useUser };
