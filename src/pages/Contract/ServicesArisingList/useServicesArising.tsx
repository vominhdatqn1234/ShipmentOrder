import { useFirestoreQuery } from "@react-query-firebase/firestore";
import { query, collection } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { ContractType, ServicesArising } from "../../../models/ContractModel";

export function useServicesArising() {
  const ref = query(collection(firestore, "servicesArising"));
  // Provide the query to the hook
  const queryServicesArising = useFirestoreQuery(["servicesArising"], ref);
  const snapshot = queryServicesArising.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });

  const refetch = async () => {
    try {
      await queryServicesArising.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error("Error refetching wedding dress data:", error);
    }
  };

  return {
    isError: queryServicesArising.isError,
    isLoading: queryServicesArising.isLoading,
    data: data as ServicesArising[],
    refetch,
  };
}
