import dayjs from "dayjs";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { map } from "lodash";
import { firestore } from "../../../lib/firebase";
import { RevenueType } from "../../../models/Revenue";
import { useRevenueSlice } from "../../../store/useRevenue";

export function useRevenue() {
  const { setRevenue, setIsLoading } = useRevenueSlice();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const handleFetchData = async () => {
      try {
        const revenueRef = query(
          collection(firestore, "revenue"),
          // where("year", "==", dayjs().year()),
        );
        let arr: any = []
        const querySnapshot = await getDocs(revenueRef);
        querySnapshot.forEach((doc) => {
          arr.push({ ...doc.data(), id: doc.id });
        });
        setData(arr);
        setRevenue(arr);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    handleFetchData();
  }, []);

  return {
    data: data as RevenueType[],
  };
}
