import { useFirestoreQuery } from "@react-query-firebase/firestore";
import { query, collection } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { WeddingDressTypeModel } from "../../../models/WeddingDressModel";

export function useWeddingDressType() {
  const ref = query(collection(firestore, "weddingDressType"));
  // Provide the query to the hook
  const queryWeddingDressType = useFirestoreQuery(["weddingDressType"], ref);
  const snapshot = queryWeddingDressType.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });

  const refetch = async () => {
    try {
      await queryWeddingDressType.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error("Error refetching wedding dress data:", error);
    }
  };

  return {
    isError: queryWeddingDressType.isError,
    isLoading: queryWeddingDressType.isLoading,
    data: data as WeddingDressTypeModel[],
    refetch,
  };
}
