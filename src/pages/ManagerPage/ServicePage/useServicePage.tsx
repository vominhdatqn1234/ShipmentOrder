import { useFirestoreQuery } from "@react-query-firebase/firestore";
import { query, collection } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { ServicePageModel } from "../../../models/ServicePageModel";

export function useServicePage() {
  const ref = query(collection(firestore, "servicePage"));
  // Provide the query to the hook
  const queryService = useFirestoreQuery(["servicePage"], ref);
  const snapshot = queryService.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });

  const refetch = async () => {
    try {
      await queryService.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error("Error refetching wedding dress data:", error);
    }
  };

  return {
    isError: queryService.isError,
    isLoading: queryService.isLoading,
    data: data as ServicePageModel[],
    refetch,
  };
}
