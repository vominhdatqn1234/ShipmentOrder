import dayjs from "dayjs";
import { collection, getDocs, query, where } from "lib/db";
import { useEffect, useState } from "react";
import { firestore } from "../../lib/firebase";
import { OrdersModel } from "../../models/OrdersModel";
import { useOrderSlice } from "../../store/useOrderSlice";
import { useUser } from "../../store/useUser";
import { map } from "lodash";

export function useOrdersHook() {
  const { user } = useUser();
  const { setOrders, setIsLoading } = useOrderSlice();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const handleFetchData = async () => {
      try {
        const admin = user?.permission === "Admin";
        const todayStart = dayjs().startOf("day");
        const todayEnd = dayjs().endOf("day");
        const adminRef = query(
          collection(firestore, "orders"),
          where("created", ">=", todayStart.toISOString()),
          where("created", "<=", todayEnd.toISOString())
        );
        const clientRef = query(
          collection(firestore, "orders"),
          where("createdUser", "==", user?.id),
          where("created", ">=", todayStart.toISOString()),
          where("created", "<=", todayEnd.toISOString())
        );
        // where("created", ">=", dayjs().subtract(1, "month").toISOString()),
        // where("created", "<=", dayjs().toISOString())
        let arr: any[] = [];
        if (admin) {
          const querySnapshot = await getDocs(adminRef);
          querySnapshot.forEach((doc) => {
            const mapParentIdProductType = map(doc.data()?.orders, (order) => ({
              ...order,
              orders: doc.data()?.orders,
              parentId: doc.id,
            }));
            arr.push(...mapParentIdProductType);
            // arr.push({ id: doc.id, ...doc.data() });
          });
        } else {
          const querySnapshot = await getDocs(clientRef);
          querySnapshot.forEach((doc) => {
            const mapParentIdProductType = map(doc.data()?.orders, (order) => ({
              ...order,
              orders: doc.data()?.orders,
              parentId: doc.id,
            }));
            arr.push(...mapParentIdProductType);
            // arr.push({ id: doc.id, ...doc.data() });
          });
        }
        setData(arr);
        setOrders(arr);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    handleFetchData();
  }, []);

  return {
    data: data as OrdersModel[],
  };
}
