import { collection, getDocs, query } from "lib/db";
import { useEffect, useState } from "react";
import { firestore } from "../../../lib/firebase";
import { EmployeeModel } from "../../../models";
import { useEmployeeSlice } from "../../../store/useEmployeeSlice";

export function useEmployeesHook() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setEmployees } = useEmployeeSlice();

  useEffect(() => {
    const handleFetchData = async () => {
      try {
        const ref = query(collection(firestore, "employee"));
        let arr: any = [];
        const querySnapshot = await getDocs(ref);
        querySnapshot.forEach((doc) => {
          arr.push({ id: doc.id, ...doc.data() });
        });

        setData(arr);
        setEmployees(arr);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    handleFetchData();
  }, []);

  return {
    data: data as EmployeeModel[],
    isLoading,
  };
}
