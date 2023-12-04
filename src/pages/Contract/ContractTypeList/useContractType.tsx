import { useFirestoreQuery } from "@react-query-firebase/firestore";
import { query, collection } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { ContractType } from "../../../models/ContractModel";

export function useContractType() {
  const ref = query(collection(firestore, "contractType"));
  // Provide the query to the hook
  const queryContractType = useFirestoreQuery(["contractType"], ref);
  const snapshot = queryContractType.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });

  const refetch = async () => {
    try {
      await queryContractType.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error("Error refetching wedding dress data:", error);
    }
  };

  return {
    isError: queryContractType.isError,
    isLoading: queryContractType.isLoading,
    data: data as ContractType[],
    refetch,
  };
}
