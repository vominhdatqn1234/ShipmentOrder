import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "../../../lib/firebase";
import { EmployeeModel } from "../../../models";
import { useEmployeeSlice } from "../../../store/useEmployeeSlice";
import { useUser } from "../../../store/useUser";
import { useProductTypeSlice } from "../../../store/useProductType";

export function useProductTypeHook() {
  const { user } = useUser();
  const [data, setData] = useState<any[]>([]);
  //   const [isLoading, setIsLoading] = useState(true);
  const { setProductsType, setIsLoading } = useProductTypeSlice();

  useEffect(() => {
    const handleFetchData = async () => {
      try {
        const ref = query(
          collection(firestore, "employee"),
          where("id", "==", user?.id),
          limit(1)
        );
        let arr: any = [];
        const querySnapshot = await getDocs(ref);
        querySnapshot.forEach((doc) => {
          arr.push({ id: doc.id, ...doc.data() });
        });
        setData(arr[0]?.productTypes);
        setProductsType(arr[0]?.productTypes);
        // setIsLoading(false);
        // setEmployees(arr);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    handleFetchData();
  }, []);

  return {
    data: data as EmployeeModel[],
    // isLoading,
  };
}
