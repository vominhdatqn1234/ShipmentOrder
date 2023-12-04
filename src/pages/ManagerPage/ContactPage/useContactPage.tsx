import { useFirestoreQuery } from "@react-query-firebase/firestore";
import { query, collection } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { ContactPageModel } from "../../../models/ContactPageModel";

export function useContactPage() {
  const ref = query(collection(firestore, "contactPage"));
  // Provide the query to the hook
  const queryContact = useFirestoreQuery(["contactPage"], ref);
  const snapshot = queryContact.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });

  const refetch = async () => {
    try {
      await queryContact.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error("Error refetching wedding dress data:", error);
    }
  };

  return {
    isError: queryContact.isError,
    isLoading: queryContact.isLoading,
    data: data as ContactPageModel[],
    refetch,
  };
}
