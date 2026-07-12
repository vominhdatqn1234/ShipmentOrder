import { useFirestoreQuery } from "lib/queryHooks";
import { query, collection, orderBy, where, limit, getDocs } from "lib/db";
import { firestore } from "../../lib/firebase";
import { OrdersModel } from "../../models/OrdersModel";
import { useUser } from "../../store/useUser";
import dayjs from "dayjs";

export function useOrders() {
  const { user } = useUser()
  const isAdmin = user?.permission === 'Admin' ? where("created", "<=", dayjs().toISOString()) : where("userId", "==", user?.id)
  const ref = query(
    collection(firestore, "orders"),
    isAdmin
    // where("userId", "==", user?.id),
  );
  // Provide the query to the hook
  const queryContract = useFirestoreQuery(["orders", { userId: user?.id }], ref, 
);
  const snapshot = queryContract.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });

  const refetchContract = async () => {
    try {
      await queryContract.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error("Error refetching wedding dress data:", error);
    }
  };

  return {
    isError: queryContract.isError,
    isLoading: queryContract.isLoading,
    data: data as OrdersModel[],
    refetch: refetchContract,
  };
}
