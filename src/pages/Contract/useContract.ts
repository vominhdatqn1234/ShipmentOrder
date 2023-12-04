import { useFirestoreQuery } from "@react-query-firebase/firestore";
import { query, collection, orderBy } from "firebase/firestore";
import { useQuery, useQueryClient } from "react-query";
import { firestore } from "../../lib/firebase";
import { ContractModel } from "../../models";

export function useContract() {
  const ref = query(
    collection(firestore, "contract"),
    orderBy("createDate", "desc") // Assuming 'createDate' is stored as a date in ISO format.
  );

  // const ref = query(collection(firestore, 'contract'));
  // Provide the query to the hook
  const queryContract = useFirestoreQuery(["contract"], ref);
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
    data: data as ContractModel[],
    refetch: refetchContract,
  };
}
