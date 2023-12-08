import { produce } from "immer";
import { StateCreator, create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { EmployeeModel } from "../models";

interface EmployeeSlice {
  employees: EmployeeModel[];
  setEmployees: (employee: any) => void;
  updateEmployeeId: (employeeId: string, productTypes: any) => void;
  updateEmployee: (employeeId: string, payload: any) => void;
  removeEmployeeId: (employeeId: string) => void;
}

const createEmployeeSlice: StateCreator<
  EmployeeSlice,
  [],
  [["zustand/immer", never]],
  EmployeeSlice
> = immer((set) => ({
    employees: [],
    setEmployees: (u) =>
    set((state) => {
      state.employees = u;
    }),
    updateEmployeeId: (employeeId: string, productTypes: any) => {
    set((state) => ({
      employees: state.employees.map((employee: any) =>
      employee.id === employeeId ? { ...employee, productTypes } : employee
      ),
    }));
  },
  updateEmployee: (employeeId: string, payload: any) => {
    set((state) => ({
      employees: state.employees.map((employee: any) =>
      employee.id === employeeId ? { ...payload } : employee
      ),
    }));
  },
  removeEmployeeId: (employeeId: string) =>
    set(
      produce((item) => {
        const employeeIndex = item.employees.findIndex(
          (el: any) => el.id === employeeId
        );
        item.employees.splice(employeeIndex, 1);
      })
    ),
}));

const useEmployeeSlice = create(
  devtools(
    persist<EmployeeSlice>(
      (...a) => ({
        ...createEmployeeSlice(...a),
      }),
      {
        name: "orders-store",
      }
    )
  )
);

export { useEmployeeSlice };
