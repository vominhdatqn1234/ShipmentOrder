import { useFirestoreQuery } from "lib/queryHooks";
import { query, collection, orderBy } from "lib/db";
import { firestore } from "../../../lib/firebase";
import { ContractType } from "../../../models/ContractModel";

export function useContractType() {
  // const ref = query(collection(firestore, "productType"));
  const ref = query(
    collection(firestore, "productType"),
    orderBy("name", "desc")
    // orderBy("size", "desc")
  );
  // Provide the query to the hook
  const queryContractType = useFirestoreQuery(["productType"], ref);
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
