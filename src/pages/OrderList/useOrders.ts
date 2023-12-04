import { useFirestoreQuery } from "@react-query-firebase/firestore";
import { query, collection, orderBy } from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import { OrdersModel } from "../../models/OrdersModel";

export function useOrders() {
  const ref = query(
    collection(firestore, "orders"),
    orderBy("created", "desc") // Assuming 'createDate' is stored as a date in ISO format.
  );

  // Provide the query to the hook
  const queryContract = useFirestoreQuery(["orders"], ref);
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
