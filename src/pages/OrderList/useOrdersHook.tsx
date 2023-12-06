import dayjs from "dayjs";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "../../lib/firebase";
import { OrdersModel } from "../../models/OrdersModel";
import { useOrderSlice } from "../../store/useOrderSlice";
import { useUser } from "../../store/useUser";

export function useOrdersHook() {
  const { user } = useUser();
  const { setOrders } = useOrderSlice();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const handleFetchData = async () => {
      const admin = user?.permission === "Admin";
      const isAdmin =
        user?.permission === "Admin"
          ? (where("created", ">=", dayjs().subtract(1, "month").toISOString()),
            where("created", "<=", dayjs().toISOString()))
          : ((where(
              "created",
              ">=",
              dayjs().subtract(1, "month").toISOString()
            ),
            where("created", "<=", dayjs().toISOString())),
            where("userId", "==", user?.id));
      const ref = query(collection(firestore, "orders"), isAdmin);
      const querySnapshot = await getDocs(ref);
      let data: any = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setData(data);
      setOrders(data);
    };
    handleFetchData();
  }, []);

  return {
    data: data as OrdersModel[],
  };
}
